let token = null;

const sites = [
  "Fysikk2A-VGVALL",
  "Religion3STG-VGVALL"
]

let currWeek = getWeekNumber(new Date())

window.onload = async function() {
  token = await $.getJSON("./API/getAccessToken");

  // TODO: Loading animation

  let notebooksP = []
  for (site of sites) {
    notebooksP.push(getNotebook(site))
  }
  let notebooks = await Promise.all(notebooksP)

  let tables = []
  for (notebook of notebooks) {
    tables.push(await findTable(notebook.content))
  }

  let subjects = []
  for (let i = 0; i < tables.length; i++) {
    subjects.push({
      site: notebooks[i].site,
      plan: await extractPlan(tables[i])
    })
  }

  let container = document.getElementById("hContainer")

  function displayWeek(week) {
    currWeek = week
    if (currWeek > 53) {
      currWeek = 1
    } else if (currWeek < 1) {
      currWeek = 53
    }
    container.innerHTML = "";
    let weekDOM = createWeekDOM(currWeek, subjects)
    container.appendChild(weekDOM)
  }

  displayWeek(currWeek);

  swipedetect(container, dir => {
    displayWeek(currWeek + dir);
  })

  document.onkeydown = function(e) {
    if (e.keyCode == '37') {
       // left arrow
       displayWeek(currWeek - 1);
    }
    else if (e.keyCode == '39') {
       // right arrow
       displayWeek(currWeek + 1);
    }
  }
}

function createWeekDOM(week, subjects) {
  let day = {
    "man": DOMcreateDay("Mandag"),
    "tir": DOMcreateDay("Tirsdag"),
    "ons": DOMcreateDay("Onsdag"),
    "tor": DOMcreateDay("Torsdag"),
    "fre": DOMcreateDay("Fredag")
  };

  for (let s of subjects) {
    for (let l of s.plan) {
      if (l.week == week) {
        let lesson = DOMcreateLesson(s.site.displayName, l);
        let key = l.weekDay.trim().toLowerCase()
        if (key.length == 3) {
          day[key].appendChild(lesson)
        }
      }
    }
  }

  let ret = DOMcreateWeek(week);

  for (const [key, value] of Object.entries(day)) {
    ret.appendChild(value)
  }

  return ret
}

function DOMcreateWeek(week) {
  let ret = document.createElement("div")
  ret.classList.add("week")
  //ret.id = "W" + week

  let weekHeading = document.createElement("h3")
  weekHeading.innerHTML = "Uke " + week
  ret.appendChild(weekHeading)

  return ret
}

function DOMcreateDay(day) {
  let ret = document.createElement("div")
  ret.classList.add("day")
  ret.innerHTML = `<h5>${day}</h5><hr>`

  return ret
}

function DOMcreateLesson(name, lesson) {
  let ret = document.createElement("div")
  ret.classList.add("lesson")

  function addContent(content) {
    let elm = document.createElement("div")
    elm.classList.add("lessonInfo")
    elm.innerHTML = content

    ret.appendChild(elm)
  }

  addContent(`<strong>${name}</strong>`);
  addContent(lesson.activity);
  addContent(lesson.homework);

  return ret
}

// https://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    // Return array of year and week number
    return weekNo;
}

// TODO: This must be refactured
function dateFromWeek(w) {
  let y = 2020 //new Date().getFullYear()
  if (w < 30) y++

  var simple = new Date(y, 0, 1 + (w - 1) * 7);
  var dow = simple.getDay();
  var ISOweekStart = simple;
  if (dow <= 4)
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
}

async function extractPlan(table) {

  let ret = []
  let lastWeek = null;

  for (let i = 1; i < table.children[0].children.length; i++) {
    let row = table.children[0].children[i]

    let week = row.children[0].innerText.trim()
    if (week != "") {
      week = Number(week)
      lastWeek = week
    } else {
      week = lastWeek
    }
    let weekDay = row.children[1].innerText.trim()
    let date = row.children[2].innerText.trim()
    let homework = row.children[3].innerText.trim()
    let activity = row.children[4].innerText.trim()
    let comment = row.children[5].innerText.trim()
    let elm = row

    ret.push({
      week,
      weekDay,
      date,
      homework,
      activity,
      comment,
      elm
    })
  }

  return ret
}

async function findTable(htmlString) {
  let template = document.createElement('template')
  template.innerHTML = htmlString

  for(let child of template.content.children) {
    if(child.tagName == "DIV") {
      for (let c of child.children) {
        if(c.tagName == "TABLE") {
          return c
        }
      }
    }
  }
}

async function getNotebook(id) {
  let site = await msGraph(`/sites/vikenfk.sharepoint.com:/sites/${id}`)
  let notebooks = await msGraph(`/sites/${site.id}/onenote/notebooks`)
  let sections = await msGraph(`/sites/${site.id}/onenote/notebooks/${notebooks.value[0].id}/sections`)
  let pages = await msGraph(`/sites/${site.id}/onenote/sections/${sections.value[0].id}/pages`)
  let content = await msGraph(`/sites/${site.id}/onenote/pages/${pages.value[0].id}/content`)

  return {site, content}
}

async function msGraph(url, method) {
  const rootUrl = "https://graph.microsoft.com/v1.0";

  try {
    let res = await $.ajax({
      url: `${rootUrl}${url}`,
      method: method | "GET",
      beforeSend: xhr => {
        xhr.setRequestHeader("Authorization", `${token.token_type} ${token.access_token}`);
      }
    })

      return res;

  } catch (err) {
    console.log(err.responseJSON.error.code + ": " + err.responseJSON.error.message)

    throw err;
  }
}
