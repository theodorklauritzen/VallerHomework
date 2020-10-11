var express = require('express');
var router = express.Router();

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

router.get('/API/getAccessToken', function(req, res, next) {
  // NOTE: maybe it needs to be refreshed. SEE: https://docs.microsoft.com/en-us/graph/tutorials/node?tutorial-step=3


  res.send({
    access_token: req.user.oauthToken.token.access_token,
    token_type: req.user.oauthToken.token.token_type,
    scope: req.user.oauthToken.token.scope,
    expires_in: req.user.oauthToken.token.expires_in
  });
});

module.exports = router;
