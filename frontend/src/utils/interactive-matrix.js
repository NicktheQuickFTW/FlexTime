/**
 * FlexTime Interactive Matrix Schedule
 * 
 * This component provides drag-and-drop functionality for the matrix schedule view,
 * allowing users to easily modify schedules by dragging opponents between cells.
 * It also includes a synchronized vertical matchup planner.
 */

// Define the Interactive Matrix module
const InteractiveMatrix = (function() {
  // Private variables
  let matrixElement = null;
  let plannerElement = null;
  let scheduleData = null;
  let teams = [];
  let dates = [];
  let onChangeCallback = null;
  
  // Configuration options
  const defaultConfig = {
    cellHeight: 40,
    cellWidth: 120,
    dateColumnWidth: 150,
    headerHeight: 50,
    plannerWidth: 300,
    animationSpeed: 300,
    colors: {
      homeGame: '#e6ffe6',
      awayGame: '#ffe6e6',
      dragOver: '#e6f7ff',
      selected: '#fffde7',
      plannerBg: '#f5f5f5',
      plannerItem: '#ffffff',
      plannerDragOver: '#e3f2fd'
    }
  };
  
  let config = { ...defaultConfig };
  
  /**
   * Initialize the interactive matrix
   * @param {HTMLElement} matrixEl - Container for the matrix view
   * @param {HTMLElement} plannerEl - Container for the vertical planner
   * @param {Object} data - Schedule data
   * @param {Object} options - Configuration options
   */
  function init(matrixEl, plannerEl, data, options = {}) {
    matrixElement = matrixEl;
    plannerElement = plannerEl;
    scheduleData = data;
    
    // Update config with user options
    config = { ...config, ...options };
    
    // Extract teams and dates
    teams = data.teams || [];
    dates = [...new Set(data.games.map(g => g.date))].sort();
    
    // Initialize the matrix view
    initMatrixView();
    
    // Initialize the vertical planner
    initVerticalPlanner();
    
    // Add global event listeners
    addEventListeners();
  }
  
  /**
   * Initialize the matrix view
   */
  function initMatrixView() {
    // Clear existing content
    matrixElement.innerHTML = '';
    matrixElement.className = 'ft-matrix-container';
    
    // Create matrix structure
    const matrixTable = document.createElement('table');
    matrixTable.className = 'ft-matrix-table';
    
    // Create header row
    const headerRow = document.createElement('tr');
    headerRow.className = 'ft-matrix-header';
    
    // Add date header cell
    const dateHeader = document.createElement('th');
    dateHeader.className = 'ft-date-header';
    dateHeader.textContent = 'Date / Team';
    dateHeader.style.width = `${config.dateColumnWidth}px`;
    headerRow.appendChild(dateHeader);
    
    // Add team header cells
    teams.forEach(team => {
      const teamHeader = document.createElement('th');
      teamHeader.className = 'ft-team-header';
      
      // Use short name instead of nickname
      const shortName = getTeamShortName(team);
      teamHeader.textContent = shortName;
      
      teamHeader.dataset.teamId = team.id;
      teamHeader.style.width = `${config.cellWidth}px`;
      teamHeader.style.backgroundColor = team.primaryColor || '#ffffff';
      teamHeader.style.color = getContrastColor(team.primaryColor || '#ffffff');
      headerRow.appendChild(teamHeader);
    });
    
    // Add header row to table
    const thead = document.createElement('thead');
    thead.appendChild(headerRow);
    matrixTable.appendChild(thead);
    
    // Create table body for dates and games
    const tbody = document.createElement('tbody');
    
    // Group dates if needed (e.g., by week or month)
    const dateGroups = groupDates(dates);
    
    // Create rows for each date group
    dateGroups.forEach(group => {
      // Add group header row if grouping is enabled
      if (group.label) {
        const groupRow = document.createElement('tr');
        groupRow.className = 'ft-date-group';
        
        const groupCell = document.createElement('td');
        groupCell.textContent = group.label;
        groupCell.colSpan = teams.length + 1;
        groupCell.className = 'ft-group-header';
        
        groupRow.appendChild(groupCell);
        tbody.appendChild(groupRow);
      }
      
      // Add row for each date
      group.dates.forEach(date => {
        const dateRow = document.createElement('tr');
        dateRow.className = 'ft-date-row';
        dateRow.dataset.date = date;
        
        // Add date cell
        const dateCell = document.createElement('td');
        dateCell.className = 'ft-date-cell';
        dateCell.textContent = formatDate(date);
        dateRow.appendChild(dateCell);
        
        // Add game cells for each team
        teams.forEach(team => {
          const gameCell = document.createElement('td');
          gameCell.className = 'ft-game-cell';
          gameCell.dataset.date = date;
          gameCell.dataset.teamId = team.id;
          
          // Find game for this team on this date
          const game = findGame(team.id, date);
          
          if (game) {
            // Set game data
            gameCell.dataset.gameId = game.id;
            gameCell.dataset.opponentId = game.opponentId;
            gameCell.dataset.gameType = game.isAway ? 'away' : 'home';
            
            // Create game content
            const gameContent = document.createElement('div');
            gameContent.className = `ft-game-content ft-game-${game.isAway ? 'away' : 'home'}`;
            gameContent.textContent = game.isAway ? 
              `at ${game.opponentName}` : 
              game.opponentName;
            
            gameCell.appendChild(gameContent);
            gameCell.style.backgroundColor = game.isAway ? 
              config.colors.awayGame : 
              config.colors.homeGame;
            
            // Make draggable
            gameContent.draggable = true;
            gameContent.addEventListener('dragstart', handleDragStart);
          }
          
          // Make cell a drop target
          gameCell.addEventListener('dragover', handleDragOver);
          gameCell.addEventListener('dragleave', handleDragLeave);
          gameCell.addEventListener('drop', handleDrop);
          gameCell.addEventListener('click', handleCellClick);
          
          dateRow.appendChild(gameCell);
        });
        
        tbody.appendChild(dateRow);
      });
    });
    
    matrixTable.appendChild(tbody);
    matrixElement.appendChild(matrixTable);
  }
  
  /**
   * Initialize the vertical planner
   */
  function initVerticalPlanner() {
    // Clear existing content
    plannerElement.innerHTML = '';
    plannerElement.className = 'ft-planner-container';
    
    // Create planner header
    const plannerHeader = document.createElement('div');
    plannerHeader.className = 'ft-planner-header';
    plannerHeader.textContent = 'Matchup Planner';
    plannerElement.appendChild(plannerHeader);
    
    // Create unscheduled games section
    const unscheduledSection = document.createElement('div');
    unscheduledSection.className = 'ft-unscheduled-section';
    
    const unscheduledHeader = document.createElement('h3');
    unscheduledHeader.textContent = 'Unscheduled Matchups';
    unscheduledSection.appendChild(unscheduledHeader);
    
    // Get all possible matchups
    const allMatchups = getAllPossibleMatchups();
    
    // Filter to unscheduled matchups
    const unscheduledMatchups = allMatchups.filter(matchup => 
      !findGameByTeams(matchup.team1.id, matchup.team2.id)
    );
    
    // Create unscheduled matchups list
    const matchupsList = document.createElement('ul');
    matchupsList.className = 'ft-matchups-list';
    
    unscheduledMatchups.forEach(matchup => {
      const matchupItem = document.createElement('li');
      matchupItem.className = 'ft-matchup-item';
      matchupItem.draggable = true;
      matchupItem.dataset.team1Id = matchup.team1.id;
      matchupItem.dataset.team2Id = matchup.team2.id;
      
      matchupItem.textContent = `${getTeamShortName(matchup.team1)} vs ${getTeamShortName(matchup.team2)}`;
      
      // Add drag event handlers
      matchupItem.addEventListener('dragstart', handleMatchupDragStart);
      
      matchupsList.appendChild(matchupItem);
    });
    
    unscheduledSection.appendChild(matchupsList);
    plannerElement.appendChild(unscheduledSection);
    
    // Create scheduled games section grouped by date
    const scheduledSection = document.createElement('div');
    scheduledSection.className = 'ft-scheduled-section';
    
    const scheduledHeader = document.createElement('h3');
    scheduledHeader.textContent = 'Scheduled Games';
    scheduledSection.appendChild(scheduledHeader);
    
    // Group games by date
    const gamesByDate = {};
    scheduleData.games.forEach(game => {
      if (!gamesByDate[game.date]) {
        gamesByDate[game.date] = [];
      }
      gamesByDate[game.date].push(game);
    });
    
    // Create scheduled games list
    Object.keys(gamesByDate).sort().forEach(date => {
      const dateGroup = document.createElement('div');
      dateGroup.className = 'ft-date-group';
      
      const dateHeader = document.createElement('h4');
      dateHeader.className = 'ft-date-header';
      dateHeader.textContent = formatDate(date);
      dateGroup.appendChild(dateHeader);
      
      const gamesList = document.createElement('ul');
      gamesList.className = 'ft-games-list';
      gamesList.dataset.date = date;
      
      gamesByDate[date].forEach(game => {
        const gameItem = createGameListItem(game);
        gamesList.appendChild(gameItem);
      });
      
      dateGroup.appendChild(gamesList);
      scheduledSection.appendChild(dateGroup);
    });
    
    plannerElement.appendChild(scheduledSection);
  }
  
  /**
   * Create a game list item for the vertical planner
   */
  function createGameListItem(game) {
    const homeTeam = findTeamById(game.homeTeam);
    const awayTeam = findTeamById(game.awayTeam);
    
    if (!homeTeam || !awayTeam) return null;
    
    const gameItem = document.createElement('li');
    gameItem.className = 'ft-game-item';
    gameItem.draggable = true;
    gameItem.dataset.gameId = game.id;
    gameItem.dataset.date = game.date;
    gameItem.dataset.homeTeamId = game.homeTeam;
    gameItem.dataset.awayTeamId = game.awayTeam;
    
    gameItem.textContent = `${getTeamShortName(awayTeam)} at ${getTeamShortName(homeTeam)}`;
    
    // Add drag event handlers
    gameItem.addEventListener('dragstart', handleGameItemDragStart);
    
    return gameItem;
  }
  
  /**
   * Add global event listeners
   */
  function addEventListeners() {
    // Add button to add new date
    const addDateButton = document.createElement('button');
    addDateButton.className = 'ft-add-date-button';
    addDateButton.textContent = 'Add Date';
    addDateButton.addEventListener('click', handleAddDate);
    
    matrixElement.parentNode.insertBefore(addDateButton, matrixElement.nextSibling);
    
    // Add save button
    const saveButton = document.createElement('button');
    saveButton.className = 'ft-save-button';
    saveButton.textContent = 'Save Schedule';
    saveButton.addEventListener('click', handleSaveSchedule);
    
    matrixElement.parentNode.insertBefore(saveButton, matrixElement.nextSibling);
  }
  
  // --- Event Handlers ---
  
  /**
   * Handle drag start from a game cell
   */
  function handleDragStart(event) {
    const gameContent = event.target;
    const gameCell = gameContent.parentNode;
    
    const dragData = {
      gameId: gameCell.dataset.gameId,
      teamId: gameCell.dataset.teamId,
      date: gameCell.dataset.date,
      opponentId: gameCell.dataset.opponentId,
      gameType: gameCell.dataset.gameType
    };
    
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'move';
    
    // Add drag class for styling
    gameContent.classList.add('ft-dragging');
    
    // Highlight valid drop targets
    highlightValidDropTargets(dragData);
  }
  
  /**
   * Handle drag over a game cell
   */
  function handleDragOver(event) {
    // Check if this is a valid drop target
    if (isValidDropTarget(event.target)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      
      // Add drag-over styling
      event.target.classList.add('ft-dragover');
    }
  }
  
  /**
   * Handle drag leave from a game cell
   */
  function handleDragLeave(event) {
    event.target.classList.remove('ft-dragover');
  }
  
  /**
   * Handle drop on a game cell
   */
  function handleDrop(event) {
    event.preventDefault();
    
    // Remove drag-over styling
    event.target.classList.remove('ft-dragover');
    
    // Get drop target information
    const dropTarget = event.target.closest('.ft-game-cell');
    const targetDate = dropTarget.dataset.date;
    const targetTeamId = dropTarget.dataset.teamId;
    
    // Get the drag data
    const dragDataStr = event.dataTransfer.getData('application/json');
    if (!dragDataStr) return;
    
    const dragData = JSON.parse(dragDataStr);
    
    // Process the move
    if (dragData.gameId) {
      // This is an existing game being moved
      moveGameToNewSlot(dragData, targetTeamId, targetDate);
    } else if (dragData.team1Id && dragData.team2Id) {
      // This is an unscheduled matchup being placed
      scheduleNewMatchup(dragData.team1Id, dragData.team2Id, targetTeamId, targetDate);
    }
    
    // Reset highlighted cells
    resetHighlightedCells();
    
    // Update the UI
    refreshUI();
  }
  
  /**
   * Handle click on a cell (for selection)
   */
  function handleCellClick(event) {
    // Clear any existing selections
    document.querySelectorAll('.ft-selected').forEach(el => {
      el.classList.remove('ft-selected');
    });
    
    // Select this cell
    const cell = event.target.closest('.ft-game-cell');
    if (cell) {
      cell.classList.add('ft-selected');
      
      // If there's a game, also select the opponent's cell
      if (cell.dataset.gameId) {
        const opponentId = cell.dataset.opponentId;
        const date = cell.dataset.date;
        
        // Find the opponent's cell
        const opponentCell = document.querySelector(
          `.ft-game-cell[data-date="${date}"][data-team-id="${opponentId}"]`
        );
        
        if (opponentCell) {
          opponentCell.classList.add('ft-selected');
        }
      }
    }
  }
  
  /**
   * Handle drag start from a matchup item in the planner
   */
  function handleMatchupDragStart(event) {
    const matchupItem = event.target;
    
    const dragData = {
      team1Id: matchupItem.dataset.team1Id,
      team2Id: matchupItem.dataset.team2Id
    };
    
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'copy';
    
    // Add drag class for styling
    matchupItem.classList.add('ft-dragging');
    
    // Highlight all empty cells as valid drop targets
    highlightEmptyCells();
  }
  
  /**
   * Handle drag start from a game item in the planner
   */
  function handleGameItemDragStart(event) {
    const gameItem = event.target;
    
    const dragData = {
      gameId: gameItem.dataset.gameId,
      date: gameItem.dataset.date,
      homeTeamId: gameItem.dataset.homeTeamId,
      awayTeamId: gameItem.dataset.awayTeamId
    };
    
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'move';
    
    // Add drag class for styling
    gameItem.classList.add('ft-dragging');
    
    // Highlight valid drop targets
    highlightValidDropTargets(dragData);
  }
  
  /**
   * Handle adding a new date
   */
  function handleAddDate() {
    // Show date picker dialog
    const date = prompt('Enter a date (YYYY-MM-DD):', 
                        new Date().toISOString().split('T')[0]);
    
    if (date && isValidDate(date)) {
      // Add the new date if it doesn't already exist
      if (!dates.includes(date)) {
        dates.push(date);
        dates.sort();
        
        // Refresh the UI
        refreshUI();
      }
    }
  }
  
  /**
   * Handle save schedule
   */
  function handleSaveSchedule() {
    // Call the onChange callback with the current schedule data
    if (typeof onChangeCallback === 'function') {
      onChangeCallback(scheduleData);
    }
    
    // Could also make an API call here to save the data
    console.log('Schedule saved:', scheduleData);
    
    // Show confirmation message
    alert('Schedule saved successfully!');
  }
  
  // --- Helper Functions ---
  
  /**
   * Group dates by week, month, etc.
   */
  function groupDates(dates, groupBy = 'week') {
    if (groupBy === 'none') {
      return [{ dates }];
    }
    
    // Implementation for grouping by week or month
    // Similar to the Python implementation in matrix_schedule_view.py
    
    // For simplicity, we'll group by week here
    const weekMap = {};
    
    dates.forEach(dateStr => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Find the Saturday of this week (for sports purposes)
      const daysToSaturday = dayOfWeek === 6 ? 0 : 6 - dayOfWeek;
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() + daysToSaturday);
      
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = [];
      }
      
      weekMap[weekKey].push(dateStr);
    });
    
    const groups = [];
    Object.keys(weekMap).sort().forEach(weekKey => {
      groups.push({
        label: `Week of ${formatDate(weekKey)}`,
        dates: weekMap[weekKey].sort()
      });
    });
    
    return groups;
  }
  
  /**
   * Format a date string
   */
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  /**
   * Find a game for a team on a specific date
   */
  function findGame(teamId, date) {
    const games = scheduleData.games || [];
    
    for (const game of games) {
      if (game.date === date) {
        if (game.homeTeam === teamId) {
          const opponent = findTeamById(game.awayTeam);
          return {
            id: game.id,
            date: game.date,
            opponentId: game.awayTeam,
            opponentName: opponent ? (opponent.nickname || opponent.name) : 'Unknown',
            isAway: false
          };
        } else if (game.awayTeam === teamId) {
          const opponent = findTeamById(game.homeTeam);
          return {
            id: game.id,
            date: game.date,
            opponentId: game.homeTeam,
            opponentName: opponent ? (opponent.nickname || opponent.name) : 'Unknown',
            isAway: true
          };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Find a game by two team IDs (in either home/away arrangement)
   */
  function findGameByTeams(team1Id, team2Id) {
    const games = scheduleData.games || [];
    
    return games.find(game => 
      (game.homeTeam === team1Id && game.awayTeam === team2Id) ||
      (game.homeTeam === team2Id && game.awayTeam === team1Id)
    );
  }
  
  /**
   * Find a team by ID
   */
  function findTeamById(teamId) {
    return teams.find(team => team.id === teamId);
  }
  
  /**
   * Get all possible matchups between teams
   */
  function getAllPossibleMatchups() {
    const matchups = [];
    
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matchups.push({
          team1: teams[i],
          team2: teams[j]
        });
      }
    }
    
    return matchups;
  }
  
  /**
   * Check if a date string is valid
   */
  function isValidDate(dateStr) {
    const date = new Date(dateStr);
    return !isNaN(date) && date.toISOString().split('T')[0] === dateStr;
  }
  
  /**
   * Check if a drop target is valid
   */
  function isValidDropTarget(element) {
    return element.classList.contains('ft-game-cell');
  }
  
  /**
   * Highlight valid drop targets for a drag operation
   */
  function highlightValidDropTargets(dragData) {
    // Implementation would depend on the specific rules for valid drops
    // For simplicity, we'll just highlight empty cells
    highlightEmptyCells();
  }
  
  /**
   * Highlight empty cells
   */
  function highlightEmptyCells() {
    document.querySelectorAll('.ft-game-cell').forEach(cell => {
      if (!cell.hasChildNodes() || cell.children.length === 0) {
        cell.classList.add('ft-valid-target');
      }
    });
  }
  
  /**
   * Reset highlighted cells
   */
  function resetHighlightedCells() {
    document.querySelectorAll('.ft-valid-target, .ft-dragover').forEach(el => {
      el.classList.remove('ft-valid-target', 'ft-dragover');
    });
  }
  
  /**
   * Move a game to a new slot
   */
  function moveGameToNewSlot(dragData, targetTeamId, targetDate) {
    // Find the game in the data
    const gameIndex = scheduleData.games.findIndex(g => g.id === dragData.gameId);
    
    if (gameIndex >= 0) {
      const game = scheduleData.games[gameIndex];
      
      // Update the game data
      if (dragData.gameType === 'home') {
        // Moving a home game
        if (targetTeamId === dragData.teamId) {
          // Same team, just changing date
          game.date = targetDate;
        } else {
          // Changing team and/or date
          game.homeTeam = targetTeamId;
          game.date = targetDate;
        }
      } else {
        // Moving an away game
        if (targetTeamId === dragData.teamId) {
          // Same team, just changing date
          game.date = targetDate;
        } else {
          // Changing team and/or date
          game.awayTeam = targetTeamId;
          game.date = targetDate;
        }
      }
    }
  }
  
  /**
   * Schedule a new matchup
   */
  function scheduleNewMatchup(team1Id, team2Id, targetTeamId, targetDate) {
    // Create a new game
    const newGame = {
      id: generateUniqueId(),
      date: targetDate,
      homeTeam: targetTeamId,
      awayTeam: targetTeamId === team1Id ? team2Id : team1Id
    };
    
    // Add to schedule data
    scheduleData.games.push(newGame);
  }
  
  /**
   * Generate a unique ID
   */
  function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  /**
   * Get a contrasting text color for a background color
   */
  function getContrastColor(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
  
  /**
   * Get the short name for a team
   */
  function getTeamShortName(team) {
    // Map of team IDs to short names
    const shortNames = {
      // Use proper abbreviations per Big 12 branding guidelines
      'TCU': 'TCU', // Always use TCU, never Texas Christian University
      'UCF': 'UCF', // Always use UCF, never University of Central Florida
      'BYU': 'BYU', // Always use BYU, never Brigham Young University
    };
    
    // If we have a specific short name mapping, use it
    if (team.abbreviation && shortNames[team.abbreviation]) {
      return shortNames[team.abbreviation];
    }
    
    // Otherwise extract the short name from the full name
    if (team.name) {
      // Handle special cases
      if (team.name.includes('Texas Christian')) return 'TCU';
      if (team.name.includes('Central Florida')) return 'UCF';
      if (team.name.includes('Brigham Young')) return 'BYU';
      
      // For University of X or X State University, use just X
      if (team.name.startsWith('University of ')) {
        return team.name.replace('University of ', '');
      }
      
      if (team.name.endsWith('State University')) {
        return team.name.replace(' State University', ' State');
      }
      
      if (team.name.endsWith('University')) {
        return team.name.replace(' University', '');
      }
      
      // For other cases, return the full name or a part of it
      const nameParts = team.name.split(' ');
      return nameParts.length > 1 ? nameParts[0] : team.name;
    }
    
    // Fallback to nickname if no name is available
    return team.nickname || 'Team';
  }
  
  /**
   * Refresh the UI
   */
  function refreshUI() {
    // Re-initialize both views
    initMatrixView();
    initVerticalPlanner();
  }
  
  /**
   * Set a callback for when schedule changes
   */
  function onChange(callback) {
    onChangeCallback = callback;
  }
  
  // Public API
  return {
    init,
    refreshUI,
    onChange
  };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InteractiveMatrix;
}
