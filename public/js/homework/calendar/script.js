let token = null;

(async function() {
  token = await $.getJSON("./API/getAccessToken");
  let noteCon = $("#notebookContainer")

  let notebooks = await msGraph("/me/onenote/notebooks/getRecentNotebooks(includePersonalNotebooks=false)"); //await msGraph("/me/onenote/notebooks")
  console.log(notebooks)

  //noteCon.text(notebooks.value[0]);

  if (notebooks.value.length == 0) {
    noteCon.text("Du har ingen klassenotatblokker")
  } else {
    for (let i = 0; i < notebooks.value.length; i++) {
      noteCon.append(`<p><a href="${notebooks.value[i].links.oneNoteWebUrl.href}">${notebooks.value[i].displayName}</a></p>`);
    }
  }
})();

async function msGraph(url) {
  const rootUrl = "https://graph.microsoft.com/v1.0";

  try {
    let res = await $.ajax({
      url: `${rootUrl}${url}`,
      method: "GET",
      beforeSend: xhr => {
        xhr.setRequestHeader("Authorization", `${token.token_type} ${token.access_token}`);
      }
    })

      return res;

  } catch (err) {
    console.log(err)

    throw err;
  }
}
