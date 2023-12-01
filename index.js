const express = require('express');
const axios = require('axios');
require('dotenv').config(); // for using environment variables

const app = express();

// Set up environment variables or add them to a .env file
const PORT = process.env.PORT || 3000;
const GITHUB_USERNAME = process.env.HandyWork1; // Your GitHub username

// Route to fetch user repositories from GitHub API
app.get('/api/github/repos', async (req, res) => {
  try {
    const response = await axios.get(`https://api.github.com/users/${GITHUB_USERNAME}/repos`);
    const repos = response.data.map(repo => ({
      name: repo.name,
      description: repo.description,
    }));
    res.json(repos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
