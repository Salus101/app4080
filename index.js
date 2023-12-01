// app.js
const express = require('express');
const path = require('path');
const axios = require('axios');
const passport = require('passport');
const session = require('express-session');
const GitHubStrategy = require('passport-github').Strategy;
const app = express();
require('dotenv').config();

// Set up environment variables
const PORT = process.env.PORT || 3000;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET;

// Set up how static files are served
app.use(express.static(path.join(__dirname, 'public')));

// Configure session and Passport
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// GitHub OAuth strategy setup
passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/github/callback',
},
function(accessToken, refreshToken, profile, done) {
  // Store user information in session or database as needed
  return done(null, profile);
}
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Define routes
app.get('/', (req, res) => {
  res.render('login.ejs'); // Render a login page with a form to collect GitHub username and password
});

app.get('/auth/github', passport.authenticate('github'));

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/user-details');
  }
);

app.get('/user-details', (req, res) => {
  // Fetch user details using the obtained access token (req.user)
  // Render an index.ejs page with user details
  res.render('index.ejs', { user: req.user });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
