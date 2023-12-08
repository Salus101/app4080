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
  callbackURL: 'https://github-aggregator-program.onrender.com/auth/github/callback',
},
function(accessToken, refreshToken, profile, done) {
  // Store user information in session or database as needed
  const user = {
    accessToken: accessToken,
    profile: profile
  };
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
      Authorization: `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json'
    };

    // Fetch Github details for the user
    const userDetailsResponse = await axios.get('https://api.github.com/user', { headers });
    const user = userDetailsResponse.data;

    // Fetch repositories for the authenticated user
    const reposResponse = await axios.get('https://api.github.com/user/repos', { headers });
    const repositories = reposResponse.data;

    const languages = {};

    // Loop through each repository to get language data
    for (const repo of repositories) {
      const languagesUrl = repo.languages_url;
      const langResponse = await axios.get(languagesUrl, { headers });
      const langData = langResponse.data;

      // Aggregate languages used in each repository
      for (const lang in langData) {
        if (lang in languages) {
          languages[lang] += langData[lang];
        } else {
          languages[lang] = langData[lang];
        }
      }
    }

    const totalBytes = Object.values(languages).reduce((acc, val) => acc + val, 0);

    // Calculate percentage for each language
    const percentages = {};
    for (const lang in languages) {
      percentages[lang] = (languages[lang] / totalBytes) * 100;
    }

    // Sort languages by percentage
    const sortedPercentages = Object.entries(percentages)
      .sort((a, b) => b[1] - a[1]);

    res.render('index.ejs', { user, repositories, languages: sortedPercentages });
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
