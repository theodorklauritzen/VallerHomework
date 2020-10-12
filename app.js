var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var flash = require('connect-flash');
var graph = require('./graph');
const { Pool, Client } = require('pg')
const pgSession = require('connect-pg-simple')(session);

var passport = require('passport');
var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

// Connect to the databse
// NOTE: This is a quick fix, this has to be refactured due to security.
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const pgPool = new Pool({
 user: process.env.PGUSER,
 host: process.env.PGHOST,
 database: process.env.PGDATABASE,
 password: process.env.PGPASSWORD,
 port: process.env.PGPORT,
 ssl: true
});

// Configure passport

// Passport calls serializeUser and deserializeUser to
// manage users
let users = {}

async function storeUser(user) {
  /*console.log(user)
  console.log(user.oauthToken.__proto__)
  console.log(user.oauthToken)
  console.log(JSON.stringify(user.oauthToken))

  let userData = []
  userData.push(user.profile.oid)
  userData.push(user.profile.displayName)
  userData.push(user.oauthToken.token.refresh_token)

  try {
    const res = await pgPool.query('INSERT INTO users(ms_oid, displayname, refresh_token) VALUES($1, $2, $3)', userData)
  } catch (err) {
    console.log(err)
  }*/
  users[user.profile.oid] = user
}

passport.serializeUser(async function(user, done) {
  // Use the OID property of the user as a key
  done(null, user.profile.oid);
});

passport.deserializeUser(async function(id, done) {
  /*try {
    const res = await pgPool.query('SELECT * FROM users WHERE ms_oid = ($1)', [id])

    let user = {
      profile: {},
      oauthToken: {
        token: {
          token_type: 'Bearer',
          scope: process.env.OAUTH_SCOPES,
        }
      }
    }

    user.profile["oid"] = res.rows[0].ms_oid
    user.profile["displayName"] = res.rows[0].displayname
    user.oauthToken.token["refresh_token"] = res.rows[0].refresh_token

    done(null, user);
  } catch (err) {
    console.log(err)
  }*/
  done(null, users[id])
});

// Configure simple-oauth2
const oauth2 = require('simple-oauth2').create({
  client: {
    id: process.env.OAUTH_APP_ID,
    secret: process.env.OAUTH_APP_PASSWORD
  },
  auth: {
    tokenHost: process.env.OAUTH_AUTHORITY,
    authorizePath: process.env.OAUTH_AUTHORIZE_ENDPOINT,
    tokenPath: process.env.OAUTH_TOKEN_ENDPOINT
  }
});

// Callback function called once the sign-in is complete
// and an access token has been obtained
async function signInComplete(iss, sub, profile, accessToken, refreshToken, params, done) {
  if (!profile.oid) {
    return done(new Error("No OID found in user profile."));
  }

  try{
    const user = await graph.getUserDetails(accessToken);

    if (user) {
      // Add properties to profile
      profile['email'] = user.mail ? user.mail : user.userPrincipalName;
    }
  } catch (err) {
    return done(err);
  }

  // Create a simple-oauth2 token from raw tokens
  let oauthToken = oauth2.accessToken.create(params);

  // Save the profile and tokens in user storage
  let user = {profile, oauthToken};
  storeUser(user);
  return done(null, user);
}

// Configure OIDC strategy
passport.use(new OIDCStrategy(
  {
    identityMetadata: `${process.env.OAUTH_AUTHORITY}${process.env.OAUTH_ID_METADATA}`,
    clientID: process.env.OAUTH_APP_ID,
    responseType: 'code id_token',
    responseMode: 'form_post',
    redirectUrl: process.env.OAUTH_REDIRECT_URI,
    allowHttpForRedirectUrl: true,
    clientSecret: process.env.OAUTH_APP_PASSWORD,
    validateIssuer: false,
    passReqToCallback: false,
    scope: process.env.OAUTH_SCOPES.split(' ')
  },
  signInComplete
));

var indexRouter = require('./routes/index');

var app = express();

// Session middleware
app.use(session({
  /*store: new pgSession({
    pool : pgPool,                // Connection pool
    tableName : 'session'   // Use another table-name than the default "session" one
  }),*/
  secret: 'your_secret_value_here',
  resave: false,
  saveUninitialized: false,
  unset: 'destroy',
  cookie: {
    maxAge: 365 * 24 * 60 * 60 * 1000 // One year
  }
}));

// Flash middleware
app.use(flash());

// Set up local vars for template layout
app.use(function(req, res, next) {
  // Read any flashed errors and save
  // in the response locals
  res.locals.error = req.flash('error_msg');

  // Check for simple error string and
  // convert to layout's expected format
  var errs = req.flash('error');
  for (var i in errs){
    res.locals.error.push({message: 'An error occurred', debug: errs[i]});
  }

  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  // Set the authenticated user in the
  // template locals
  if (req.user) {
    res.locals.user = req.user.profile;
  }
  next();
});

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
