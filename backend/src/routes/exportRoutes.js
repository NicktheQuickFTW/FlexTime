/**
 * Export Routes for FlexTime
 * 
 * API routes for exporting schedules and other data
 */

const express = require('express');
const router = express.Router();
const ScheduleExporter = require('../scripts/schedule_export');

// Create schedule exporter
const scheduleExporter = new ScheduleExporter();

/**
 * @route   GET /api/export/schedule/:id
 * @desc    Export a schedule
 * @access  Public
 */
router.get('/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'csv', includeTeams, includeVenues, includeMetadata, pretty } = req.query;
    
    // Get schedule from database
    const schedule = await req.app.get('db').Schedule.findByPk(id, {
      include: [
        { model: req.app.get('db').Sport, as: 'sport' },
        { 
          model: req.app.get('db').Team, 
          as: 'teams',
          include: [
            { model: req.app.get('db').Institution, as: 'institution' },
            { model: req.app.get('db').Venue, as: 'primaryVenue' }
          ]
        },
        { 
          model: req.app.get('db').Game, 
          as: 'games',
          include: [
            { model: req.app.get('db').Team, as: 'homeTeam' },
            { model: req.app.get('db').Team, as: 'awayTeam' },
            { model: req.app.get('db').Venue, as: 'venue' }
          ]
        }
      ]
    });
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Prepare export options
    const options = {
      includeTeams: includeTeams === 'true',
      includeVenues: includeVenues === 'true',
      includeMetadata: includeMetadata === 'true',
      pretty: pretty === 'true'
    };
    
    // Export schedule based on format
    let exportData;
    let contentType;
    let filename;
    
    switch (format.toLowerCase()) {
      case 'json':
        exportData = scheduleExporter.exportToJSON(schedule, options);
        contentType = 'application/json';
        filename = `schedule_${id}.json`;
        break;
      
      case 'csv':
        exportData = scheduleExporter.exportToCSV(schedule, options);
        contentType = 'text/csv';
        filename = `schedule_${id}.csv`;
        break;
      
      case 'ical':
      case 'ics':
        exportData = scheduleExporter.exportToICalendar(schedule, options);
        contentType = 'text/calendar';
        filename = `schedule_${id}.ics`;
        break;
      
      case 'html':
        exportData = scheduleExporter.exportToHTML(schedule, options);
        contentType = 'text/html';
        filename = `schedule_${id}.html`;
        break;
      
      case 'excel':
      case 'xlsx':
        exportData = scheduleExporter.exportToExcel(schedule, options);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `schedule_${id}.xlsx`;
        break;
      
      default:
        return res.status(400).json({ error: `Unsupported export format: ${format}` });
    }
    
    // Set headers for download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Send response
    res.send(exportData);
  } catch (error) {
    console.error('Error exporting schedule:', error);
    res.status(500).json({ 
      error: 'Failed to export schedule',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/export/formats
 * @desc    Get available export formats
 * @access  Public
 */
router.get('/formats', (req, res) => {
  try {
    // Return available export formats
    const formats = [
      { id: 'json', name: 'JSON', contentType: 'application/json', extension: 'json' },
      { id: 'csv', name: 'CSV', contentType: 'text/csv', extension: 'csv' },
      { id: 'ical', name: 'iCalendar', contentType: 'text/calendar', extension: 'ics' },
      { id: 'html', name: 'HTML', contentType: 'text/html', extension: 'html' },
      { id: 'excel', name: 'Excel', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx' }
    ];
    
    res.json({
      success: true,
      formats
    });
  } catch (error) {
    console.error('Error getting export formats:', error);
    res.status(500).json({ 
      error: 'Failed to get export formats',
      details: error.message
    });
  }
});

/**
 * @route   POST /api/export/batch
 * @desc    Export multiple schedules
 * @access  Public
 */
router.post('/batch', async (req, res) => {
  try {
    const { scheduleIds, format = 'json', options = {} } = req.body;
    
    if (!scheduleIds || !Array.isArray(scheduleIds) || scheduleIds.length === 0) {
      return res.status(400).json({ 
        error: 'Schedule IDs array is required'
      });
    }
    
    // Get schedules from database
    const schedules = await req.app.get('db').Schedule.findAll({
      where: {
        schedule_id: scheduleIds
      },
      include: [
        { model: req.app.get('db').Sport, as: 'sport' },
        { 
          model: req.app.get('db').Team, 
          as: 'teams',
          include: [
            { model: req.app.get('db').Institution, as: 'institution' },
            { model: req.app.get('db').Venue, as: 'primaryVenue' }
          ]
        },
        { 
          model: req.app.get('db').Game, 
          as: 'games',
          include: [
            { model: req.app.get('db').Team, as: 'homeTeam' },
            { model: req.app.get('db').Team, as: 'awayTeam' },
            { model: req.app.get('db').Venue, as: 'venue' }
          ]
        }
      ]
    });
    
    if (schedules.length === 0) {
      return res.status(404).json({ 
        error: 'No schedules found for the provided IDs'
      });
    }
    
    // Prepare result
    const results = [];
    
    // Export each schedule
    for (const schedule of schedules) {
      try {
        const exportData = scheduleExporter.exportSchedule(schedule, format, options);
        
        results.push({
          scheduleId: schedule.schedule_id,
          name: schedule.name,
          success: true,
          size: typeof exportData === 'string' ? 
            exportData.length : exportData.byteLength
        });
      } catch (error) {
        results.push({
          scheduleId: schedule.schedule_id,
          name: schedule.name,
          success: false,
          error: error.message
        });
      }
    }
    
    // Return summary
    res.json({
      success: true,
      format,
      totalSchedules: schedules.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error('Error batch exporting schedules:', error);
    res.status(500).json({ 
      error: 'Failed to batch export schedules',
      details: error.message
    });
  }
});

module.exports = router;