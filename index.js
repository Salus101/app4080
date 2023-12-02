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
  const user = {
    accessToken: accessToken,
    profile: profile
  };
  console.log(user.profile)
  return done(null, user);
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


app.get('/user-details', async (req, res) => {
    try {
      if (!req.user || !req.user.accessToken) {
        throw new Error('Access token not available');
      }
  
      const accessToken = req.user.accessToken;
      const headers = {
        Authorization: `token ${accessToken}`
      };
  
      const userDetailsResponse = await axios.get('https://api.github.com/user', { headers });
      const user = userDetailsResponse.data;
  
      const reposResponse = await axios.get(`https://api.github.com/users/${user.login}/repos`, { headers });
      const repositories = reposResponse.data;
  
      res.render('index.ejs', { user, repositories });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Error fetching user details');
    }
  });
  
// Logout script
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.redirect('/');
    }
    res.clearCookie('connect.sid'); // clear the session cookie
    res.redirect('/'); // Redirect to the login page
  });
});
  

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
