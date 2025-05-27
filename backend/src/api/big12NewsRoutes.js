const express = require('express');
const Big12NewsService = require('../services/big12NewsService');

const router = express.Router();
const newsService = new Big12NewsService();

// Get latest Big 12 press releases and news
router.get('/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const news = await newsService.fetchLatestNews(limit);
    
    res.json({
      success: true,
      data: news,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Big 12 news',
      error: error.message
    });
  }
});

// Get ESPN Big 12 news
router.get('/espn', async (req, res) => {
  try {
    const news = await newsService.getESPNBig12News();
    
    res.json({
      success: true,
      data: news,
      source: 'ESPN',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ESPN Big 12 news',
      error: error.message
    });
  }
});

// Get combined news from multiple sources
router.get('/combined', async (req, res) => {
  try {
    const [big12News, espnNews] = await Promise.all([
      newsService.fetchLatestNews(3),
      newsService.getESPNBig12News()
    ]);
    
    const combinedNews = [...big12News, ...espnNews]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
    
    res.json({
      success: true,
      data: combinedNews,
      sources: ['big12sports.com', 'ESPN'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch combined Big 12 news',
      error: error.message
    });
  }
});

module.exports = router;