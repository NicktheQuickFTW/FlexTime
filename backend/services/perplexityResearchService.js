/**
 * Perplexity API Research Service
 * Deep research service for comprehensive sports analytics and data gathering
 */

const axios = require('axios');

class PerplexityResearchService {
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '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';
    this.baseUrl = 'https://api.perplexity.ai/chat/completions';
    this.model = 'llama-3.1-sonar-large-128k-online'; // Best model for deep research with web access
  }

  // Alias for backward compatibility
  async search(query, options = {}) {
    return this.deepResearch(query, options);
  }

  async deepResearch(query, options = {}) {
    const {
      maxTokens = 4000,
      temperature = 0.1, // Low temperature for factual research
      searchDepth = 'comprehensive',
      includeRecentSources = true,
      timeframe = 'last 5 years'
    } = options;

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are a comprehensive sports analytics researcher specializing in college sports. 
              
              RESEARCH REQUIREMENTS:
              - Conduct deep, multi-source research using current and historical data
              - Include specific statistics, records, coaching changes, recruiting data
              - Verify information across multiple reliable sources
              - Focus on factual accuracy and comprehensive coverage
              - Include recent developments and trends
              - Provide specific dates, numbers, and verifiable details
              
              SOURCES TO PRIORITIZE:
              - ESPN, CBS Sports, Sports Illustrated, The Athletic
              - Official university athletics websites
              - Conference websites and press releases
              - 247Sports, Rivals for recruiting data
              - NCAA official statistics and records
              - Local sports media for detailed coverage
              - X (Twitter) for real-time updates on certain sports (wrestling, tennis, soccer)
              - Sport-specific sources (TopDrawerSoccer, VolleyballMag, etc.)
              
              OUTPUT FORMAT:
              - Provide detailed, structured information
              - Include source attribution where possible
              - Organize chronologically when relevant
              - Include specific metrics and statistics
              - Note any conflicting information from sources`
            },
            {
              role: 'user',
              content: `${query}
              
              Research Parameters:
              - Timeframe: ${timeframe}
              - Search Depth: ${searchDepth}
              - Include Recent Sources: ${includeRecentSources}
              
              Please provide comprehensive research with specific details, statistics, and source-backed information.`
            }
          ],
          max_tokens: maxTokens,
          temperature: temperature,
          top_p: 0.9,
          search_domain_filter: ["espn.com", "cbssports.com", "si.com", "theathletic.com", "247sports.com", "rivals.com", "ncaa.com"],
          return_citations: true,
          return_images: false,
          recency_filter: "month"
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000 // 60 second timeout for deep research
        }
      );

      return {
        content: response.data.choices[0].message.content,
        citations: response.data.citations || [],
        usage: response.data.usage,
        timestamp: new Date().toISOString(),
        model: this.model,
        query: query
      };
    } catch (error) {
      console.error('Perplexity API Error:', error.response?.data || error.message);
      throw new Error(`Perplexity research failed: ${error.message}`);
    }
  }

  async researchTeamHistory(teamName, seasons = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25']) {
    const query = `Research comprehensive ${teamName} men's basketball program history for seasons ${seasons.join(', ')}:

    REQUIRED INFORMATION:
    1. Season Records & Performance:
       - Overall win-loss records for each season
       - Conference records and standings
       - NCAA Tournament appearances, seeds, and results
       - Conference tournament performance
       - Notable wins and losses

    2. Coaching Information:
       - Head coach tenure and contract details
       - Coaching changes with dates and circumstances
       - Assistant coaching staff changes
       - Coaching philosophy and system changes

    3. Player Development:
       - Key players by season with statistics
       - NBA Draft picks and professional players
       - Transfer portal activity (in and out)
       - Recruiting class rankings and key commits

    4. Program Metrics:
       - Attendance figures and fan support
       - Academic performance and APR scores
       - Facility improvements and investments
       - NIL program development

    5. Recent Developments (2024-25):
       - Current season performance
       - Roster construction and key additions
       - Coaching staff updates
       - Recruiting momentum for 2025-26

    Provide specific statistics, dates, and verifiable details for comprehensive analysis.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'last 5 years'
    });
  }

  async researchTeamProjections(teamName, targetSeasons = ['2025-26', '2026-27']) {
    const query = `Research and analyze ${teamName} men's basketball program projections for ${targetSeasons.join(' and ')} seasons:

    PROJECTION FACTORS:
    1. Current Program Foundation:
       - Coaching stability and contract status
       - Current roster composition and returning players
       - Recruiting pipeline and committed players
       - Transfer portal strategy and success

    2. Competitive Outlook:
       - Conference standing projections
       - NCAA Tournament probability and seeding potential
       - Key games and rivalry matchups
       - Championship contention timeline

    3. Program Development:
       - Facility plans and infrastructure investments
       - NIL program growth and market position
       - Recruiting territory advantages and challenges
       - Academic and compliance standing

    4. Market Position:
       - Fan support and attendance trends
       - Media coverage and national perception
       - Revenue generation and financial health
       - Conference realignment impact

    5. Risk Factors:
       - Coaching departure probability
       - Key player graduation/departure timeline
       - Conference competition level changes
       - External program challenges

    Base projections on current trends, recruiting momentum, coaching stability, and program investment patterns. Include best-case, expected, and worst-case scenarios.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'current trends and future outlook'
    });
  }

  async researchConferenceHistory(conference = 'Big 12', sport = 'men\'s basketball', seasons = 5) {
    const query = `Research comprehensive ${conference} Conference ${sport} history over the last ${seasons} seasons:

    CONFERENCE ANALYSIS:
    1. Overall Performance Trends:
       - Conference tournament winners by year
       - NCAA Tournament performance and seeding
       - National championship contenders and winners
       - Overall conference strength rankings

    2. Membership Changes:
       - Conference realignment timeline and impact
       - New member adaptation and performance
       - Departing member impact on competition level
       - Geographic and competitive balance changes

    3. Coaching Landscape:
       - Coaching turnover rates and major hires
       - Coaching contract extensions and stability
       - Successful coaching transitions and failures
       - Conference coaching award winners

    4. Recruiting and Transfer Portal:
       - Conference recruiting rankings and success
       - Transfer portal activity and impact on programs
       - NIL program development across conference
       - Top recruiting classes and their results

    5. Competitive Balance:
       - Parity measurements and competitive cycles
       - Dominant programs and their sustainability
       - Emerging programs and development timelines
       - Bottom-tier program improvement efforts

    Provide specific data, trends, and analysis for comprehensive conference evaluation.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: `last ${seasons} years`
    });
  }

  async researchBaseballTeamHistory(teamName, seasons = ['2020', '2021', '2022', '2023', '2024']) {
    const query = `Research comprehensive ${teamName} baseball program history for seasons ${seasons.join(', ')} (including 2024-25 postseason context):

    REQUIRED INFORMATION:
    1. Season Records & Performance:
       - Overall win-loss records for each season
       - Conference records and standings in Big 12 baseball
       - NCAA Tournament appearances, seeds, and regional/super regional results
       - Conference tournament performance
       - Notable wins and losses, key series victories
       - RPI rankings and strength of schedule

    2. Coaching Information:
       - Head coach tenure and contract details
       - Coaching changes with dates and circumstances
       - Assistant coaching staff changes (pitching coach, recruiting coordinator)
       - Coaching philosophy and developmental approach
       - Previous program experience and success

    3. Player Development:
       - Key players by season with statistics (batting avg, ERA, fielding %)
       - MLB Draft picks and professional signings
       - Transfer portal activity (in and out)
       - Recruiting class rankings and key commits
       - Player development success stories

    4. Program Metrics:
       - Attendance figures and fan support
       - Academic performance and APR scores
       - Facility improvements and stadium investments
       - NIL program development for baseball
       - Training facility and field conditions

    5. 2024-25 Postseason Context:
       - Current season performance and postseason results
       - Key returning players for 2025-26
       - Recruiting momentum and commitments
       - Conference competitive positioning

    Provide specific statistics, dates, and verifiable details focused on baseball program analysis.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'last 5 years'
    });
  }

  async researchBaseballTeamProjections(teamName, targetSeasons = ['2025-26', '2026-27']) {
    const query = `Research and analyze ${teamName} baseball program projections for ${targetSeasons.join(' and ')} seasons:

    PROJECTION FACTORS:
    1. Current Program Foundation:
       - Coaching stability and contract status
       - Current roster composition and returning players
       - Recruiting pipeline and committed players (2025, 2026 classes)
       - Transfer portal strategy and success in baseball
       - Pitching staff development and depth

    2. Competitive Outlook:
       - Big 12 Conference standing projections
       - NCAA Tournament probability and regional hosting potential
       - Key conference series and rivalry matchups
       - Championship contention timeline (conference and national)
       - Strength of schedule and RPI projections

    3. Program Development:
       - Facility plans and stadium infrastructure investments
       - NIL program growth and market position for baseball
       - Recruiting territory advantages and challenges
       - Academic and compliance standing
       - Training facility modernization plans

    4. Market Position:
       - Fan support and attendance trends
       - Media coverage and national perception
       - Revenue generation and financial health
       - Conference realignment impact on travel and competition
       - Regional/local market advantages

    5. Risk Factors:
       - Coaching departure probability
       - Key player graduation/departure timeline
       - Conference competition level changes
       - External program challenges (weather, facility issues)
       - Academic or compliance concerns

    Base projections on current trends, recruiting momentum, coaching stability, program investment patterns, and 2024-25 postseason performance. Include best-case, expected, and worst-case scenarios for 2025-26 preparation.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'current trends and future outlook'
    });
  }

  async researchWrestlingTeamHistory(teamName, seasons = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25']) {
    const query = `Research comprehensive ${teamName} wrestling program history for seasons ${seasons.join(', ')}:

    REQUIRED INFORMATION:
    1. Season Records & Performance:
       - Dual meet records for each season
       - Conference standings and tournament results
       - NCAA Tournament team performance and placement
       - Individual NCAA qualifiers and All-Americans
       - Notable dual meet victories and rivalries
       - Conference championship results

    2. Coaching Information:
       - Head coach tenure and contract details
       - Coaching changes with dates and circumstances
       - Assistant coaching staff changes
       - Coaching philosophy and training methods
       - Previous program experience and success

    3. Individual Wrestler Development:
       - NCAA All-Americans by season and weight class
       - NCAA individual champions and finalists
       - Conference champions and medalists
       - Transfer portal activity (in and out)
       - Recruiting class rankings and key commits
       - Professional wrestling/MMA success stories

    4. Program Metrics:
       - Team ranking progression (Coaches Poll, Amateur Wrestling News)
       - Attendance figures for home matches
       - Academic performance and APR scores
       - Facility improvements and training investments
       - NIL program development for wrestling

    5. Current Context (2024-25):
       - Season performance and postseason results
       - Key returning wrestlers for 2025-26
       - Recruiting momentum and commitments
       - Conference competitive positioning

    Provide specific statistics, rankings, and verifiable details focused on wrestling program analysis.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'last 5 years'
    });
  }

  async researchFootballTeamHistory(teamName, seasons = ['2020', '2021', '2022', '2023', '2024']) {
    const query = `Research comprehensive ${teamName} football program history for seasons ${seasons.join(', ')} (including 2024-25 context):

    REQUIRED INFORMATION:
    1. Season Records & Performance:
       - Overall win-loss records for each season
       - Conference records and standings in Big 12 football
       - Bowl game appearances and results
       - College Football Playoff appearances and rankings
       - Notable wins and losses, rivalry game results
       - AP Poll and Coaches Poll rankings progression

    2. Coaching Information:
       - Head coach tenure and contract details
       - Coaching changes with dates and circumstances
       - Assistant coaching staff changes (coordinators)
       - Coaching philosophy and offensive/defensive systems
       - Previous program experience and success

    3. Player Development:
       - Key players by season with statistics (passing, rushing, receiving)
       - NFL Draft picks and professional signings
       - Transfer portal activity (in and out)
       - Recruiting class rankings and key commits
       - Award winners (All-Americans, conference honors)

    4. Program Metrics:
       - Attendance figures and fan support
       - Academic performance and APR scores
       - Facility improvements and stadium investments
       - NIL program development for football
       - Training facility and equipment upgrades

    5. 2024-25 Context:
       - Season performance and bowl/playoff results
       - Key returning players for 2025-26
       - Recruiting momentum and commitments
       - Conference competitive positioning

    Provide specific statistics, rankings, and verifiable details focused on football program analysis.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'last 5 years'
    });
  }

  async researchFootballTeamProjections(teamName, targetSeasons = ['2025-26', '2026-27']) {
    const query = `Research and analyze ${teamName} football program projections for ${targetSeasons.join(' and ')} seasons with SPECIFIC FOCUS on Summer 2025 Transfer Portal and Current Recruiting:

    CRITICAL 2025-26 FOCUS AREAS:
    1. Summer 2025 Transfer Portal Analysis:
       - Key transfers IN: positions, previous schools, impact ratings
       - Major transfers OUT: losses and replacement strategies
       - Portal strategy effectiveness vs Big 12 competitors
       - Position group improvements/downgrades via portal
       - Coaching staff recruiting in portal vs high school

    2. 2025-26 Recruiting Class Status:
       - Current commits for 2025 class with rankings and positions
       - Key recruiting battles still ongoing for 2025
       - Early 2026 commits and momentum
       - Recruiting class rankings vs Big 12 competition
       - Flip potential and late recruiting surge capability

    3. Current Roster Construction for 2025-26:
       - Returning starters by position group
       - Depth chart analysis with transfers included
       - Position group strengths and weaknesses
       - Offensive/defensive line development priorities
       - Quarterback situation and competition

    4. Immediate Competitive Outlook:
       - Big 12 Conference standing projections for 2025-26
       - Key games and winnable/challenging matchups
       - Bowl game potential and College Football Playoff probability
       - Transfer portal impact on conference competitiveness
       - Coaching staff continuity and system implementation

    5. 2025-26 Season Projections:
       - Win-loss projections with reasoning
       - Breakthrough potential vs regression risk
       - Key factors for exceeding/underperforming expectations
       - NIL impact on roster retention and acquisition
       - Fan expectations vs realistic outcomes

    RESEARCH TIMEFRAME: Focus heavily on developments from Spring 2025 through current date (May 2025) including:
    - Spring portal activity and summer additions
    - Current recruiting commitments and targets
    - Recent coaching changes and their impact
    - 2025-26 season preparation and roster construction

    Provide specific names, rankings, and recent developments with dates for comprehensive 2025-26 season preparation analysis.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'Spring 2025 to current - Summer 2025 transfer portal focus'
    });
  }

  async researchTransferPortalSummer2025(teamName, sport = 'football') {
    // Handle sport naming for display
    const sportDisplay = sport.replace(/_/g, ' ').replace(/mens/g, "men's").replace(/womens/g, "women's");
    const query = `Research SUMMER 2025 TRANSFER PORTAL activity for ${teamName} ${sportDisplay} program:

    SUMMER 2025 TRANSFER PORTAL FOCUS:
    1. Key Transfers IN (Spring/Summer 2025):
       - Names, positions, previous schools, and commitment dates
       - Star ratings, years of eligibility, and projected impact
       - Position group needs addressed vs remaining holes
       - Comparison to portal targets that got away

    2. Major Transfers OUT (Spring/Summer 2025):
       - Names, positions, destinations, and departure reasons
       - Impact of losses on depth chart and team chemistry
       - Replacement strategies and how successfully addressed
       - Portal retention efforts and NIL competition

    3. Portal Strategy Analysis:
       - Coaching staff approach to portal vs high school recruiting
       - Success rate in portal recruiting battles vs Big 12 rivals
       - Position group prioritization in portal recruitment
       - NIL competitiveness and portal budget allocation

    4. Roster Construction Impact:
       - Starting lineup changes due to portal activity
       - Depth improvements or concerns created
       - Team chemistry and culture fit assessments
       - Academic/eligibility considerations with transfers

    5. Competitive Positioning:
       - How portal class ranks vs Big 12 competitors
       - Portal activity impact on 2025-26 season expectations
       - Position group advantages/disadvantages created
       - Overall program momentum shift from portal activity

    Focus on specific names, dates, and impact analysis for Summer 2025 transfer portal activity affecting 2025-26 season preparations.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'Summer 2025 - current transfer portal activity'
    });
  }

  async researchRecruitingSummer2025(teamName, sport = 'football') {
    // Handle sport naming for display
    const sportDisplay = sport.replace(/_/g, ' ').replace(/mens/g, "men's").replace(/womens/g, "women's");
    const query = `Research current 2025-26 RECRUITING STATUS for ${teamName} ${sportDisplay} program:

    2025 RECRUITING CLASS ANALYSIS:
    1. Current 2025 Commits:
       - Complete list with names, positions, star ratings, and commitment dates
       - Class ranking vs Big 12 and national competition
       - Position group breakdown and needs still remaining
       - Early enrollees vs fall arrivals

    2. Active 2025 Recruiting Battles:
       - Top remaining targets with visit schedules and leader status
       - Key position needs still to be addressed
       - Flip potential for current commits (in and out)
       - Official visit weekend success and upcoming visits

    3. Early 2026 Recruiting Momentum:
       - Early commits for 2026 class with details
       - Relationship building with top 2026 targets
       - Recruiting territory success and expansion
       - Junior day and camp participation impact

    4. Recruiting Infrastructure:
       - NIL program impact on recruiting success
       - Facility tours and infrastructure selling points
       - Coaching staff recruiting assignments and success
       - Support staff and recruiting operations effectiveness

    5. Competitive Analysis:
       - Recruiting head-to-head success vs Big 12 rivals
       - National recruiting reach vs regional focus
       - Development track record selling points
       - Academic/social/cultural fit messaging effectiveness

    Provide specific names, rankings, commitment dates, and current recruiting battle status for comprehensive 2025-26 recruiting analysis.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'Current 2025 recruiting cycle and early 2026 activity'
    });
  }

  // Enhanced Basketball Methods (incorporating transfer portal and recruiting focus)
  async researchEnhancedBasketballProjections(teamName, targetSeasons = ['2025-26', '2026-27']) {
    const query = `Research and analyze ${teamName} basketball program projections for ${targetSeasons.join(' and ')} seasons with SPECIFIC FOCUS on Summer 2025 Transfer Portal and Current Recruiting:

    CRITICAL 2025-26 FOCUS AREAS:
    1. Summer 2025 Transfer Portal Rankings & Analysis:
       - Key transfers IN: names, positions, previous schools, transfer rankings (ESPN, 247Sports, Rivals)
       - Transfer portal class ranking: National ranking vs Big 12 competitors
       - Major transfers OUT: losses, replacement strategies, impact on portal rankings
       - Portal strategy effectiveness: Portal class grade vs Big 12 competition
       - Position needs addressed with transfer rankings and impact ratings
       - Coaching staff recruiting approach and portal success rate

    2. 2025-26 Recruiting Class Rankings & Analysis:
       - Current commits for 2025 class with specific rankings (ESPN, 247Sports, Rivals)
       - Recruiting class rankings: National ranking, Big 12 ranking, position group grades
       - Key recruiting battles still ongoing for 2025 with target player rankings
       - Early 2026 commits and momentum with early rankings
       - Flip potential and late recruiting surge capability with ranking analysis
       - Elite camp and AAU circuit performance rankings

    3. Current Roster Construction for 2025-26:
       - Returning starters and key contributors
       - Depth chart analysis with transfers included
       - Position group strengths and weaknesses
       - Frontcourt/backcourt balance and development
       - Starting lineup projections

    4. Immediate Competitive Outlook:
       - Big 12 Conference standing projections for 2025-26
       - NCAA Tournament probability and seeding potential
       - Key conference games and rivalry matchups
       - Transfer portal impact on conference competitiveness

    5. 2025-26 Season Projections:
       - Win-loss projections with reasoning
       - Breakthrough potential vs regression risk
       - Key factors for exceeding/underperforming expectations
       - NIL impact on roster retention and acquisition

    Focus on Spring 2025 through current developments with specific names, rankings, and recent transfer/recruiting activity.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'Spring 2025 to current - transfer portal and recruiting focus'
    });
  }

  // Enhanced Softball Methods
  async researchEnhancedSoftballProjections(teamName, targetSeasons = ['2025-26', '2026-27']) {
    const query = `Research and analyze ${teamName} softball program projections for ${targetSeasons.join(' and ')} seasons with SPECIFIC FOCUS on Summer 2025 Transfer Portal and Current Recruiting:

    CRITICAL 2025-26 FOCUS AREAS:
    1. Summer 2025 Transfer Portal Rankings & Analysis:
       - Key transfers IN: names, positions, previous schools, transfer rankings (ESPN, Softball America, 247Sports)
       - Transfer portal class ranking: National ranking vs Big 12 competitors
       - Major transfers OUT: losses, replacement strategies, impact on portal rankings
       - Portal strategy effectiveness: Portal class grade vs Big 12 competition
       - Position needs (pitching, hitting, defense) addressed with transfer rankings
       - Graduate vs underclassman portal activity with ranking analysis

    2. 2025-26 Recruiting Class Rankings & Analysis:
       - Current commits for 2025 class with specific rankings (ESPN, Softball America, Extra Inning Softball)
       - Recruiting class rankings: National ranking, Big 12 ranking, position group grades
       - Key recruiting battles still ongoing for 2025 with target player rankings
       - Early 2026 commits and momentum with early rankings
       - International recruiting and JUCO transfer rankings and pipeline
       - Travel ball and showcase circuit performance rankings

    3. Current Roster Construction for 2025-26:
       - Returning starters by position
       - Pitching staff depth and development
       - Offensive lineup construction and depth
       - Defensive alignment and versatility
       - Leadership and team chemistry factors

    4. Immediate Competitive Outlook:
       - Big 12 Conference standing projections for 2025-26
       - NCAA Tournament probability and regional hosting potential
       - Key conference series and rivalry matchups
       - WCWS contention timeline and probability

    5. 2025-26 Season Projections:
       - Win-loss projections and RPI considerations
       - Breakthrough potential vs regression risk
       - Key factors for postseason success
       - NIL impact on roster retention in softball

    Focus on current developments affecting 2025-26 preparation with specific player names and impact analysis.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'Spring 2025 to current - softball portal and recruiting focus'
    });
  }

  // Enhanced Volleyball Methods
  async researchEnhancedVolleyballProjections(teamName, targetSeasons = ['2025-26', '2026-27']) {
    const query = `Research and analyze ${teamName} volleyball program projections for ${targetSeasons.join(' and ')} seasons with SPECIFIC FOCUS on Summer 2025 Transfer Portal and Current Recruiting:

    CRITICAL 2025-26 FOCUS AREAS:
    1. Summer 2025 Transfer Portal Rankings & Analysis:
       - Key transfers IN: names, positions, previous schools, transfer rankings (ESPN, 247Sports)
       - Transfer portal class ranking: National ranking vs Big 12 competitors
       - Major transfers OUT: losses, replacement strategies, impact on portal rankings
       - Portal strategy effectiveness: Portal class grade vs Big 12 competition
       - Position needs addressed with transfer rankings and impact ratings
       - Graduate vs underclassman portal moves with ranking comparisons

    2. 2025-26 Recruiting Class Rankings & Analysis:
       - Current commits for 2025 class with specific rankings (247Sports, ESPN, VolleyballMag)
       - Recruiting class rankings: National ranking, Big 12 ranking, position group grades
       - Key recruiting battles still ongoing for 2025 with target rankings
       - Early 2026 commits and momentum with early rankings
       - Transfer portal class rankings vs traditional recruiting balance
       - International recruiting pipeline rankings and impact players

    3. Current Roster Construction for 2025-26:
       - Returning starters by position (6-2, 5-1 systems)
       - Setter situation and offensive system
       - Front row/back row rotation depth
       - Defensive specialists and libero depth
       - Team chemistry and leadership factors

    4. Immediate Competitive Outlook:
       - Big 12 Conference standing projections for 2025-26
       - NCAA Tournament probability and seeding potential
       - Key conference matches and rivalry series
       - Final Four contention and championship timeline

    5. 2025-26 Season Projections:
       - Match win projections and set analysis
       - Breakthrough potential vs regression risk
       - Key factors for postseason advancement
       - NIL impact on volleyball roster retention

    Focus on current roster construction and recent transfer/recruiting developments affecting 2025-26 season preparation.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'Spring 2025 to current - volleyball portal and recruiting focus'
    });
  }

  // Enhanced Soccer Methods
  async researchEnhancedSoccerProjections(teamName, targetSeasons = ['2025-26', '2026-27']) {
    const query = `Research and analyze ${teamName} soccer program projections for ${targetSeasons.join(' and ')} seasons with SPECIFIC FOCUS on Summer 2025 Transfer Portal and Current Recruiting:

    CRITICAL 2025-26 FOCUS AREAS:
    1. Summer 2025 Transfer Portal Rankings & Analysis:
       - Key transfers IN: names, positions, previous schools, transfer rankings (TopDrawerSoccer, 247Sports)
       - Transfer portal class ranking: National ranking vs Big 12 competitors
       - Major transfers OUT: losses, replacement strategies, impact on portal rankings
       - Portal strategy effectiveness: Portal class grade vs Big 12 competition
       - Position needs (GK, defenders, midfielders, forwards) addressed with rankings
       - International transfers: rankings, eligibility, and global pipeline impact

    2. 2025-26 Recruiting Class Rankings & Analysis:
       - Current commits for 2025 class with specific rankings (TopDrawerSoccer, Soccer America, 247Sports)
       - Recruiting class rankings: National ranking, Big 12 ranking, position group grades
       - Key recruiting battles still ongoing for 2025 with target player rankings
       - Early 2026 commits and momentum with early rankings
       - International recruiting pipeline rankings and impact players
       - Club soccer vs academy player rankings and development paths

    3. Current Roster Construction for 2025-26:
       - Returning starters by position and formation
       - Goalkeeper situation and depth
       - Defensive line construction and versatility
       - Midfield creativity and depth
       - Forward line speed and finishing ability

    4. Immediate Competitive Outlook:
       - Big 12 Conference standing projections for 2025-26
       - NCAA Tournament probability and seeding potential
       - Key conference matches and rivalry games
       - College Cup contention and championship timeline

    5. 2025-26 Season Projections:
       - Match win projections and goal differential analysis
       - Breakthrough potential vs regression risk
       - Key factors for postseason success
       - NIL impact on soccer roster retention

    Focus on current tactical setup and recent transfer/recruiting developments affecting 2025-26 season preparation.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'Spring 2025 to current - soccer portal and recruiting focus'
    });
  }

  // Enhanced Wrestling Methods
  async researchEnhancedWrestlingProjections(teamName, targetSeasons = ['2025-26', '2026-27']) {
    const query = `Research and analyze ${teamName} wrestling program projections for ${targetSeasons.join(' and ')} seasons with SPECIFIC FOCUS on Summer 2025 Transfer Portal and Current Recruiting:

    CRITICAL 2025-26 FOCUS AREAS:
    1. Summer 2025 Transfer Portal Rankings & Analysis:
       - Key transfers IN: names, weight classes, previous schools, wrestling rankings (FloWrestling, InterMat, WrestleStat)
       - Transfer portal class ranking: National ranking vs wrestling competitors
       - Major transfers OUT: losses, replacement strategies, impact on team rankings
       - Portal strategy effectiveness: Portal class grade vs top wrestling programs
       - Weight class depth and coverage improvements with transfer rankings
       - Graduate vs underclassman transfer moves with ranking analysis

    2. 2025-26 Recruiting Class Rankings & Analysis:
       - Current commits for 2025 class with specific rankings (FloWrestling, InterMat, 247Sports)
       - Recruiting class rankings: National ranking, conference ranking, weight class grades
       - Key recruiting battles still ongoing for 2025 with target wrestler rankings
       - Early 2026 commits and momentum with early rankings
       - International recruiting and JUCO transfer rankings and pipeline
       - High school All-American and state champion recruiting success

    3. Current Roster Construction for 2025-26:
       - Returning starters by weight class (125-285)
       - Weight class depth and backup plans
       - Redshirt strategy and development timeline
       - Team scoring potential and dual meet strength
       - Leadership and room culture factors

    4. Immediate Competitive Outlook:
       - Conference standing projections (if applicable)
       - NCAA Tournament team qualification probability
       - Individual NCAA championship contenders by weight
       - Dual meet success projections and key matchups

    5. 2025-26 Season Projections:
       - Team scoring projections and tournament placement
       - Individual All-American potential by weight class
       - Breakthrough potential vs regression risk
       - Key factors for program advancement

    Focus on weight class construction and recent transfer/recruiting developments affecting 2025-26 lineup.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'Spring 2025 to current - wrestling portal and recruiting focus'
    });
  }

  async researchWrestlingTeamProjections(teamName, targetSeasons = ['2025-26', '2026-27']) {
    const query = `Research and analyze ${teamName} wrestling program projections for ${targetSeasons.join(' and ')} seasons:

    PROJECTION FACTORS:
    1. Current Program Foundation:
       - Coaching stability and contract status
       - Current roster composition and returning wrestlers
       - Recruiting pipeline and committed wrestlers (2025, 2026 classes)
       - Transfer portal strategy and success
       - Weight class depth and coverage

    2. Competitive Outlook:
       - Conference standing projections (if Big 12 wrestling)
       - NCAA Tournament team qualification probability
       - Individual NCAA championship contenders
       - Dual meet success projections
       - National ranking trajectory

    3. Program Development:
       - Facility plans and training infrastructure investments
       - NIL program growth and market position for wrestling
       - Recruiting territory advantages and challenges
       - Academic and compliance standing
       - Training methodology and innovation

    4. Market Position:
       - Fan support and attendance trends
       - Media coverage and national perception
       - Revenue generation and financial health
       - Regional/state wrestling culture advantages

    5. Risk Factors:
       - Coaching departure probability
       - Key wrestler graduation/departure timeline
       - Conference competition level changes
       - External program challenges
       - Academic or compliance concerns

    Base projections on current trends, recruiting momentum, coaching stability, program investment patterns. Include best-case, expected, and worst-case scenarios for wrestling success.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'current trends and future outlook'
    });
  }

  // Enhanced Tennis Methods
  async researchEnhancedTennisProjections(teamName, targetSeasons = ['2025-26', '2026-27']) {
    const query = `Research and analyze ${teamName} tennis program projections for ${targetSeasons.join(' and ')} seasons with SPECIFIC FOCUS on Summer 2025 Transfer Portal and Current Recruiting:

    CRITICAL 2025-26 FOCUS AREAS:
    1. Summer 2025 Transfer Portal Rankings & Analysis:
       - Key transfers IN: names, previous schools, UTR rankings, ITA rankings, ATP/WTA junior rankings
       - Transfer portal class ranking: National ranking vs tennis competitors
       - Major transfers OUT: losses, replacement strategies, impact on team rankings
       - Portal strategy effectiveness: Portal class grade vs top tennis programs
       - Singles/doubles lineup improvements with transfer rankings and UTR analysis
       - International transfers: UTR rankings, ITF junior rankings, eligibility impact

    2. 2025-26 Recruiting Class Rankings & Analysis:
       - Current commits for 2025 class with specific rankings (UTR, ITA, TennisRecruiting.net)
       - Recruiting class rankings: National ranking, conference ranking, singles/doubles grades
       - Key recruiting battles still ongoing for 2025 with target player rankings
       - Early 2026 commits and momentum with early rankings
       - International recruiting pipeline rankings (ITF juniors, UTR global rankings)
       - Junior college and prep school transfer rankings

    3. Current Roster Construction for 2025-26:
       - Returning players and rankings
       - Singles lineup depth (1-6 positions)
       - Doubles partnerships and combinations
       - Player development and improvement trajectories
       - Team chemistry and leadership

    4. Immediate Competitive Outlook:
       - Conference standing projections for 2025-26
       - NCAA Tournament probability and seeding potential
       - Key conference matches and rivalry series
       - National championship contention timeline

    5. 2025-26 Season Projections:
       - Team ranking projections and match win analysis
       - Individual player breakthrough potential
       - Key factors for postseason advancement
       - Facility and coaching impact on development

    Focus on lineup construction and recent transfer/recruiting developments affecting 2025-26 team strength.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'Spring 2025 to current - tennis portal and recruiting focus'
    });
  }

  // Enhanced Gymnastics Methods
  async researchEnhancedGymnasticsProjections(teamName, targetSeasons = ['2025-26', '2026-27']) {
    const query = `Research and analyze ${teamName} gymnastics program projections for ${targetSeasons.join(' and ')} seasons with SPECIFIC FOCUS on Summer 2025 Transfer Portal and Current Recruiting:

    CRITICAL 2025-26 FOCUS AREAS:
    1. Summer 2025 Transfer Portal Rankings & Analysis:
       - Key transfers IN: names, event specialties, previous schools, gymnastics rankings (Road to Nationals, College Gym News)
       - Transfer portal class ranking: National ranking vs gymnastics competitors
       - Major transfers OUT: losses, replacement strategies, impact on lineup rankings
       - Portal strategy effectiveness: Portal class grade vs top gymnastics programs
       - Event lineup improvements with transfer rankings (vault, bars, beam, floor)
       - Graduate vs underclassman transfer moves with ranking analysis

    2. 2025-26 Recruiting Class Rankings & Analysis:
       - Current commits for 2025 class with specific rankings (Road to Nationals, J.O. National Rankings)
       - Recruiting class rankings: National ranking, conference ranking, event-specific grades
       - Key recruiting battles still ongoing for 2025 with target gymnast rankings
       - Early 2026 commits and momentum with early rankings
       - Elite level recruiting pipeline (Level 10 nationals, Elite qualifiers)
       - International recruiting considerations and rankings

    3. Current Roster Construction for 2025-26:
       - Returning gymnasts by event specialty
       - All-around competition lineup depth
       - Event lineup construction (6 up, 5 count)
       - Injury recovery and return timelines
       - Freshman integration and development

    4. Immediate Competitive Outlook:
       - Conference standing projections for 2025-26
       - NCAA Regional and Championship qualification
       - Key conference meets and rivalry matchups
       - National championship contention factors

    5. 2025-26 Season Projections:
       - Team scoring potential and meet win projections
       - Individual event and all-around title contenders
       - Breakthrough potential vs regression risk
       - Key factors for postseason advancement

    Focus on lineup construction and scoring potential with recent transfer/recruiting impact on 2025-26 season.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'Spring 2025 to current - gymnastics portal and recruiting focus'
    });
  }

  // Enhanced Women's Basketball Methods
  async researchEnhancedWomensBasketballProjections(teamName, targetSeasons = ['2025-26', '2026-27']) {
    const query = `Research and analyze ${teamName} women's basketball program projections for ${targetSeasons.join(' and ')} seasons with SPECIFIC FOCUS on Summer 2025 Transfer Portal and Current Recruiting:

    CRITICAL 2025-26 FOCUS AREAS:
    1. Summer 2025 Transfer Portal Rankings & Analysis:
       - Key transfers IN: names, positions, previous schools, transfer rankings (ESPN, 247Sports, HoopGurlz)
       - Transfer portal class ranking: National ranking vs Big 12 competitors
       - Major transfers OUT: losses, replacement strategies, impact on portal rankings
       - Portal strategy effectiveness: Portal class grade vs Big 12 competition
       - Position needs addressed with transfer rankings and impact ratings
       - Graduate vs underclassman portal moves with ranking analysis

    2. 2025-26 Recruiting Class Rankings & Analysis:
       - Current commits for 2025 class with specific rankings (ESPN HoopGurlz, 247Sports, BlueStar)
       - Recruiting class rankings: National ranking, Big 12 ranking, position group grades
       - Key recruiting battles still ongoing for 2025 with target player rankings
       - Early 2026 commits and momentum with early rankings
       - International recruiting pipeline rankings and impact players
       - Elite camp and AAU circuit performance rankings

    3. Current Roster Construction for 2025-26:
       - Returning starters and key contributors
       - Depth chart analysis with transfers included
       - Position group strengths and weaknesses
       - Frontcourt/backcourt balance and chemistry
       - Leadership and veteran presence

    4. Immediate Competitive Outlook:
       - Big 12 Conference standing projections for 2025-26
       - NCAA Tournament probability and seeding potential
       - Key conference games and rivalry matchups
       - March Madness advancement potential

    5. 2025-26 Season Projections:
       - Win-loss projections with detailed reasoning
       - Breakthrough potential vs regression risk
       - Key factors for exceeding expectations
       - NIL impact on women's basketball roster retention

    Focus on current roster construction and recent transfer/recruiting developments affecting 2025-26 championship potential.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'Spring 2025 to current - women\'s basketball portal and recruiting focus'
    });
  }

  // Enhanced Lacrosse Methods
  async researchEnhancedLacrosseProjections(teamName, targetSeasons = ['2025-26', '2026-27']) {
    const query = `Research and analyze ${teamName} lacrosse program projections for ${targetSeasons.join(' and ')} seasons with SPECIFIC FOCUS on Summer 2025 Transfer Portal and Current Recruiting:

    CRITICAL 2025-26 FOCUS AREAS:
    1. Summer 2025 Transfer Portal Rankings & Analysis:
       - Key transfers IN: names, positions, previous schools, lacrosse rankings (Inside Lacrosse, LaxPower)
       - Transfer portal class ranking: National ranking vs lacrosse competitors
       - Major transfers OUT: losses, replacement strategies, impact on team rankings
       - Portal strategy effectiveness: Portal class grade vs top lacrosse programs
       - Position needs (attack, midfield, defense, goalie) addressed with transfer rankings
       - Graduate vs underclassman transfer moves with ranking analysis

    2. 2025-26 Recruiting Class Rankings & Analysis:
       - Current commits for 2025 class with specific rankings (Inside Lacrosse, LaxPower, 247Sports)
       - Recruiting class rankings: National ranking, conference ranking, position group grades
       - Key recruiting battles still ongoing for 2025 with target player rankings
       - Early 2026 commits and momentum with early rankings
       - Regional recruiting success and national expansion with ranking analysis
       - Club vs high school lacrosse pipeline rankings

    3. Current Roster Construction for 2025-26:
       - Returning starters by position group
       - Offensive unit chemistry and scoring ability
       - Defensive unit communication and effectiveness
       - Goaltending situation and depth
       - Face-off specialist development

    4. Immediate Competitive Outlook:
       - Conference standing projections for 2025-26
       - NCAA Tournament probability and seeding potential
       - Key conference games and rivalry matchups
       - Championship contention timeline and factors

    5. 2025-26 Season Projections:
       - Win-loss projections and strength of schedule
       - Breakthrough potential vs program building
       - Key factors for postseason advancement
       - Facility and regional support impact

    Focus on program development and recent transfer/recruiting impact on 2025-26 competitive positioning.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'Spring 2025 to current - lacrosse portal and recruiting focus'
    });
  }

  // CONSOLIDATED UNIFIED SPORT PIPELINE ASSESSMENT METHOD FOR 2025-26 SEASONS
  async researchUnifiedSportPipeline(teamName, sport, gender = null, targetSeasons = ['2025-26', '2026-27']) {
    const sportConfig = this.getSportConfiguration(sport, gender);
    
    const query = `Research and analyze ${teamName} ${sportConfig.fullName} program comprehensive pipeline assessment for ${targetSeasons.join(' and ')} seasons with COMPLETE 2025-26 FOCUS:

    🎯 UNIFIED SPORT PIPELINE ANALYSIS FRAMEWORK:

    1. SUMMER 2025 TRANSFER PORTAL COMPLETE ANALYSIS:
       - Key transfers IN: Names, positions/events, previous schools, transfer rankings (${sportConfig.rankingSources.join(', ')})
       - Transfer portal class ranking: National ranking vs ${sportConfig.conferenceContext} competitors
       - Major transfers OUT: Names, losses, replacement strategies, impact on program rankings
       - Portal strategy effectiveness: Portal class grade vs top ${sport} programs nationally
       - Position/event needs addressed with specific transfer rankings and impact ratings
       - Graduate vs underclassman transfer moves with comprehensive ranking analysis
       - International transfers: Rankings, eligibility impact, global pipeline assessment

    2. 2025-26 RECRUITING CLASS COMPLETE RANKINGS ANALYSIS:
       - Current commits for 2025 class: Names, positions/events, specific rankings (${sportConfig.rankingSources.join(', ')})
       - Recruiting class rankings: National ranking, conference ranking, position/event group grades
       - Key recruiting battles ongoing: Target names, rankings, competition analysis
       - Early 2026 commits and momentum: Names, rankings, early pipeline strength
       - ${sportConfig.recruitingSpecialty} recruiting pipeline rankings and impact players
       - Recruiting vs transfer portal balance: Class composition and strategy effectiveness

    3. CURRENT ROSTER CONSTRUCTION & DEPTH ANALYSIS 2025-26:
       - Returning starters: Names, positions/events, individual rankings, experience levels
       - ${sportConfig.tacticalElements} analysis with transfers and recruits integrated
       - Position/event group depth assessment with ranking-based projections
       - Leadership structure and team chemistry factors with new additions
       - ${sportConfig.uniqueFactors} considerations for 2025-26 season

    4. IMMEDIATE 2025-26 COMPETITIVE OUTLOOK:
       - ${sportConfig.conferenceContext} standing projections with portal/recruiting impact
       - ${sportConfig.postseasonTargets} probability and advancement potential
       - Key matchups and rivalry games: Strength analysis vs conference competition
       - ${sportConfig.championshipGoals} contention timeline and breakthrough factors
       - Coaching staff continuity and system implementation effectiveness

    5. 2025-26 SEASON COMPREHENSIVE PROJECTIONS:
       - Win-loss/performance projections with detailed reasoning and ranking support
       - Breakthrough potential vs regression risk: Key factors and probability analysis
       - Position/event group advantages and disadvantages vs conference competition
       - NIL impact on roster retention and ranked player acquisition effectiveness
       - Fan expectations vs realistic outcomes: Ranking-based performance modeling

    6. PROGRAM MOMENTUM & TRAJECTORY ASSESSMENT:
       - Historical performance trends (2020-2025) with ranking correlation analysis
       - Coaching staff stability and recruiting/portal success correlation
       - Facility improvements and infrastructure impact on recruiting rankings
       - Conference realignment impact on competitive positioning and recruiting
       - Long-term program trajectory: 2026-27 early outlook and sustainability factors

    RESEARCH FOCUS TIMEFRAME: Spring 2025 through current date (Summer 2025) with emphasis on:
    - Most recent transfer portal commitments and rankings
    - Current recruiting class status and late summer developments  
    - 2025-26 season preparation and roster finalization
    - Real-time competitive positioning and momentum analysis

    Provide comprehensive analysis with specific names, rankings, dates, and verified recent developments for complete 2025-26 ${sport} season preparation assessment.`;

    return await this.deepResearch(query, {
      maxTokens: 4000,
      searchDepth: 'comprehensive',
      timeframe: 'Spring 2025 to current - complete 2025-26 preparation focus'
    });
  }

  // Sport configuration method for unified pipeline assessment
  // Validate sport name
  validateSport(sport) {
    const validSports = [
      'football', 'basketball', 'men\'s basketball', 'women\'s basketball',
      'baseball', 'softball', 'volleyball', 'women\'s volleyball',
      'soccer', 'women\'s soccer', 'tennis', 'men\'s tennis', 'women\'s tennis',
      'wrestling', 'gymnastics', 'women\'s gymnastics', 'lacrosse',
      'swimming & diving', 'men\'s swimming & diving', 'women\'s swimming & diving',
      'golf', 'men\'s golf', 'women\'s golf',
      'track & field', 'men\'s track & field', 'women\'s track & field',
      'cross country', 'men\'s cross country', 'women\'s cross country'
    ];
    
    return validSports.includes(sport.toLowerCase());
  }

  getSportConfiguration(sport, gender = null) {
    const configs = {
      'football': {
        fullName: 'football',
        rankingSources: ['ESPN', '247Sports', 'Rivals', 'On3'],
        conferenceContext: 'Big 12',
        tacticalElements: 'Offensive/defensive line depth, quarterback situation, skill position depth',
        uniqueFactors: 'Bowl game potential, College Football Playoff probability, NIL impact',
        postseasonTargets: 'Bowl game and College Football Playoff',
        championshipGoals: 'Big 12 Championship and CFP',
        recruitingSpecialty: 'High school vs JUCO'
      },
      'basketball': {
        fullName: `${gender === 'womens' ? "women's" : "men's"} basketball`,
        rankingSources: gender === 'womens' ? ['ESPN HoopGurlz', '247Sports', 'BlueStar'] : ['ESPN', '247Sports', 'Rivals'],
        conferenceContext: 'Big 12',
        tacticalElements: 'Frontcourt/backcourt balance, starting lineup projections, depth chart',
        uniqueFactors: 'March Madness seeding potential, conference tournament positioning',
        postseasonTargets: 'NCAA Tournament and seeding',
        championshipGoals: 'Big 12 Championship and March Madness advancement',
        recruitingSpecialty: 'Elite camp and AAU circuit'
      },
      'volleyball': {
        fullName: 'volleyball',
        rankingSources: ['VolleyballMag', 'MaxPreps', 'AVCA Rankings', '247Sports'],
        conferenceContext: 'Big 12',
        tacticalElements: 'Setter situation and offensive system (6-2, 5-1), front/back row rotation',
        uniqueFactors: 'Final Four contention timeline, NCAA Tournament seeding',
        postseasonTargets: 'NCAA Tournament and seeding',
        championshipGoals: 'Big 12 Championship and Final Four',
        recruitingSpecialty: 'International recruiting'
      },
      'soccer': {
        fullName: 'soccer',
        rankingSources: ['TopDrawerSoccer', 'Soccer America', 'United Soccer Coaches', '247Sports'],
        conferenceContext: 'Big 12',
        tacticalElements: 'Formation and tactical system, goalkeeper situation, defensive/offensive balance',
        uniqueFactors: 'College Cup contention factors, international player integration',
        postseasonTargets: 'NCAA Tournament and advancement',
        championshipGoals: 'Big 12 Championship and College Cup',
        recruitingSpecialty: 'Club soccer vs academy player development'
      },
      'tennis': {
        fullName: `${gender === 'womens' ? "women's" : "men's"} tennis`,
        rankingSources: ['UTR', 'ITA', 'TennisRecruiting.net', 'ATP/WTA Junior Rankings'],
        conferenceContext: gender === 'mens' ? 'Big 12 (9 teams)' : 'Big 12 (16 teams)',
        tacticalElements: 'Singles lineup depth (1-6 positions), doubles partnerships and combinations',
        uniqueFactors: 'Individual player rankings and trajectories, international pipeline',
        postseasonTargets: 'NCAA Tournament and team advancement',
        championshipGoals: 'Big 12 Championship and NCAA Championship',
        recruitingSpecialty: 'International recruiting pipeline (ITF juniors)'
      },
      'gymnastics': {
        fullName: 'gymnastics',
        rankingSources: ['Road to Nationals', 'College Gym News', 'J.O. National Rankings'],
        conferenceContext: 'Big 12 (7 teams)',
        tacticalElements: 'Event lineup construction (6 up, 5 count), all-around competition depth',
        uniqueFactors: 'Individual event and all-around title contenders, scoring potential',
        postseasonTargets: 'NCAA Regional and Championship qualification',
        championshipGoals: 'NCAA Regional hosting and Championship advancement',
        recruitingSpecialty: 'Elite level recruiting (Level 10 nationals, Elite qualifiers)'
      },
      'wrestling': {
        fullName: 'wrestling',
        rankingSources: ['FloWrestling', 'InterMat', 'WrestleStat', 'Amateur Wrestling News'],
        conferenceContext: 'Big 12 Wrestling (14 teams)',
        tacticalElements: 'Weight class depth and coverage (125-285), dual meet lineup construction',
        uniqueFactors: 'Individual NCAA championship contenders, team scoring potential',
        postseasonTargets: 'NCAA Tournament team qualification and individual advancement',
        championshipGoals: 'Conference championships and NCAA team/individual titles',
        recruitingSpecialty: 'High school All-American and state champion'
      },
      'softball': {
        fullName: 'softball',
        rankingSources: ['ESPN', 'Softball America', 'Extra Inning Softball', '247Sports'],
        conferenceContext: 'Big 12',
        tacticalElements: 'Pitching staff depth and development, offensive lineup construction',
        uniqueFactors: 'WCWS contention probability, RPI and regional hosting capability',
        postseasonTargets: 'NCAA Tournament and regional hosting',
        championshipGoals: 'Big 12 Championship and WCWS advancement',
        recruitingSpecialty: 'Travel ball and showcase circuit'
      },
      'lacrosse': {
        fullName: 'lacrosse',
        rankingSources: ['Inside Lacrosse', 'LaxPower', 'NCAA Lacrosse Rankings', '247Sports'],
        conferenceContext: 'Big 12 Lacrosse',
        tacticalElements: 'Position group construction (attack, midfield, defense, goalie), unit chemistry',
        uniqueFactors: 'Championship contention timeline, regional expansion success',
        postseasonTargets: 'NCAA Tournament qualification and advancement',
        championshipGoals: 'Conference championship and NCAA Tournament success',
        recruitingSpecialty: 'Regional recruiting and national expansion'
      },
      'baseball': {
        fullName: 'baseball',
        rankingSources: ['ESPN', 'Baseball America', 'D1Baseball', 'Perfect Game', 'Collegiate Baseball'],
        conferenceContext: 'Big 12',
        tacticalElements: 'Pitching staff depth and development, offensive lineup construction and depth',
        uniqueFactors: 'Regional hosting capability, MLB Draft potential, weather advantages',
        postseasonTargets: 'NCAA Tournament and regional hosting',
        championshipGoals: 'Big 12 Championship and College World Series advancement',
        recruitingSpecialty: 'High school showcase circuit and JUCO transfers'
      }
    };

    return configs[sport.toLowerCase()] || configs['football']; // Default fallback
  }

  async parallelTeamResearch(teams, researchType = 'history') {
    const promises = teams.map(team => {
      if (researchType === 'history') {
        return this.researchTeamHistory(team);
      } else if (researchType === 'projections') {
        return this.researchTeamProjections(team);
      }
    });

    try {
      const results = await Promise.all(promises);
      return teams.reduce((acc, team, index) => {
        acc[team] = results[index];
        return acc;
      }, {});
    } catch (error) {
      console.error('Parallel research error:', error);
      throw error;
    }
  }
}

module.exports = PerplexityResearchService;