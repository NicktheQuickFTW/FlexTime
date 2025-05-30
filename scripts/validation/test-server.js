// Simple test server to verify Node.js and Express work
const express = require('express');
const app = express();
const PORT = 3001;

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'FlexTime API is running' });
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});