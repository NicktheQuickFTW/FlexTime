const axios = require('axios');
const cheerio = require('cheerio');

class Big12NewsService {
  constructor() {
    this.baseUrl = 'https://big12sports.com';
    this.newsUrl = 'https://big12sports.com/news';
  }

  async fetchLatestNews(limit = 5) {
    try {
      const response = await axios.get(this.newsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const newsItems = [];

      // Note: These selectors need to be updated based on actual big12sports.com structure
      $('.news-article, .press-release').each((index, element) => {
        if (index < limit) {
          const $el = $(element);
          
          const newsItem = {
            title: $el.find('.headline, h2, h3').first().text().trim(),
            summary: $el.find('.summary, .excerpt, p').first().text().trim(),
            link: this.baseUrl + $el.find('a').first().attr('href'),
            date: $el.find('.date, .publish-date, time').first().text().trim(),
            image: this.extractImageUrl($el),
            category: this.extractCategory($el)
          };

          if (newsItem.title && newsItem.link) {
            newsItems.push(newsItem);
          }
        }
      });

      return newsItems;
    } catch (error) {
      console.error('Error fetching Big 12 news:', error);
      
      // Return fallback mock data if scraping fails
      return this.getMockNews();
    }
  }

  extractImageUrl($element) {
    const img = $element.find('img').first();
    if (img.length) {
      let src = img.attr('src') || img.attr('data-src');
      if (src && !src.startsWith('http')) {
        src = this.baseUrl + src;
      }
      return src;
    }
    return null;
  }

  extractCategory($element) {
    const category = $element.find('.category, .sport, .tag').first().text().trim();
    return category || 'General';
  }

  getMockNews() {
    return [
      {
        title: "Arizona Claims Phillips 66 Big 12 Baseball Championship",
        summary: "Wildcats defeat TCU 2-1 in dramatic 10-inning finale to capture conference tournament title",
        link: "https://big12sports.com/news/2025/5/25/arizonas-late-inning-heroics-claim-phillips-66-big-12-baseball-championship-title.aspx",
        date: "May 25, 2025",
        image: "/assets/images/news/arizona-baseball-championship.jpg",
        category: "Baseball"
      },
      {
        title: "Big 12 Conference Releases 2025 Football Schedule",
        summary: "All 16 programs will play nine league games as the Big 12 celebrates its 30th football season",
        link: "https://big12sports.com/news/2025/2/4/big-12-conference-releases-2025-football-schedule.aspx",
        date: "February 4, 2025",
        image: "/assets/images/news/football-schedule-2025.jpg",
        category: "Football"
      },
      {
        title: "Big 12 Spring Championships Schedule Announced",
        summary: "Conference reveals dates and locations for track & field, tennis, and golf championships",
        date: "March 15, 2025",
        image: "/assets/images/news/spring-championships.jpg",
        category: "Championships"
      }
    ];
  }

  async getESPNBig12News() {
    try {
      // ESPN RSS feed for Big 12 news
      const espnUrl = 'https://www.espn.com/espn/rss/college-sports/news';
      const response = await axios.get(espnUrl);
      
      // Parse RSS XML and filter for Big 12 content
      // Implementation would convert RSS to JSON format
      
      return [];
    } catch (error) {
      console.error('Error fetching ESPN news:', error);
      return [];
    }
  }
}

module.exports = Big12NewsService;