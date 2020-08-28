var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/login', function(req, res, next) {
  const redirect_url = "http://localhost/user/success";
  const scope = "offline_access%20user.read%20notes.read.all";
  // TODO: Add a state for security
  // See: https://docs.microsoft.com/en-us/graph/auth-v2-user?view=graph-rest-1.0
  res.redirect(`https://login.microsoftonline.com/${process.env.OATH_TENANT}/oauth2/v2.0/authorize?client_id=${process.env.OAUTH_CLIENT_ID}&response_type=code&redirect_uri=${redirect_url}&response_mode=query&scope=${scope}`);
});

router.get("/oathresponse", (req, res, next) => {
  res.send(req);
})

module.exports = router;
