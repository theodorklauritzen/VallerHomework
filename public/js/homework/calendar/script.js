let token = null;
let a = null;

(async function() {
  token = await $.getJSON("./API/getAccessToken");
  //let noteCon = document.getElementById("notebookContainer")

  //let notebooks = await msGraph("/me/onenote/notebooks/getRecentNotebooks(includePersonalNotebooks=false)"); //await msGraph("/me/onenote/notebooks")
  //console.log(notebooks)

  const sites = [
    "Fysikk2A-VGVALL",
    "Religion3STG-VGVALL"
  ]

  // TODO: Loading animation

  // TODO: add a week swticher
  const weekNumber = getWeekNumber(new Date())

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

  console.log(subjects)

  let noteTable = document.getElementById("noteTable")
  let tableBody = noteTable.children[1]

  for (subject of subjects) {
    let name = subject.site.displayName
    for (lesson of subject.plan) {
      if (lesson.week == weekNumber) {
        tableBody.appendChild(createDOMRow(name, lesson))
      }
    }
  }


  /*let content = await getNotebook("Fysikk2A-VGVALL")
  console.log("loaded content")
  let table = await findTable(content)
  a = table
  console.log(table)
  let plan = await extractPlan(table)
  console.log(plan)

  const currentWeek = getWeekNumber(new Date())
  for (lesson of plan) {
    if (lesson.week == currentWeek) {
      noteCon.append(`<div><p>${lesson.weekDay} | ${lesson.homework}</p></div>`)
    }
  }*/

  //let table = template.querySelectorAll("table")

  //console.log(template)

  //noteCon.html(content)

  //noteCon.text(notebooks.value[0]);

  /*if (notebooks.value.length == 0) {
    noteCon.text("Du har ingen klassenotatblokker")
  } else {
    for (let i = 0; i < notebooks.value.length; i++) {
      noteCon.append(`<p><a href="${notebooks.value[i].links.oneNoteWebUrl.href}">${notebooks.value[i].displayName}</a></p>`);
    }
  }*/


})();

function createDOMRow(lessonName, data) {
  let tRow = document.createElement('tr')

  let col1 = document.createElement('th')
  col1.innerHTML = lessonName
  tRow.appendChild(col1)

  let col2 = document.createElement('th')
  col2.innerHTML = data.homework
  tRow.appendChild(col2)

  return tRow
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
