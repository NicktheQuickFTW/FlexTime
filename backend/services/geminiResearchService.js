/**
 * Gemini API Research Service
 * Comprehensive data analysis and synthesis service for sports analytics
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiResearchService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCRD31cPpVq2Um7BrgKZ4VMXoAJJI1__uE';
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro-latest',
      generationConfig: {
        temperature: 0.1, // Low temperature for factual analysis
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 8192,
      }
    });
  }

  async analyzeSportsData(data, analysisType, options = {}) {
    const {
      includeProjections = true,
      timeframe = '5 years',
      detailLevel = 'comprehensive'
    } = options;

    const prompt = `You are an elite sports analytics expert specializing in college basketball data analysis and projection modeling.

    ANALYSIS TASK: ${analysisType}
    
    DATA PROVIDED: ${JSON.stringify(data, null, 2)}
    
    ANALYSIS REQUIREMENTS:
    1. Data Synthesis and Validation:
       - Cross-reference information for accuracy
       - Identify patterns and trends in the data
       - Note any inconsistencies or gaps
       - Validate statistical relationships
    
    2. Historical Trend Analysis:
       - Identify performance trajectories over ${timeframe}
       - Analyze coaching impact on program development
       - Evaluate recruiting success and player development
       - Assess competitive position changes
    
    3. Predictive Modeling (if ${includeProjections}):
       - Project future performance based on current trends
       - Analyze sustainability of current success/struggles
       - Model impact of coaching/roster changes
       - Evaluate program ceiling and floor scenarios
    
    4. Comprehensive Assessment:
       - Strength and weakness identification
       - Competitive positioning analysis
       - Resource allocation effectiveness
       - Market position and brand strength
    
    5. Quantitative Metrics:
       - Calculate trend coefficients where applicable
       - Provide confidence intervals for projections
       - Identify leading and lagging indicators
       - Generate composite performance scores
    
    OUTPUT FORMAT:
    - Executive Summary (key findings)
    - Detailed Analysis by category
    - Trend Visualizations (describe data for charts)
    - Projection Models with confidence levels
    - Risk Assessment and scenario planning
    - Actionable insights and recommendations
    
    Provide analysis at ${detailLevel} level with specific metrics, percentages, and quantified assessments.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-latest',
        analysisType: analysisType,
        inputData: data
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Gemini analysis failed: ${error.message}`);
    }
  }

  async synthesizeResearchData(perplexityData, additionalData = {}) {
    const combinedData = {
      perplexityResearch: perplexityData,
      additionalSources: additionalData,
      timestamp: new Date().toISOString()
    };

    return await this.analyzeSportsData(
      combinedData, 
      'Research Data Synthesis and Trend Analysis',
      { 
        includeProjections: true,
        timeframe: '5 years',
        detailLevel: 'comprehensive'
      }
    );
  }

  async generateCompassRatings(teamData, historicalTrends) {
    const prompt = `Generate comprehensive COMPASS ratings and projections based on the following team data:

    TEAM DATA: ${JSON.stringify(teamData, null, 2)}
    
    HISTORICAL TRENDS: ${JSON.stringify(historicalTrends, null, 2)}
    
    COMPASS METHODOLOGY:
    - Competitive Performance (35%): On-court results, tournament success, championships
    - Operational Excellence (25%): Coaching quality, stability, player development
    - Market Position (20%): Recruiting, NIL, brand strength, facilities
    - Performance Trajectory (15%): Momentum, improvement trends, outlook
    - Analytics (5%): Data-driven metrics, efficiency ratings
    
    REQUIRED OUTPUT:
    1. Historical COMPASS Ratings (2020-2025):
       - Calculate year-by-year ratings with justification
       - Show trend progression and inflection points
       - Identify peak and valley periods
    
    2. Current COMPASS Rating (2024-25):
       - Detailed breakdown by category
       - Scoring rationale with specific evidence
       - Confidence level assessment
    
    3. Projected COMPASS Ratings (2025-26, 2026-27):
       - Best case, expected, worst case scenarios
       - Key factors driving projections
       - Probability assessments for each scenario
    
    4. Trend Analysis:
       - 5-year trajectory slope and acceleration
       - Correlation factors and leading indicators
       - Sustainability assessment of current trends
    
    5. Visualization Data:
       - Year-by-year rating progression
       - Category breakdown comparisons
       - Projection confidence intervals
       - Peer group positioning
    
    Provide specific numerical ratings (0-100) with decimal precision and detailed analytical justification.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-latest',
        ratingType: 'COMPASS Historical and Projected',
        teamData: teamData
      };
    } catch (error) {
      console.error('Gemini COMPASS Rating Error:', error);
      throw new Error(`Gemini COMPASS analysis failed: ${error.message}`);
    }
  }

  async generateFootballCompassRatings(teamData, historicalTrends) {
    const prompt = `Generate comprehensive COMPASS ratings and projections for FOOTBALL program based on the following team data:

    TEAM DATA: ${JSON.stringify(teamData, null, 2)}
    
    HISTORICAL TRENDS: ${JSON.stringify(historicalTrends, null, 2)}
    
    FOOTBALL-SPECIFIC COMPASS METHODOLOGY:
    - Competitive Performance (35%): Conference records, bowl/playoff performance, championship success
    - Operational Excellence (25%): Coaching quality, player development, program management
    - Market Position (20%): Recruiting success, NIL program, facilities, brand strength/tradition
    - Performance Trajectory (15%): Program momentum, ranking trends, competitive outlook
    - Analytics (5%): Win percentages, recruiting rankings, transfer portal success
    
    FOOTBALL-SPECIFIC CONSIDERATIONS:
    - Bowl game and College Football Playoff performance
    - NFL Draft success and player development
    - Recruiting class rankings and portal management
    - Conference competitiveness and strength of schedule
    - Stadium capacity, attendance, and fan support
    - Revenue generation and program investment
    
    REQUIRED OUTPUT:
    1. Historical COMPASS Ratings (2020-2024):
       - Calculate year-by-year ratings with football-specific justification
       - Show trend progression including coaching changes impact
       - Identify breakthrough seasons and championship years
    
    2. Current COMPASS Rating (2024):
       - Detailed breakdown by category with football metrics
       - Scoring rationale with specific evidence (wins, bowl results, rankings)
       - Confidence level assessment
    
    3. Projected COMPASS Ratings (2025-26, 2026-27):
       - Best case, expected, worst case scenarios
       - Key factors: recruiting, returning starters, coaching stability
       - College Football Playoff probability assessments
    
    4. Football Trend Analysis:
       - 5-year trajectory slope and acceleration
       - Recruiting vs on-field success correlation
       - Sustainability assessment of current trends
       - Comparison to elite Big 12 and national programs
    
    5. Visualization Data:
       - Year-by-year rating progression
       - Category breakdown comparisons
       - Projection confidence intervals
       - Big 12 football competitive positioning
    
    Focus on championship potential and program trajectory. Provide specific numerical ratings (0-100) with decimal precision and detailed analytical justification for football program assessment.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-latest',
        ratingType: 'COMPASS Historical and Projected - Football',
        teamData: teamData
      };
    } catch (error) {
      console.error('Gemini Football COMPASS Rating Error:', error);
      throw new Error(`Gemini Football COMPASS analysis failed: ${error.message}`);
    }
  }

  // Enhanced Sport-Specific COMPASS Ratings
  async generateEnhancedSoftballCompassRatings(teamData, historicalTrends) {
    const prompt = `Generate comprehensive COMPASS ratings and projections for SOFTBALL program based on the following team data with ENHANCED Summer 2025 Transfer Portal and Recruiting Focus:

    TEAM DATA: ${JSON.stringify(teamData, null, 2)}
    
    HISTORICAL TRENDS: ${JSON.stringify(historicalTrends, null, 2)}
    
    SOFTBALL-SPECIFIC ENHANCED COMPASS METHODOLOGY:
    - Competitive Performance (35%): Conference records, NCAA Tournament/Regional performance, WCWS appearances
    - Operational Excellence (25%): Coaching quality, player development, pitching/hitting programs
    - Market Position (20%): Recruiting success, NIL program, facilities, brand strength
    - Performance Trajectory (15%): Program momentum, transfer portal success, 2025-26 outlook
    - Analytics (5%): RPI, strength of schedule, advanced metrics
    
    ENHANCED 2025-26 FOCUS CONSIDERATIONS WITH RANKINGS:
    - Summer 2025 transfer portal class ranking and impact on roster construction
    - Current recruiting class rankings (national, Big 12) and 2026 momentum
    - Transfer portal rankings vs traditional recruiting class balance
    - Pitching staff development and depth with transfer/recruit rankings
    - Conference competitiveness and WCWS contention with ranking analysis
    - NIL program effectiveness in retaining/acquiring ranked players
    
    Provide specific numerical ratings (0-100) with decimal precision and detailed analytical justification incorporating current transfer portal rankings, recruiting class rankings, and competitive developments.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-latest',
        ratingType: 'Enhanced COMPASS Historical and Projected - Softball',
        teamData: teamData
      };
    } catch (error) {
      console.error('Gemini Enhanced Softball COMPASS Rating Error:', error);
      throw new Error(`Gemini Enhanced Softball COMPASS analysis failed: ${error.message}`);
    }
  }

  async generateEnhancedVolleyballCompassRatings(teamData, historicalTrends) {
    const prompt = `Generate comprehensive COMPASS ratings and projections for VOLLEYBALL program based on the following team data with ENHANCED Summer 2025 Transfer Portal and Recruiting Focus:

    TEAM DATA: ${JSON.stringify(teamData, null, 2)}
    
    HISTORICAL TRENDS: ${JSON.stringify(historicalTrends, null, 2)}
    
    VOLLEYBALL-SPECIFIC ENHANCED COMPASS METHODOLOGY:
    - Competitive Performance (35%): Conference records, NCAA Tournament performance, Final Four appearances
    - Operational Excellence (25%): Coaching quality, player development, system implementation
    - Market Position (20%): Recruiting success, NIL program, facilities, program prestige
    - Performance Trajectory (15%): Program momentum, transfer portal success, 2025-26 outlook
    - Analytics (5%): Set records, efficiency ratings, advanced volleyball metrics
    
    ENHANCED 2025-26 FOCUS CONSIDERATIONS WITH RANKINGS:
    - Summer 2025 transfer portal class ranking and impact on lineup construction
    - Current recruiting class rankings (national, Big 12) and international pipeline
    - Transfer portal rankings vs traditional recruiting class balance  
    - Setter situation and offensive system development with transfer/recruit rankings
    - Conference competitiveness and Final Four contention with ranking analysis
    - Position group depth and rotation effectiveness with player rankings
    
    Provide specific numerical ratings (0-100) with decimal precision and detailed analytical justification incorporating current transfer portal rankings, recruiting class rankings, and competitive developments.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-latest',
        ratingType: 'Enhanced COMPASS Historical and Projected - Volleyball',
        teamData: teamData
      };
    } catch (error) {
      console.error('Gemini Enhanced Volleyball COMPASS Rating Error:', error);
      throw new Error(`Gemini Enhanced Volleyball COMPASS analysis failed: ${error.message}`);
    }
  }

  async generateEnhancedSoccerCompassRatings(teamData, historicalTrends) {
    const prompt = `Generate comprehensive COMPASS ratings and projections for SOCCER program based on the following team data with ENHANCED Summer 2025 Transfer Portal and Recruiting Focus:

    TEAM DATA: ${JSON.stringify(teamData, null, 2)}
    
    HISTORICAL TRENDS: ${JSON.stringify(historicalTrends, null, 2)}
    
    SOCCER-SPECIFIC ENHANCED COMPASS METHODOLOGY:
    - Competitive Performance (35%): Conference records, NCAA Tournament performance, College Cup appearances
    - Operational Excellence (25%): Coaching quality, tactical development, player development
    - Market Position (20%): Recruiting success, NIL program, facilities, international pipeline
    - Performance Trajectory (15%): Program momentum, transfer portal success, 2025-26 outlook
    - Analytics (5%): Goal differential, possession metrics, advanced soccer analytics
    
    ENHANCED 2025-26 FOCUS CONSIDERATIONS WITH RANKINGS:
    - Summer 2025 transfer portal class ranking and impact on tactical setup
    - Current recruiting class rankings (national, Big 12) and international player acquisition
    - Transfer portal rankings vs traditional recruiting class balance
    - Formation and tactical system development with transfer/recruit rankings
    - Conference competitiveness and College Cup contention with ranking analysis
    - Goalkeeper situation and defensive/offensive balance with player rankings
    
    Provide specific numerical ratings (0-100) with decimal precision and detailed analytical justification incorporating current transfer portal rankings, recruiting class rankings, and competitive developments.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-latest',
        ratingType: 'Enhanced COMPASS Historical and Projected - Soccer',
        teamData: teamData
      };
    } catch (error) {
      console.error('Gemini Enhanced Soccer COMPASS Rating Error:', error);
      throw new Error(`Gemini Enhanced Soccer COMPASS analysis failed: ${error.message}`);
    }
  }

  async generateEnhancedTennisCompassRatings(teamData, historicalTrends) {
    const prompt = `Generate comprehensive COMPASS ratings and projections for TENNIS program based on the following team data with ENHANCED Summer 2025 Transfer Portal and Recruiting Focus:

    TEAM DATA: ${JSON.stringify(teamData, null, 2)}
    
    HISTORICAL TRENDS: ${JSON.stringify(historicalTrends, null, 2)}
    
    TENNIS-SPECIFIC ENHANCED COMPASS METHODOLOGY:
    - Competitive Performance (35%): Conference records, NCAA Tournament performance, championship success
    - Operational Excellence (25%): Coaching quality, player development, training methodology
    - Market Position (20%): Recruiting success, facilities, international pipeline, program prestige
    - Performance Trajectory (15%): Program momentum, transfer portal success, 2025-26 outlook
    - Analytics (5%): Individual rankings, match win percentages, doubles success rates
    
    ENHANCED 2025-26 FOCUS CONSIDERATIONS WITH RANKINGS:
    - Summer 2025 transfer portal class ranking and impact on lineup depth (1-6 singles)
    - Current recruiting class rankings and international player development
    - Individual player rankings and improvement trajectories
    - Doubles partnerships and team chemistry with transfer/recruit rankings
    - Conference competitiveness and national championship potential with ranking analysis
    
    Provide specific numerical ratings (0-100) with decimal precision and detailed analytical justification incorporating current transfer portal rankings, recruiting class rankings, and competitive developments.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-latest',
        ratingType: 'Enhanced COMPASS Historical and Projected - Tennis',
        teamData: teamData
      };
    } catch (error) {
      console.error('Gemini Enhanced Tennis COMPASS Rating Error:', error);
      throw new Error(`Gemini Enhanced Tennis COMPASS analysis failed: ${error.message}`);
    }
  }

  async generateEnhancedGymnasticsCompassRatings(teamData, historicalTrends) {
    const prompt = `Generate comprehensive COMPASS ratings and projections for GYMNASTICS program based on the following team data with ENHANCED Summer 2025 Transfer Portal and Recruiting Focus:

    TEAM DATA: ${JSON.stringify(teamData, null, 2)}
    
    HISTORICAL TRENDS: ${JSON.stringify(historicalTrends, null, 2)}
    
    GYMNASTICS-SPECIFIC ENHANCED COMPASS METHODOLOGY:
    - Competitive Performance (35%): Conference records, NCAA Regional/Championship performance
    - Operational Excellence (25%): Coaching quality, technical development, injury prevention
    - Market Position (20%): Recruiting success, facilities, elite level pipeline
    - Performance Trajectory (15%): Program momentum, transfer portal success, 2025-26 outlook
    - Analytics (5%): Scoring averages, consistency metrics, individual event strength
    
    ENHANCED 2025-26 FOCUS CONSIDERATIONS WITH RANKINGS:
    - Summer 2025 transfer portal class ranking and impact on event lineups
    - Current recruiting class rankings and elite level additions
    - Event lineup construction (6 up, 5 count) and scoring potential with transfer/recruit rankings
    - All-around competition depth and development with player rankings
    - Conference competitiveness and national championship contention with ranking analysis
    
    Provide specific numerical ratings (0-100) with decimal precision and detailed analytical justification incorporating current transfer portal rankings, recruiting class rankings, and competitive developments.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-latest',
        ratingType: 'Enhanced COMPASS Historical and Projected - Gymnastics',
        teamData: teamData
      };
    } catch (error) {
      console.error('Gemini Enhanced Gymnastics COMPASS Rating Error:', error);
      throw new Error(`Gemini Enhanced Gymnastics COMPASS analysis failed: ${error.message}`);
    }
  }

  async generateEnhancedWomensBasketballCompassRatings(teamData, historicalTrends) {
    const prompt = `Generate comprehensive COMPASS ratings and projections for WOMEN'S BASKETBALL program based on the following team data with ENHANCED Summer 2025 Transfer Portal and Recruiting Focus:

    TEAM DATA: ${JSON.stringify(teamData, null, 2)}
    
    HISTORICAL TRENDS: ${JSON.stringify(historicalTrends, null, 2)}
    
    WOMEN'S BASKETBALL-SPECIFIC ENHANCED COMPASS METHODOLOGY:
    - Competitive Performance (35%): Conference records, NCAA Tournament performance, March Madness success
    - Operational Excellence (25%): Coaching quality, player development, system implementation
    - Market Position (20%): Recruiting success, NIL program, facilities, program prestige
    - Performance Trajectory (15%): Program momentum, transfer portal success, 2025-26 outlook
    - Analytics (5%): Efficiency ratings, advanced metrics, recruiting rankings
    
    ENHANCED 2025-26 FOCUS CONSIDERATIONS WITH RANKINGS:
    - Summer 2025 transfer portal class ranking and impact on roster construction
    - Current recruiting class rankings and 2026 momentum
    - Position group balance and frontcourt/backcourt depth with transfer/recruit rankings
    - Conference competitiveness and March Madness potential with ranking analysis
    - NIL program effectiveness in women's basketball recruitment with player rankings
    
    Provide specific numerical ratings (0-100) with decimal precision and detailed analytical justification incorporating current transfer portal rankings, recruiting class rankings, and competitive developments.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-latest',
        ratingType: 'Enhanced COMPASS Historical and Projected - Women\'s Basketball',
        teamData: teamData
      };
    } catch (error) {
      console.error('Gemini Enhanced Women\'s Basketball COMPASS Rating Error:', error);
      throw new Error(`Gemini Enhanced Women\'s Basketball COMPASS analysis failed: ${error.message}`);
    }
  }

  async generateEnhancedLacrosseCompassRatings(teamData, historicalTrends) {
    const prompt = `Generate comprehensive COMPASS ratings and projections for LACROSSE program based on the following team data with ENHANCED Summer 2025 Transfer Portal and Recruiting Focus:

    TEAM DATA: ${JSON.stringify(teamData, null, 2)}
    
    HISTORICAL TRENDS: ${JSON.stringify(historicalTrends, null, 2)}
    
    LACROSSE-SPECIFIC ENHANCED COMPASS METHODOLOGY:
    - Competitive Performance (35%): Conference records, NCAA Tournament performance, championship success
    - Operational Excellence (25%): Coaching quality, tactical development, player development
    - Market Position (20%): Recruiting success, facilities, regional pipeline, program growth
    - Performance Trajectory (15%): Program momentum, transfer portal success, 2025-26 outlook
    - Analytics (5%): Goal differential, possession metrics, face-off success rates
    
    ENHANCED 2025-26 FOCUS CONSIDERATIONS WITH RANKINGS:
    - Summer 2025 transfer portal class ranking and impact on position group construction
    - Current recruiting class rankings and regional expansion success
    - Offensive/defensive unit development and chemistry with transfer/recruit rankings
    - Conference competitiveness and championship contention with ranking analysis
    - Goaltending situation and face-off specialist development with player rankings
    
    Provide specific numerical ratings (0-100) with decimal precision and detailed analytical justification incorporating current transfer portal rankings, recruiting class rankings, and competitive developments.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-latest',
        ratingType: 'Enhanced COMPASS Historical and Projected - Lacrosse',
        teamData: teamData
      };
    } catch (error) {
      console.error('Gemini Enhanced Lacrosse COMPASS Rating Error:', error);
      throw new Error(`Gemini Enhanced Lacrosse COMPASS analysis failed: ${error.message}`);
    }
  }

  async generateWrestlingCompassRatings(teamData, historicalTrends) {
    const prompt = `Generate comprehensive COMPASS ratings and projections for WRESTLING program based on the following team data:

    TEAM DATA: ${JSON.stringify(teamData, null, 2)}
    
    HISTORICAL TRENDS: ${JSON.stringify(historicalTrends, null, 2)}
    
    WRESTLING-SPECIFIC COMPASS METHODOLOGY:
    - Competitive Performance (35%): Dual meet records, NCAA Tournament team performance, individual champions
    - Operational Excellence (25%): Coaching quality, wrestler development, training methodology
    - Market Position (20%): Recruiting success, NIL program, facilities, wrestling culture/tradition
    - Performance Trajectory (15%): Program momentum, ranking trends, postseason outlook
    - Analytics (5%): Win percentages, All-American production, recruiting rankings
    
    WRESTLING-SPECIFIC CONSIDERATIONS:
    - Individual vs team success balance
    - Weight class depth and coverage
    - NCAA All-American and champion production
    - Transfer portal impact on roster construction
    - Regional wrestling culture and fan support
    
    REQUIRED OUTPUT:
    1. Historical COMPASS Ratings (2020-2025):
       - Calculate year-by-year ratings with wrestling-specific justification
       - Show trend progression including coaching changes impact
       - Identify breakthrough seasons and championship years
    
    2. Current COMPASS Rating (2024-25):
       - Detailed breakdown by category with wrestling metrics
       - Scoring rationale with specific evidence (dual records, All-Americans)
       - Confidence level assessment
    
    3. Projected COMPASS Ratings (2025-26, 2026-27):
       - Best case, expected, worst case scenarios
       - Key factors: recruiting, returning All-Americans, coaching stability
       - Probability assessments for each scenario
    
    4. Wrestling Trend Analysis:
       - 5-year trajectory slope and acceleration
       - Individual vs team success correlation
       - Sustainability assessment of current trends
       - Comparison to elite wrestling programs nationally
    
    5. Visualization Data:
       - Year-by-year rating progression
       - Category breakdown comparisons
       - Projection confidence intervals
       - National wrestling ranking positioning
    
    Focus on individual achievement within team context. Provide specific numerical ratings (0-100) with decimal precision and detailed analytical justification for wrestling program assessment.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-latest',
        ratingType: 'COMPASS Historical and Projected - Wrestling',
        teamData: teamData
      };
    } catch (error) {
      console.error('Gemini Wrestling COMPASS Rating Error:', error);
      throw new Error(`Gemini Wrestling COMPASS analysis failed: ${error.message}`);
    }
  }

  async generateBaseballCompassRatings(teamData, historicalTrends) {
    const prompt = `Generate comprehensive COMPASS ratings and projections for BASEBALL program based on the following team data:

    TEAM DATA: ${JSON.stringify(teamData, null, 2)}
    
    HISTORICAL TRENDS: ${JSON.stringify(historicalTrends, null, 2)}
    
    BASEBALL-SPECIFIC COMPASS METHODOLOGY:
    - Competitive Performance (35%): Conference records, NCAA Tournament/Regional performance, championship success
    - Operational Excellence (25%): Coaching quality, player development, pitching/hitting programs
    - Market Position (20%): Recruiting success, NIL program, facilities (stadium, training), brand strength
    - Performance Trajectory (15%): Program momentum, improvement trends, postseason outlook
    - Analytics (5%): Sabermetrics, RPI, strength of schedule, efficiency ratings
    
    BASEBALL-SPECIFIC CONSIDERATIONS:
    - Pitching staff depth and development
    - NCAA Regional and Super Regional hosting capability
    - MLB Draft success and player development
    - Weather/geographic advantages for practice and play
    - Conference competitiveness in Big 12 baseball
    
    REQUIRED OUTPUT:
    1. Historical COMPASS Ratings (2020-2025):
       - Calculate year-by-year ratings with baseball-specific justification
       - Show trend progression including coaching changes impact
       - Identify breakthrough seasons and setbacks
    
    2. Current COMPASS Rating (2024-25):
       - Detailed breakdown by category with baseball metrics
       - Scoring rationale with specific evidence (wins, ERA, postseason)
       - Confidence level assessment
    
    3. Projected COMPASS Ratings (2025-26, 2026-27):
       - Best case, expected, worst case scenarios
       - Key factors: recruiting, pitching staff, facility investments
       - Probability assessments for each scenario
    
    4. Baseball Trend Analysis:
       - 5-year trajectory slope and acceleration
       - Recruiting class impact on program trajectory
       - Sustainability assessment of current trends
       - Comparison to elite Big 12 baseball programs
    
    5. Visualization Data:
       - Year-by-year rating progression
       - Category breakdown comparisons
       - Projection confidence intervals
       - Big 12 baseball peer group positioning
    
    Focus on 2025-26 preparation while considering ongoing 2024-25 postseason context. Provide specific numerical ratings (0-100) with decimal precision and detailed analytical justification for baseball program assessment.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-latest',
        ratingType: 'COMPASS Historical and Projected - Baseball',
        teamData: teamData
      };
    } catch (error) {
      console.error('Gemini Baseball COMPASS Rating Error:', error);
      throw new Error(`Gemini Baseball COMPASS analysis failed: ${error.message}`);
    }
  }

  async generateVisualizationData(analysisResults, chartTypes = ['line', 'bar', 'radar']) {
    const prompt = `Generate comprehensive visualization data structures for sports analytics dashboards:

    ANALYSIS RESULTS: ${JSON.stringify(analysisResults, null, 2)}
    
    REQUIRED VISUALIZATIONS:
    ${chartTypes.map(type => `- ${type.toUpperCase()} charts`).join('\n    ')}
    
    VISUALIZATION REQUIREMENTS:
    1. Historical Trend Lines (2020-2025):
       - COMPASS ratings progression
       - Win percentage trends
       - Conference standing changes
       - Recruiting ranking evolution
    
    2. Comparative Bar Charts:
       - COMPASS category breakdowns
       - Peer group comparisons
       - Conference ranking positions
       - Performance metrics distribution
    
    3. Projection Cone Charts (2025-2027):
       - Future COMPASS rating scenarios
       - Confidence interval visualization
       - Risk factor impact modeling
       - Trajectory projections
    
    4. Radar/Spider Charts:
       - Multi-dimensional performance profiles
       - Strength/weakness visualization
       - Competitive positioning maps
       - Program characteristic profiles
    
    OUTPUT FORMAT:
    Return structured JSON data ready for chart.js, D3.js, or similar visualization libraries:
    
    {
      "charts": {
        "historicalTrends": {
          "type": "line",
          "data": {...},
          "options": {...}
        },
        "compassBreakdown": {
          "type": "radar",
          "data": {...},
          "options": {...}
        },
        "projections": {
          "type": "line",
          "data": {...},
          "options": {...}
        }
      },
      "metadata": {
        "timeframe": "...",
        "confidence": "...",
        "lastUpdated": "..."
      }
    }
    
    Include proper axis labels, color schemes, tooltips, and responsive design considerations.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-latest',
        visualizationType: 'Comprehensive Dashboard Data',
        chartTypes: chartTypes
      };
    } catch (error) {
      console.error('Gemini Visualization Error:', error);
      throw new Error(`Gemini visualization generation failed: ${error.message}`);
    }
  }

  // CONSOLIDATED UNIFIED SPORT COMPASS RATING METHOD FOR 2025-26 SEASONS
  async generateUnifiedSportCompassRatings(teamData, historicalTrends, sport, gender = null) {
    const sportConfig = this.getSportCompassConfiguration(sport, gender);
    
    const prompt = `Generate comprehensive COMPASS ratings and projections for ${sportConfig.fullName.toUpperCase()} program based on the following team data with UNIFIED SPORT-SPECIFIC METHODOLOGY:

    TEAM DATA: ${JSON.stringify(teamData, null, 2)}
    
    HISTORICAL TRENDS: ${JSON.stringify(historicalTrends, null, 2)}
    
    🧭 UNIFIED ${sport.toUpperCase()} COMPASS METHODOLOGY WITH RANKINGS:
    - Competitive Performance (35%): ${sportConfig.competitiveMetrics}
    - Operational Excellence (25%): ${sportConfig.operationalMetrics}  
    - Market Position (20%): ${sportConfig.marketMetrics}
    - Performance Trajectory (15%): ${sportConfig.trajectoryMetrics}
    - Analytics (5%): ${sportConfig.analyticsMetrics}
    
    ENHANCED 2025-26 FOCUS CONSIDERATIONS WITH RANKINGS:
    - Summer 2025 transfer portal class ranking and impact on ${sportConfig.rosterImpact}
    - Current recruiting class rankings (national, ${sportConfig.conferenceContext}) and 2026 momentum
    - Transfer portal rankings vs traditional recruiting class balance analysis
    - ${sportConfig.tacticalElements} with transfer/recruit rankings integration
    - Conference competitiveness and ${sportConfig.championshipTargets} with ranking analysis
    - NIL program effectiveness in retaining/acquiring ranked players for ${sport}
    
    REQUIRED OUTPUT:
    1. Historical COMPASS Ratings (2020-2025):
       - Calculate year-by-year ratings with ${sport}-specific justification
       - Show trend progression including coaching changes impact
       - Identify breakthrough seasons and ${sportConfig.keyMilestones}
    
    2. Current COMPASS Rating (2024-25):
       - Detailed breakdown by category with ${sport} metrics
       - Scoring rationale with specific evidence (${sportConfig.evidenceTypes})
       - Confidence level assessment
    
    3. Projected COMPASS Ratings (2025-26, 2026-27):
       - Best case, expected, worst case scenarios
       - Key factors: recruiting rankings, transfer portal success, coaching stability
       - ${sportConfig.championshipTargets} probability assessments
    
    4. ${sport.charAt(0).toUpperCase() + sport.slice(1)} Trend Analysis:
       - 5-year trajectory slope and acceleration
       - Recruiting vs portal success correlation with ranking analysis
       - Sustainability assessment of current trends
       - Comparison to elite ${sportConfig.competitionLevel} programs
    
    5. Visualization Data:
       - Year-by-year rating progression
       - Category breakdown comparisons
       - Projection confidence intervals
       - ${sportConfig.competitionLevel} competitive positioning
    
    Focus on ${sportConfig.seasonFocus} potential and program trajectory. Provide specific numerical ratings (0-100) with decimal precision and detailed analytical justification incorporating current transfer portal rankings, recruiting class rankings, and competitive developments.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro-latest',
        ratingType: `Unified COMPASS Historical and Projected - ${sportConfig.fullName}`,
        teamData: teamData,
        sport: sport,
        gender: gender
      };
    } catch (error) {
      console.error(`Gemini Unified ${sport} COMPASS Rating Error:`, error);
      throw new Error(`Gemini Unified ${sport} COMPASS analysis failed: ${error.message}`);
    }
  }

  // Sport configuration method for unified COMPASS ratings
  getSportCompassConfiguration(sport, gender = null) {
    const configs = {
      'football': {
        fullName: 'Football',
        conferenceContext: 'Big 12',
        competitiveMetrics: 'Conference records, bowl/playoff performance, championship success',
        operationalMetrics: 'Coaching quality, player development, program management',
        marketMetrics: 'Recruiting success, NIL program, facilities, brand strength/tradition',
        trajectoryMetrics: 'Program momentum, ranking trends, competitive outlook',
        analyticsMetrics: 'Win percentages, recruiting rankings, transfer portal success',
        rosterImpact: 'roster construction and depth',
        tacticalElements: 'Offensive/defensive line development and quarterback situation',
        championshipTargets: 'Bowl game and College Football Playoff contention',
        keyMilestones: 'championship years and bowl victories',
        evidenceTypes: 'wins, bowl results, rankings',
        competitionLevel: 'Big 12 and national football',
        seasonFocus: 'championship'
      },
      'basketball': {
        fullName: `${gender === 'womens' ? "Women's" : "Men's"} Basketball`,
        conferenceContext: 'Big 12',
        competitiveMetrics: 'Conference records, NCAA Tournament/March Madness performance',
        operationalMetrics: 'Coaching quality, player development, system implementation',
        marketMetrics: 'Recruiting success, NIL program, facilities, program prestige',
        trajectoryMetrics: 'Program momentum, transfer portal success, tournament outlook',
        analyticsMetrics: 'Efficiency ratings, advanced metrics, recruiting rankings',
        rosterImpact: 'roster construction and depth',
        tacticalElements: 'Frontcourt/backcourt balance and starting lineup construction',
        championshipTargets: `Big 12 Championship and ${gender === 'womens' ? 'March Madness' : 'NCAA Tournament'} advancement`,
        keyMilestones: 'tournament breakthroughs and conference championships',
        evidenceTypes: 'wins, tournament results, rankings',
        competitionLevel: 'Big 12 basketball',
        seasonFocus: 'tournament advancement'
      },
      'volleyball': {
        fullName: 'Volleyball',
        conferenceContext: 'Big 12',
        competitiveMetrics: 'Conference records, NCAA Tournament performance, Final Four appearances',
        operationalMetrics: 'Coaching quality, player development, system implementation',
        marketMetrics: 'Recruiting success, NIL program, facilities, program prestige',
        trajectoryMetrics: 'Program momentum, transfer portal success, tournament outlook',
        analyticsMetrics: 'Set records, efficiency ratings, advanced volleyball metrics',
        rosterImpact: 'lineup construction and rotation depth',
        tacticalElements: 'Setter situation and offensive system development',
        championshipTargets: 'Big 12 Championship and Final Four contention',
        keyMilestones: 'Final Four appearances and conference championships',
        evidenceTypes: 'match wins, tournament advancement, set statistics',
        competitionLevel: 'Big 12 volleyball',
        seasonFocus: 'Final Four advancement'
      },
      'soccer': {
        fullName: 'Soccer',
        conferenceContext: 'Big 12',
        competitiveMetrics: 'Conference records, NCAA Tournament performance, College Cup appearances',
        operationalMetrics: 'Coaching quality, tactical development, player development',
        marketMetrics: 'Recruiting success, NIL program, facilities, international pipeline',
        trajectoryMetrics: 'Program momentum, transfer portal success, tournament outlook',
        analyticsMetrics: 'Goal differential, possession metrics, advanced soccer analytics',
        rosterImpact: 'tactical setup and formation',
        tacticalElements: 'Formation and tactical system development',
        championshipTargets: 'Big 12 Championship and College Cup contention',
        keyMilestones: 'College Cup appearances and conference championships',
        evidenceTypes: 'match wins, goals, tournament results',
        competitionLevel: 'Big 12 soccer',
        seasonFocus: 'College Cup advancement'
      },
      'tennis': {
        fullName: `${gender === 'womens' ? "Women's" : "Men's"} Tennis`,
        conferenceContext: gender === 'mens' ? 'Big 12 (9 teams)' : 'Big 12 (16 teams)',
        competitiveMetrics: 'Conference records, NCAA Tournament performance, championship success',
        operationalMetrics: 'Coaching quality, player development, training methodology',
        marketMetrics: 'Recruiting success, facilities, international pipeline, program prestige',
        trajectoryMetrics: 'Program momentum, transfer portal success, tournament outlook',
        analyticsMetrics: 'Individual rankings, match win percentages, doubles success rates',
        rosterImpact: 'lineup depth and individual rankings',
        tacticalElements: 'Singles/doubles lineup construction and partnership development',
        championshipTargets: 'Big 12 Championship and NCAA Championship contention',
        keyMilestones: 'NCAA Championship appearances and individual titles',
        evidenceTypes: 'match wins, individual rankings, tournament results',
        competitionLevel: `${gender === 'mens' ? "men's" : "women's"} tennis`,
        seasonFocus: 'championship contention'
      },
      'gymnastics': {
        fullName: 'Gymnastics',
        conferenceContext: 'Big 12 (7 teams)',
        competitiveMetrics: 'Conference records, NCAA Regional/Championship performance',
        operationalMetrics: 'Coaching quality, technical development, injury prevention',
        marketMetrics: 'Recruiting success, facilities, elite level pipeline',
        trajectoryMetrics: 'Program momentum, transfer portal success, championship outlook',
        analyticsMetrics: 'Scoring averages, consistency metrics, individual event strength',
        rosterImpact: 'event lineups and scoring potential',
        tacticalElements: 'Event lineup construction and all-around competition depth',
        championshipTargets: 'NCAA Regional hosting and Championship advancement',
        keyMilestones: 'NCAA Championship appearances and individual titles',
        evidenceTypes: 'meet scores, individual event titles, team rankings',
        competitionLevel: 'NCAA gymnastics',
        seasonFocus: 'championship advancement'
      },
      'wrestling': {
        fullName: 'Wrestling',
        conferenceContext: 'Big 12 Wrestling (14 teams)',
        competitiveMetrics: 'Dual meet records, NCAA Tournament team performance, individual champions',
        operationalMetrics: 'Coaching quality, wrestler development, training methodology',
        marketMetrics: 'Recruiting success, NIL program, facilities, wrestling culture/tradition',
        trajectoryMetrics: 'Program momentum, ranking trends, postseason outlook',
        analyticsMetrics: 'Win percentages, All-American production, recruiting rankings',
        rosterImpact: 'weight class depth and coverage',
        tacticalElements: 'Weight class construction and dual meet lineup optimization',
        championshipTargets: 'Conference championships and NCAA team/individual titles',
        keyMilestones: 'NCAA team titles and All-American production',
        evidenceTypes: 'dual records, All-Americans, individual champions',
        competitionLevel: 'NCAA wrestling',
        seasonFocus: 'individual and team championship'
      },
      'softball': {
        fullName: 'Softball',
        conferenceContext: 'Big 12',
        competitiveMetrics: 'Conference records, NCAA Tournament/Regional performance, WCWS appearances',
        operationalMetrics: 'Coaching quality, player development, pitching/hitting programs',
        marketMetrics: 'Recruiting success, NIL program, facilities, brand strength',
        trajectoryMetrics: 'Program momentum, transfer portal success, tournament outlook',
        analyticsMetrics: 'RPI, strength of schedule, advanced metrics',
        rosterImpact: 'roster construction and pitching depth',
        tacticalElements: 'Pitching staff development and offensive lineup construction',
        championshipTargets: 'Big 12 Championship and WCWS contention',
        keyMilestones: 'WCWS appearances and conference championships',
        evidenceTypes: 'wins, ERA, tournament advancement',
        competitionLevel: 'Big 12 softball',
        seasonFocus: 'WCWS advancement'
      },
      'lacrosse': {
        fullName: 'Lacrosse',
        conferenceContext: 'Big 12 Lacrosse',
        competitiveMetrics: 'Conference records, NCAA Tournament performance, championship success',
        operationalMetrics: 'Coaching quality, tactical development, player development',
        marketMetrics: 'Recruiting success, facilities, regional pipeline, program growth',
        trajectoryMetrics: 'Program momentum, transfer portal success, tournament outlook',
        analyticsMetrics: 'Goal differential, possession metrics, face-off success rates',
        rosterImpact: 'position group construction and team chemistry',
        tacticalElements: 'Position group development and offensive/defensive unit chemistry',
        championshipTargets: 'Conference championship and NCAA Tournament success',
        keyMilestones: 'NCAA Tournament appearances and conference championships',
        evidenceTypes: 'game wins, goal statistics, tournament results',
        competitionLevel: 'NCAA lacrosse',
        seasonFocus: 'tournament advancement'
      },
      'baseball': {
        fullName: 'Baseball',
        conferenceContext: 'Big 12',
        competitiveMetrics: 'Conference records, NCAA Tournament/Regional performance, College World Series appearances',
        operationalMetrics: 'Coaching quality, player development, pitching/hitting programs',
        marketMetrics: 'Recruiting success, NIL program, facilities, brand strength',
        trajectoryMetrics: 'Program momentum, transfer portal success, tournament outlook',
        analyticsMetrics: 'RPI, strength of schedule, sabermetrics, efficiency ratings',
        rosterImpact: 'roster construction and pitching depth',
        tacticalElements: 'Pitching staff development and offensive lineup construction',
        championshipTargets: 'Big 12 Championship and College World Series contention',
        keyMilestones: 'CWS appearances and conference championships',
        evidenceTypes: 'wins, ERA, tournament advancement, MLB Draft success',
        competitionLevel: 'Big 12 baseball',
        seasonFocus: 'CWS advancement'
      }
    };

    return configs[sport.toLowerCase()] || configs['football']; // Default fallback
  }

  async parallelAnalysis(dataArray, analysisTypes) {
    const promises = dataArray.map((data, index) => 
      this.analyzeSportsData(data, analysisTypes[index] || 'Comprehensive Analysis')
    );

    try {
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Parallel analysis error:', error);
      throw error;
    }
  }
}

module.exports = GeminiResearchService;