// app.js
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const GitHubStrategy = require('passport-github').Strategy;
const app = express();
const PORT = 3001;

// Use session to keep track of login status
app.use(session({ secret: 'd14b71ca239adf061a1d034c9aa9f481f380e09e798fe9ac5a55de5809732e8', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

const GITHUB_CLIENT_ID = 'c2f1ebd83aacf0e36c9d';
const GITHUB_CLIENT_SECRET = 'fd94b22c18e03350b751ca7939bb09430695e92e';

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: 'http://localhost:3001/auth/github/callback',
},
function(accessToken, refreshToken, profile, done) {
  // Store user information in session
  return done(null, profile);
}
));

// Serialize user data to store in session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/home');
  } else {
    res.send('<h1>Welcome to GitHub OAuth Login</h1><a href="/auth/github">Login with GitHub</a>');
  }
});

app.get('/auth/github', passport.authenticate('github'));

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/home');
  }
);

app.get('/home', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`<h1>Welcome ${req.user.username}!</h1><a href="/logout">Logout</a>`);
  } else {
    res.redirect('/');
  }
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
