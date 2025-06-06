/**
 * Schedule Export Utilities for FlexTime
 * 
 * This module provides export functionality for schedules in various formats:
 * - JSON
 * - CSV
 * - HTML
 */

const fs = require('fs');
const path = require('path');
const logger = require("../../lib/logger");;

class ScheduleExporter {
  /**
   * Create a new ScheduleExporter
   */
  constructor() {
    logger.info('Schedule Exporter initialized');
  }

  /**
   * Export schedule to JSON format
   * @param {Object} schedule - Schedule to export
   * @param {Object} options - Export options
   * @returns {string} JSON string
   */
  exportToJSON(schedule, options = {}) {
    try {
      // Default options
      const defaultOptions = {
        pretty: true,
        includeTeams: true,
        includeVenues: true,
        includeMetadata: true
      };
      
      const exportOptions = { ...defaultOptions, ...options };
      
      // Build export object
      const exportObject = {
        id: schedule.id || schedule.schedule_id,
        name: schedule.name,
        sport: typeof schedule.sport === 'object' ? schedule.sport.name : schedule.sport,
        season: schedule.season,
        start_date: schedule.startDate || schedule.start_date,
        end_date: schedule.endDate || schedule.end_date
      };
      
      // Add games
      exportObject.games = schedule.games.map(game => {
        const gameObject = {
          id: game.id || game.game_id,
          date: game.date.toISOString().split('T')[0],
          time: game.date.toISOString().split('T')[1].substring(0, 5),
          home_team: typeof game.homeTeam === 'object' ? game.homeTeam.name : game.home_team_id,
          away_team: typeof game.awayTeam === 'object' ? game.awayTeam.name : game.away_team_id,
          venue: typeof game.venue === 'object' ? game.venue.name : game.venue_id
        };
        
        if (game.specialDesignation) {
          gameObject.special_designation = game.specialDesignation;
        }
        
        if (game.tvNetwork) {
          gameObject.tv_network = game.tvNetwork;
        }
        
        return gameObject;
      });
      
      // Add teams if requested
      if (exportOptions.includeTeams && schedule.teams) {
        exportObject.teams = schedule.teams.map(team => {
          return {
            id: team.id || team.team_id,
            name: team.name || (team.institution ? team.institution.name : 'Unknown'),
            location: team.location ? {
              name: team.location.name,
              latitude: team.location.latitude,
              longitude: team.location.longitude
            } : undefined
          };
        });
      }
      
      // Add venues if requested
      if (exportOptions.includeVenues) {
        // Collect unique venues from games
        const venues = new Map();
        
        for (const game of schedule.games) {
          if (game.venue && !venues.has(game.venue.id)) {
            venues.set(game.venue.id, game.venue);
          }
        }
        
        exportObject.venues = Array.from(venues.values()).map(venue => {
          return {
            id: venue.id || venue.venue_id,
            name: venue.name,
            capacity: venue.capacity,
            location: venue.location ? {
              name: venue.location.name,
              latitude: venue.location.latitude,
              longitude: venue.location.longitude
            } : undefined
          };
        });
      }
      
      // Add metadata if requested
      if (exportOptions.includeMetadata && schedule.metrics) {
        exportObject.metrics = schedule.metrics;
      }
      
      // Format JSON
      const spacing = exportOptions.pretty ? 2 : 0;
      return JSON.stringify(exportObject, null, spacing);
    } catch (error) {
      logger.error(`Error exporting schedule to JSON: ${error.message}`);
      throw new Error(`Failed to export schedule to JSON: ${error.message}`);
    }
  }
  
  /**
   * Export schedule to CSV format
   * @param {Object} schedule - Schedule to export
   * @param {Object} options - Export options
   * @returns {string} CSV string
   */
  exportToCSV(schedule, options = {}) {
    try {
      // Default options
      const defaultOptions = {
        delimiter: ',',
        includeHeader: true,
        dateFormat: 'YYYY-MM-DD', // YYYY-MM-DD or MM/DD/YYYY
        timeFormat: '24h' // 24h or 12h
      };
      
      const exportOptions = { ...defaultOptions, ...options };
      const delimiter = exportOptions.delimiter;
      
      // Build CSV rows
      const rows = [];
      
      // Add header if requested
      if (exportOptions.includeHeader) {
        rows.push([
          'Game ID',
          'Date',
          'Time',
          'Home Team',
          'Away Team',
          'Venue',
          'Special Designation',
          'TV Network'
        ].join(delimiter));
      }
      
      // Add game rows
      for (const game of schedule.games) {
        const date = new Date(game.date);
        
        // Format date
        let dateString;
        if (exportOptions.dateFormat === 'MM/DD/YYYY') {
          dateString = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        } else {
          dateString = date.toISOString().split('T')[0];
        }
        
        // Format time
        let timeString;
        if (exportOptions.timeFormat === '12h') {
          const hours = date.getHours();
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const twelveHour = hours % 12 || 12;
          timeString = `${twelveHour}:${minutes} ${ampm}`;
        } else {
          timeString = date.toISOString().split('T')[1].substring(0, 5);
        }
        
        // Get team names
        const homeTeam = typeof game.homeTeam === 'object' ? 
          game.homeTeam.name : game.home_team_id;
        const awayTeam = typeof game.awayTeam === 'object' ? 
          game.awayTeam.name : game.away_team_id;
        
        // Get venue name
        const venue = typeof game.venue === 'object' ? 
          game.venue.name : game.venue_id;
        
        // Build row
        rows.push([
          game.id || game.game_id,
          dateString,
          timeString,
          homeTeam,
          awayTeam,
          venue,
          game.specialDesignation || '',
          game.tvNetwork || ''
        ].join(delimiter));
      }
      
      return rows.join('\n');
    } catch (error) {
      logger.error(`Error exporting schedule to CSV: ${error.message}`);
      throw new Error(`Failed to export schedule to CSV: ${error.message}`);
    }
  }
  
  // iCalendar export has been removed to reduce dependencies
  
  /**
   * Export schedule to HTML format
   * @param {Object} schedule - Schedule to export
   * @param {Object} options - Export options
   * @returns {string} HTML string
   */
  exportToHTML(schedule, options = {}) {
    try {
      // Default options
      const defaultOptions = {
        title: schedule.name || 'FlexTime Schedule',
        includeStyles: true,
        groupByMonth: true,
        includeTeamColors: true,
        dateFormat: 'long' // 'short', 'medium', or 'long'
      };
      
      const exportOptions = { ...defaultOptions, ...options };
      
      // Team colors (mock data - in a real system this would come from database)
      const teamColors = {
        'North University': { primary: '#0000FF', secondary: '#FFFFFF' },
        'East College': { primary: '#FF0000', secondary: '#FFFFFF' },
        'South University': { primary: '#008000', secondary: '#FFFFFF' },
        'West College': { primary: '#800080', secondary: '#FFFFFF' },
        'Central State': { primary: '#FFA500', secondary: '#000000' },
        'Mountain Tech': { primary: '#808080', secondary: '#FFFFFF' },
        'Coastal University': { primary: '#00FFFF', secondary: '#000000' },
        'Lake College': { primary: '#000080', secondary: '#FFFFFF' },
        'Valley State': { primary: '#008080', secondary: '#FFFFFF' },
        'Capital University': { primary: '#800000', secondary: '#FFFFFF' }
      };
      
      // Start HTML document
      let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${exportOptions.title}</title>`;
      
      // Add styles if requested
      if (exportOptions.includeStyles) {
        html += `
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #2c3e50;
      text-align: center;
      margin-bottom: 30px;
    }
    h2 {
      color: #3498db;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
      margin-top: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background-color: #f2f2f2;
      text-align: left;
      padding: 12px;
      border: 1px solid #ddd;
    }
    td {
      padding: 12px;
      border: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    tr:hover {
      background-color: #f1f1f1;
    }
    .team-label {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: bold;
    }
    .game-date {
      white-space: nowrap;
    }
    .venue {
      color: #7f8c8d;
    }
    .special {
      color: #e74c3c;
      font-weight: bold;
    }
    footer {
      text-align: center;
      margin-top: 40px;
      color: #7f8c8d;
      font-size: 0.9em;
    }
  </style>`;
      }
      
      html += `
</head>
<body>
  <h1>${exportOptions.title}</h1>
  <p>Sport: ${typeof schedule.sport === 'object' ? schedule.sport.name : schedule.sport}</p>
  <p>Season: ${schedule.season}</p>`;
      
      // Format games
      const games = [...schedule.games];
      games.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      if (exportOptions.groupByMonth) {
        // Group games by month
        const gamesByMonth = {};
        
        for (const game of games) {
          const date = new Date(game.date);
          const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
          const monthName = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
          
          if (!gamesByMonth[monthKey]) {
            gamesByMonth[monthKey] = {
              name: monthName,
              games: []
            };
          }
          
          gamesByMonth[monthKey].games.push(game);
        }
        
        // Generate HTML for each month
        for (const [monthKey, month] of Object.entries(gamesByMonth)) {
          html += `
  <h2>${month.name}</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>Matchup</th>
        <th>Venue</th>
        <th>TV</th>
      </tr>
    </thead>
    <tbody>`;
          
          // Add games for this month
          for (const game of month.games) {
            const date = new Date(game.date);
            
            // Format date
            let dateString;
            if (exportOptions.dateFormat === 'short') {
              dateString = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
            } else if (exportOptions.dateFormat === 'medium') {
              dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else {
              dateString = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            }
            
            // Format time
            const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            
            // Get team names
            const homeTeam = typeof game.homeTeam === 'object' ? 
              game.homeTeam.name : game.home_team_id;
            const awayTeam = typeof game.awayTeam === 'object' ? 
              game.awayTeam.name : game.away_team_id;
            
            // Get venue name
            const venue = typeof game.venue === 'object' ? 
              game.venue.name : game.venue_id;
            
            // Generate team labels with colors if requested
            let homeTeamLabel = homeTeam;
            let awayTeamLabel = awayTeam;
            
            if (exportOptions.includeTeamColors) {
              const homeColors = teamColors[homeTeam] || { primary: '#333', secondary: '#fff' };
              const awayColors = teamColors[awayTeam] || { primary: '#333', secondary: '#fff' };
              
              homeTeamLabel = `<span class="team-label" style="background-color: ${homeColors.primary}; color: ${homeColors.secondary};">${homeTeam}</span>`;
              awayTeamLabel = `<span class="team-label" style="background-color: ${awayColors.primary}; color: ${awayColors.secondary};">${awayTeam}</span>`;
            }
            
            // Special designation
            const specialDesignation = game.specialDesignation ? 
              `<div class="special">${game.specialDesignation}</div>` : '';
            
            html += `
      <tr>
        <td class="game-date">${dateString}</td>
        <td>${timeString}</td>
        <td>${awayTeamLabel} @ ${homeTeamLabel}${specialDesignation}</td>
        <td class="venue">${venue}</td>
        <td>${game.tvNetwork || ''}</td>
      </tr>`;
          }
          
          html += `
    </tbody>
  </table>`;
        }
      } else {
        // Simple list of all games
        html += `
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>Matchup</th>
        <th>Venue</th>
        <th>TV</th>
      </tr>
    </thead>
    <tbody>`;
        
        // Add all games
        for (const game of games) {
          const date = new Date(game.date);
          
          // Format date
          let dateString;
          if (exportOptions.dateFormat === 'short') {
            dateString = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
          } else if (exportOptions.dateFormat === 'medium') {
            dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } else {
            dateString = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          }
          
          // Format time
          const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          
          // Get team names
          const homeTeam = typeof game.homeTeam === 'object' ? 
            game.homeTeam.name : game.home_team_id;
          const awayTeam = typeof game.awayTeam === 'object' ? 
            game.awayTeam.name : game.away_team_id;
          
          // Get venue name
          const venue = typeof game.venue === 'object' ? 
            game.venue.name : game.venue_id;
          
          // Generate team labels with colors if requested
          let homeTeamLabel = homeTeam;
          let awayTeamLabel = awayTeam;
          
          if (exportOptions.includeTeamColors) {
            const homeColors = teamColors[homeTeam] || { primary: '#333', secondary: '#fff' };
            const awayColors = teamColors[awayTeam] || { primary: '#333', secondary: '#fff' };
            
            homeTeamLabel = `<span class="team-label" style="background-color: ${homeColors.primary}; color: ${homeColors.secondary};">${homeTeam}</span>`;
            awayTeamLabel = `<span class="team-label" style="background-color: ${awayColors.primary}; color: ${awayColors.secondary};">${awayTeam}</span>`;
          }
          
          // Special designation
          const specialDesignation = game.specialDesignation ? 
            `<div class="special">${game.specialDesignation}</div>` : '';
          
          html += `
      <tr>
        <td class="game-date">${dateString}</td>
        <td>${timeString}</td>
        <td>${awayTeamLabel} @ ${homeTeamLabel}${specialDesignation}</td>
        <td class="venue">${venue}</td>
        <td>${game.tvNetwork || ''}</td>
      </tr>`;
        }
        
        html += `
    </tbody>
  </table>`;
      }
      
      // Add footer
      html += `
  <footer>
    <p>Generated by FlexTime Scheduling System on ${new Date().toLocaleDateString()}</p>
  </footer>
</body>
</html>`;
      
      return html;
    } catch (error) {
      logger.error(`Error exporting schedule to HTML: ${error.message}`);
      throw new Error(`Failed to export schedule to HTML: ${error.message}`);
    }
  }
  
  // Excel export has been removed to reduce dependencies
  
  /**
   * Save exported schedule to file
   * @param {string|Buffer} data - Exported data
   * @param {string} filePath - Path to save file
   * @returns {Promise<string>} File path
   */
  async saveToFile(data, filePath) {
    try {
      // Create directory if it doesn't exist
      const directory = path.dirname(filePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      // Write file
      await fs.promises.writeFile(filePath, data);
      
      logger.info(`Exported schedule saved to ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`Error saving schedule export: ${error.message}`);
      throw new Error(`Failed to save schedule export: ${error.message}`);
    }
  }
  
  /**
   * Export schedule to various formats
   * @param {Object} schedule - Schedule to export
   * @param {string} format - Export format (json, csv, html)
   * @param {Object} options - Export options
   * @returns {string} Exported data
   */
  exportSchedule(schedule, format, options = {}) {
    switch (format.toLowerCase()) {
      case 'json':
        return this.exportToJSON(schedule, options);
      case 'csv':
        return this.exportToCSV(schedule, options);
      case 'html':
        return this.exportToHTML(schedule, options);
      case 'ical':
      case 'ics':
        logger.info('iCalendar export is disabled. Falling back to CSV format.');
        return this.exportToCSV(schedule, options);
      case 'excel':
      case 'xlsx':
        logger.info('Excel export is disabled. Falling back to CSV format.');
        return this.exportToCSV(schedule, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

module.exports = ScheduleExporter;