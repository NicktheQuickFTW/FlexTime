/**
 * Research Documentation API Routes
 * 
 * Provides access to the enhanced research markdown documents
 * and their processed data
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const docsDir = path.join(__dirname, '../../frontend/docs');

/**
 * GET /api/research-docs/list
 * List all available research documents
 */
router.get('/list', async (req, res) => {
  try {
    const files = await fs.readdir(docsDir);
    const researchDocs = files
      .filter(file => file.endsWith('.md'))
      .map(file => {
        const stats = {
          filename: file,
          sport: extractSportFromFilename(file),
          type: extractDocType(file),
          path: `/api/research-docs/content/${file.replace('.md', '')}`
        };
        return stats;
      });

    res.json({
      documents: researchDocs,
      total: researchDocs.length,
      baseUrl: '/api/research-docs'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to list documents',
      message: error.message 
    });
  }
});

/**
 * GET /api/research-docs/content/:docname
 * Get content of a specific research document
 */
router.get('/content/:docname', async (req, res) => {
  try {
    const { docname } = req.params;
    const { format = 'markdown' } = req.query;
    
    const filename = `${docname}.md`;
    const filePath = path.join(docsDir, filename);
    
    // Security check - ensure file is in docs directory
    if (!filePath.startsWith(docsDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    
    if (format === 'json') {
      // Parse content into structured data
      const parsedData = parseMarkdownContent(content, docname);
      res.json(parsedData);
    } else {
      // Return raw markdown
      res.set('Content-Type', 'text/markdown');
      res.send(content);
    }
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ 
        error: 'Document not found',
        document: req.params.docname 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to read document',
        message: error.message 
      });
    }
  }
});

/**
 * GET /api/research-docs/compass-data/:sport
 * Get extracted COMPASS data for a specific sport
 */
router.get('/compass-data/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const filename = `big12-${sport}-compass-analysis.md`;
    
    // Handle special cases
    let actualFilename = filename;
    if (sport === 'baseball') {
      actualFilename = 'big12-baseball-compass-analysis-2025.md';
    } else if (sport === 'comprehensive' || sport === 'all') {
      actualFilename = 'big12-comprehensive-sports-analysis-2025.md';
    }
    
    const filePath = path.join(docsDir, actualFilename);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Extract COMPASS data
    const compassData = extractCompassDataFromMarkdown(content, sport);
    
    res.json({
      sport: sport,
      document: actualFilename,
      data: compassData,
      extractedAt: new Date().toISOString()
    });
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ 
        error: 'COMPASS document not found for sport',
        sport: req.params.sport 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to extract COMPASS data',
        message: error.message 
      });
    }
  }
});

/**
 * GET /api/research-docs/methodologies
 * Get research methodology documents
 */
router.get('/methodologies', async (req, res) => {
  try {
    const methodologyFiles = [
      'enhanced-sports-research-methods.md',
      'unified-sport-pipeline-methodology.md'
    ];
    
    const methodologies = [];
    
    for (const file of methodologyFiles) {
      try {
        const filePath = path.join(docsDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        methodologies.push({
          filename: file,
          title: extractTitleFromMarkdown(content),
          summary: extractSummaryFromMarkdown(content),
          content: content,
          type: 'methodology'
        });
      } catch (error) {
        console.warn(`Could not read ${file}:`, error.message);
      }
    }
    
    res.json({
      methodologies,
      total: methodologies.length
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to load methodologies',
      message: error.message 
    });
  }
});

/**
 * POST /api/research-docs/search
 * Search within research documents
 */
router.post('/search', async (req, res) => {
  try {
    const { query, sport, docType } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const files = await fs.readdir(docsDir);
    const results = [];
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      
      // Filter by sport or docType if specified
      if (sport && !file.includes(sport)) continue;
      if (docType && !file.includes(docType)) continue;
      
      try {
        const filePath = path.join(docsDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Simple text search (could be enhanced with better search)
        const searchRegex = new RegExp(query, 'gi');
        const matches = content.match(searchRegex);
        
        if (matches && matches.length > 0) {
          // Extract context around matches
          const contexts = extractSearchContexts(content, query);
          
          results.push({
            filename: file,
            sport: extractSportFromFilename(file),
            matchCount: matches.length,
            contexts: contexts.slice(0, 3), // Top 3 contexts
            path: `/api/research-docs/content/${file.replace('.md', '')}`
          });
        }
      } catch (error) {
        console.warn(`Error searching ${file}:`, error.message);
      }
    }
    
    // Sort by match count
    results.sort((a, b) => b.matchCount - a.matchCount);
    
    res.json({
      query,
      results,
      totalMatches: results.length,
      searchedFiles: files.filter(f => f.endsWith('.md')).length
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message 
    });
  }
});

// Helper functions

function extractSportFromFilename(filename) {
  if (filename.includes('basketball')) return 'basketball';
  if (filename.includes('baseball')) return 'baseball';
  if (filename.includes('softball')) return 'softball';
  if (filename.includes('football')) return 'football';
  if (filename.includes('comprehensive')) return 'multiple';
  return 'general';
}

function extractDocType(filename) {
  if (filename.includes('compass')) return 'compass-analysis';
  if (filename.includes('methodology')) return 'methodology';
  if (filename.includes('comprehensive')) return 'comprehensive';
  return 'analysis';
}

function parseMarkdownContent(content, docname) {
  const lines = content.split('\n');
  const parsed = {
    title: '',
    sections: [],
    teams: [],
    metadata: {
      docname,
      parsedAt: new Date().toISOString()
    }
  };
  
  // Extract title (first # header)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    parsed.title = titleMatch[1];
  }
  
  // Extract team sections (## **Team Name**)
  const teamSections = content.split(/##\s+\*\*([^*]+)\*\*/);
  for (let i = 1; i < teamSections.length; i += 2) {
    const teamName = teamSections[i].trim();
    const teamContent = teamSections[i + 1];
    
    // Extract COMPASS rating
    const ratingMatch = teamContent.match(/COMPASS\s+Rating[:\s]+(\d+\.?\d*)\/100/i);
    
    parsed.teams.push({
      name: teamName,
      content: teamContent.substring(0, 500), // First 500 chars
      compassRating: ratingMatch ? parseFloat(ratingMatch[1]) : null
    });
  }
  
  return parsed;
}

function extractCompassDataFromMarkdown(content, sport) {
  const teams = [];
  
  // Split by team sections
  const teamSections = content.split(/##\s+\*\*([^*]+)\*\*/);
  
  for (let i = 1; i < teamSections.length; i += 2) {
    const teamName = teamSections[i].trim();
    const teamContent = teamSections[i + 1];
    
    // Extract COMPASS rating and components
    const ratingMatch = teamContent.match(/COMPASS\s+Rating[:\s]+(\d+\.?\d*)\/100/i);
    
    if (ratingMatch) {
      const team = {
        name: teamName.replace(/\*\*/g, ''),
        compassRating: parseFloat(ratingMatch[1]),
        components: {}
      };
      
      // Extract component ratings
      const componentPatterns = {
        competitive: /Competitive\s+Performance[^:]*:\s*(\d+\.?\d*)\/(\d+)/i,
        operational: /Operational\s+Excellence[^:]*:\s*(\d+\.?\d*)\/(\d+)/i,
        market: /Market\s+Position[^:]*:\s*(\d+\.?\d*)\/(\d+)/i,
        trajectory: /Performance\s+Trajectory[^:]*:\s*(\d+\.?\d*)\/(\d+)/i,
        analytics: /Analytics[^:]*:\s*(\d+\.?\d*)\/(\d+)/i
      };
      
      for (const [component, pattern] of Object.entries(componentPatterns)) {
        const match = teamContent.match(pattern);
        if (match) {
          team.components[component] = {
            score: parseFloat(match[1]),
            maxScore: parseFloat(match[2])
          };
        }
      }
      
      teams.push(team);
    }
  }
  
  return teams;
}

function extractTitleFromMarkdown(content) {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1] : 'Untitled Document';
}

function extractSummaryFromMarkdown(content) {
  // Extract first paragraph after title
  const lines = content.split('\n');
  let summary = '';
  let inSummary = false;
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      if (inSummary) break; // Stop at next header
      if (line.startsWith('# ')) inSummary = true; // Start after title
      continue;
    }
    
    if (inSummary && line.trim()) {
      summary += line + ' ';
      if (summary.length > 200) break; // Limit summary length
    }
  }
  
  return summary.trim().substring(0, 200) + '...';
}

function extractSearchContexts(content, query) {
  const contexts = [];
  const searchRegex = new RegExp(query, 'gi');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (searchRegex.test(lines[i])) {
      // Extract context (3 lines before and after)
      const start = Math.max(0, i - 3);
      const end = Math.min(lines.length, i + 4);
      const context = lines.slice(start, end).join('\n');
      
      contexts.push({
        lineNumber: i + 1,
        context: context,
        matchedLine: lines[i]
      });
    }
  }
  
  return contexts;
}

module.exports = router;