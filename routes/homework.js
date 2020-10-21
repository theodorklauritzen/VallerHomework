var express = require('express');
var router = express.Router();
const token = require('../token');

//let pgClient = require('../postgres')

router.use((req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.redirect("/");
  }
})

router.get("/calendar", (req, res, next) => {
  res.render("homework/calendar")
})

router.get('/API/getAccessToken', async function(req, res, next) {
  // NOTE: maybe it needs to be refreshed. SEE: https://docs.microsoft.com/en-us/graph/tutorials/node?tutorial-step=3

  let t = await token.getAccessToken(req)

  res.send({
    access_token: t.access_token,
    token_type: t.token_type,
    scope: t.scope,
    expires_in: t.expires_in
  });
});

module.exports = router;
