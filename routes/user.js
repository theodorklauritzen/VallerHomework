var express = require('express');
var router = express.Router();

const axios = require("axios");

const MSGRAPH = "graph.microsoft.com"
const MSGRAPG_PATH = "/v1.0"

const scope = "offline_access%20user.read%20notes.read.all";

// POSTGRESQL
const { Client } = require('pg');

const pgClient = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: {
    rejectUnauthorized: false
  }
});

(async () => {
  try {
    await pgClient.connect()
  } catch (err) {
    if (err && err.name == "error" && err.code == "28000") {
      console.log("Failed to connect to Postgresql\n")
      console.log(err.message)
      process.exit(1);
    }
    throw err;
  }

  console.log("Successfully connected to Postgresql Database")
})();

process.on('exit', () => {
  pgClient.end();
});

// MS GRAPH API FUNCTIONS

async function getRefreshToken(redirect_url, tokenCode, callback) {
  const grant_type = "authorization_code";

  /*const data = new FormData();
  data.append('client_id', process.env.OAUTH_CLIENT_ID);
  data.append('scope', scope);
  data.append('code', tokenCode);
  data.append('redirect_uri', redirect_url);
  data.append('grant_type', grant_type);
  data.append('client_secret', process.env.MSGRAPH_SECRET);*/

  //https://stackoverflow.com/questions/41764184/post-form-data-with-axios-in-node-js
  try {
    const res = await axios({
      method: 'post',
      url: `https://login.microsoftonline.com/${process.env.OAUTH_TENANT}/oauth2/v2.0/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: `client_id=${encodeURIComponent(process.env.OAUTH_CLIENT_ID)}&scope=${encodeURIComponent(scope)}&code=${encodeURIComponent(tokenCode)}&redirect_uri=${encodeURIComponent(redirect_url)}&grant_type=${encodeURIComponent(grant_type)}&client_secret=${encodeURIComponent(process.env.MSGRAPH_SECRET)}`
    });
  } catch(err) {
    console.log(err)
  }

  /*
  {
    hostname: MSGRAPH,
    port: 443,
    path: `/${process.env.OAUTH_TENANT}/oauth2/v2.0/token?client_id=${process.env.OAUTH_CLIENT_ID}&scope=${scope}&code=${tokenCode}&redirect_uri=${redirect_url}&grant_type=${grant_type}&client_secret=${process.env.MSGRAPH_SECRET}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }
  // NOTE: Få parameterene riktig encodet

  const req = https.request({
    hostname: "login.microsoftonline.com",
    port: 443,
    path: `/${process.env.OAUTH_TENANT}/oauth2/v2.0/token?client_id=${process.env.OAUTH_CLIENT_ID}&scope=${scope}&code=${tokenCode}&redirect_uri=${redirect_url}&grant_type=${grant_type}&client_secret=${process.env.MSGRAPH_SECRET}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }, res => {
    console.log(`statusCode: ${res.statusCode}`)

    res.on('data', d => {
      console.log(d)
      callback(d);
    })
  })

  console.log(req)
  */
}

/* GET home page. */
router.get('/login', function(req, res, next) {
  const redirect_url = `${req.protocol}://${req.get('host')}/user/oauth/response`;
  // TODO: Add a state for security
  // See: https://docs.microsoft.com/en-us/graph/auth-v2-user?view=graph-rest-1.0
  res.redirect(`https://login.microsoftonline.com/${process.env.OAUTH_TENANT}/oauth2/v2.0/authorize?client_id=${process.env.OAUTH_CLIENT_ID}&response_type=code&redirect_uri=${redirect_url}&response_mode=query&scope=${scope}`);
});

router.get("/oauth/response", (req, res, next) => {
  res.send(req.url)

  console.log("Query code: " + req.query.code);

  const redirect_url = `${req.protocol}://${req.get('host')}/user/oauth/response`;
  getRefreshToken(redirect_url, req.query.code, (res) => {
    console.log(res);
  })
})

module.exports = router;

// https://youtu.be/n6q8Cm-pTYY

// https://portal.azure.com/#home
// https://aad.portal.azure.com/
// https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade

// https://docs.microsoft.com/en-us/graph/onenote-get-content
// https://docs.microsoft.com/en-us/graph/auth-v2-user?view=graph-rest-1.0

// https://portal.office.com/account/?ref=MeControl#apps

// https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc

//  docker run --rm -p 80:80 --env PGADMIN_DEFAULT_EMAIL=theodor.k.lauritzen@gmail.com --env PGADMIN_DEFAULT_PASSWORD=admin dpage/pgadmin4
