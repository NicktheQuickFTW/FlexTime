/**
 * Comprehensive Research Processor
 * 
 * Processes research agent outputs and extracts detailed data for storage in
 * the enhanced HELiiX database schema including transfer portal, recruiting,
 * coaching changes, NIL tracking, and facility investments.
 */

const { Sequelize } = require('sequelize');

class ComprehensiveResearchProcessor {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.stats = {
      teamsProcessed: 0,
      transfersExtracted: 0,
      coachingChangesExtracted: 0,
      facilityInvestmentsExtracted: 0,
      nilDataExtracted: 0,
      externalSourcesTracked: 0,
      errors: []
    };
  }

  /**
   * Process comprehensive research data for a team
   */
  async processTeamResearchData(teamData, researchContent, season = '2024-25') {
    console.log(`🔄 Processing comprehensive research for ${teamData.teamName} ${teamData.sport}`);
    
    try {
      // Extract and store different types of research data
      await this.extractAndStoreTransferPortalData(teamData, researchContent, season);
      await this.extractAndStoreCoachingChanges(teamData, researchContent, season);
      await this.extractAndStoreFacilityInvestments(teamData, researchContent, season);
      await this.extractAndStoreNILData(teamData, researchContent, season);
      await this.updateComprehensiveResearchData(teamData, researchContent, season);
      await this.trackExternalSources(teamData, researchContent);
      
      this.stats.teamsProcessed++;
      console.log(`✅ Comprehensive research processed for ${teamData.teamName}`);
      
    } catch (error) {
      console.error(`❌ Error processing research for ${teamData.teamName}:`, error.message);
      this.stats.errors.push({ team: teamData.teamName, error: error.message });
    }
  }

  /**
   * Extract transfer portal activity from research content
   */
  async extractAndStoreTransferPortalData(teamData, researchContent, season) {
    try {
      const transfers = this.extractTransferPortalMentions(researchContent);
      
      for (const transfer of transfers) {
        await this.sequelize.query(`
          INSERT INTO transfer_portal_activity (
            team_id, season, player_name, transfer_type, previous_school, 
            destination_school, position, star_rating, impact_rating, 
            transfer_reason, nil_factor, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
          ON CONFLICT DO NOTHING
        `, {
          bind: [
            teamData.teamId,
            season,
            transfer.playerName,
            transfer.type,
            transfer.previousSchool,
            transfer.destinationSchool,
            transfer.position,
            transfer.starRating,
            transfer.impactRating,
            transfer.reason,
            transfer.nilFactor
          ]
        });
        
        this.stats.transfersExtracted++;
      }
      
      if (transfers.length > 0) {
        console.log(`📥 Extracted ${transfers.length} transfer portal entries`);
      }
      
    } catch (error) {
      console.error(`❌ Error extracting transfers:`, error.message);
    }
  }

  /**
   * Extract transfer portal mentions from research text
   */
  extractTransferPortalMentions(researchContent) {
    const transfers = [];
    const allText = this.combineResearchText(researchContent);
    
    // Transfer patterns
    const transferPatterns = [
      // Incoming transfers
      /(\w+\s+\w+).*?transfer.*?from\s+(\w+(?:\s+\w+)*)/gi,
      /Elite\s+transfer.*?(\w+\s+\w+).*?\((\w+(?:\s+\w+)*)\)/gi,
      /Portal\s+addition.*?(\w+\s+\w+)/gi,
      
      // Outgoing transfers  
      /(\w+\s+\w+).*?departed.*?to\s+(\w+(?:\s+\w+)*)/gi,
      /Transfer\s+out.*?(\w+\s+\w+)/gi
    ];

    for (const pattern of transferPatterns) {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const playerName = match[1]?.trim();
        const school = match[2]?.trim();
        
        if (playerName && playerName.length > 5) { // Filter out short matches
          transfers.push({
            playerName: playerName,
            type: this.determineTransferType(match[0]),
            previousSchool: this.determineTransferType(match[0]) === 'incoming' ? school : null,
            destinationSchool: this.determineTransferType(match[0]) === 'outgoing' ? school : null,
            position: this.extractPosition(match[0]),
            starRating: this.extractStarRating(match[0]),
            impactRating: this.extractImpactRating(match[0]),
            reason: this.extractTransferReason(match[0]),
            nilFactor: match[0].toLowerCase().includes('nil')
          });
        }
      }
    }
    
    return transfers;
  }

  /**
   * Extract coaching changes from research content
   */
  async extractAndStoreCoachingChanges(teamData, researchContent, season) {
    try {
      const coachingChanges = this.extractCoachingChanges(researchContent);
      
      for (const change of coachingChanges) {
        await this.sequelize.query(`
          INSERT INTO coaching_changes (
            team_id, season, coach_name, position, change_type, 
            previous_school, contract_length, hire_date, 
            impact_rating, coaching_experience, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          ON CONFLICT DO NOTHING
        `, {
          bind: [
            teamData.teamId,
            season,
            change.coachName,
            change.position,
            change.changeType,
            change.previousSchool,
            change.contractLength,
            change.hireDate,
            change.impactRating,
            change.experience
          ]
        });
        
        this.stats.coachingChangesExtracted++;
      }
      
      if (coachingChanges.length > 0) {
        console.log(`👔 Extracted ${coachingChanges.length} coaching changes`);
      }
      
    } catch (error) {
      console.error(`❌ Error extracting coaching changes:`, error.message);
    }
  }

  /**
   * Extract coaching changes from text
   */
  extractCoachingChanges(researchContent) {
    const changes = [];
    const allText = this.combineResearchText(researchContent);
    
    // Coaching change patterns
    const coachingPatterns = [
      /(?:Head\s+Coach|Coach)[\s:]*(\w+\s+\w+).*?(?:hired|appointed|named)/gi,
      /(\w+\s+\w+).*?(?:new|appointed|hired).*?(?:head\s+coach|coach)/gi,
      /(?:Coach|HC)[\s:]*(\w+\s+\w+).*?\((\d+)(?:st|nd|rd|th)?\s+season/gi
    ];

    for (const pattern of coachingPatterns) {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const coachName = match[1]?.trim();
        
        if (coachName && coachName.length > 5) {
          changes.push({
            coachName: coachName,
            position: 'head_coach',
            changeType: this.determineChangeType(match[0]),
            previousSchool: this.extractPreviousSchool(match[0]),
            contractLength: this.extractContractLength(match[0]),
            hireDate: this.extractHireDate(match[0]),
            impactRating: this.assessCoachingImpact(match[0]),
            experience: this.extractCoachingExperience(match[0])
          });
        }
      }
    }
    
    return changes;
  }

  /**
   * Extract facility investments from research content
   */
  async extractAndStoreFacilityInvestments(teamData, researchContent, season) {
    try {
      const investments = this.extractFacilityInvestments(researchContent);
      
      for (const investment of investments) {
        await this.sequelize.query(`
          INSERT INTO facility_investments (
            team_id, school_id, investment_type, investment_amount, 
            project_name, funding_source, impact_on_recruiting, 
            facility_details, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          ON CONFLICT DO NOTHING
        `, {
          bind: [
            teamData.teamId,
            teamData.schoolId,
            investment.type,
            investment.amount,
            investment.projectName,
            investment.fundingSource,
            investment.recruitingImpact,
            investment.details
          ]
        });
        
        this.stats.facilityInvestmentsExtracted++;
      }
      
      if (investments.length > 0) {
        console.log(`🏗️ Extracted ${investments.length} facility investments`);
      }
      
    } catch (error) {
      console.error(`❌ Error extracting facility investments:`, error.message);
    }
  }

  /**
   * Extract facility investments from text
   */
  extractFacilityInvestments(researchContent) {
    const investments = [];
    const allText = this.combineResearchText(researchContent);
    
    // Facility investment patterns
    const facilityPatterns = [
      /\$(\d+(?:\.\d+)?)\s*(?:million|M).*?(?:facility|stadium|center|complex)/gi,
      /(?:facility|stadium).*?\$(\d+(?:\.\d+)?)\s*(?:million|M)/gi,
      /(?:practice|training).*?facility.*?(?:upgrade|new|renovation)/gi
    ];

    for (const pattern of facilityPatterns) {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const amount = match[1] ? parseFloat(match[1]) * 1000000 : null;
        
        investments.push({
          type: this.classifyFacilityType(match[0]),
          amount: amount,
          projectName: this.extractProjectName(match[0]),
          fundingSource: this.extractFundingSource(match[0]),
          recruitingImpact: this.assessRecruitingImpact(match[0]),
          details: match[0].substring(0, 500) // First 500 chars
        });
      }
    }
    
    return investments;
  }

  /**
   * Extract NIL program data
   */
  async extractAndStoreNILData(teamData, researchContent, season) {
    try {
      const nilData = this.extractNILData(researchContent);
      
      if (nilData) {
        await this.sequelize.query(`
          INSERT INTO nil_program_tracking (
            team_id, school_id, season, nil_strength_rating, 
            major_nil_deals, market_advantages, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (team_id, season) DO UPDATE SET
            nil_strength_rating = EXCLUDED.nil_strength_rating,
            major_nil_deals = EXCLUDED.major_nil_deals,
            market_advantages = EXCLUDED.market_advantages,
            updated_at = NOW()
        `, {
          bind: [
            teamData.teamId,
            teamData.schoolId,
            season,
            nilData.strengthRating,
            nilData.majorDeals,
            nilData.marketAdvantages
          ]
        });
        
        this.stats.nilDataExtracted++;
        console.log(`💰 Extracted NIL data: ${nilData.strengthRating} rating`);
      }
      
    } catch (error) {
      console.error(`❌ Error extracting NIL data:`, error.message);
    }
  }

  /**
   * Extract NIL data from text
   */
  extractNILData(researchContent) {
    const allText = this.combineResearchText(researchContent);
    
    // NIL patterns
    const nilStrengthMatch = allText.match(/NIL.*?(?:elite|strong|average|developing|weak)/gi);
    const nilDealMatch = allText.match(/NIL.*?deal/gi);
    
    if (nilStrengthMatch || nilDealMatch) {
      return {
        strengthRating: this.classifyNILStrength(allText),
        majorDeals: nilDealMatch ? nilDealMatch.length : 0,
        marketAdvantages: this.extractNILAdvantages(allText)
      };
    }
    
    return null;
  }

  /**
   * Update comprehensive research data table
   */
  async updateComprehensiveResearchData(teamData, researchContent, season) {
    try {
      const portalRanking = this.extractPortalRanking(researchContent);
      const recruitingRanking = this.extractRecruitingRanking(researchContent);
      const coachingStability = this.assessCoachingStability(researchContent);
      
      await this.sequelize.query(`
        INSERT INTO comprehensive_research_data (
          team_id, season, summer_2025_portal_ranking, 
          summer_2025_recruiting_ranking, coaching_stability_score,
          nil_program_strength, research_source, research_confidence,
          last_research_update, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (team_id, season) DO UPDATE SET
          summer_2025_portal_ranking = EXCLUDED.summer_2025_portal_ranking,
          summer_2025_recruiting_ranking = EXCLUDED.summer_2025_recruiting_ranking,
          coaching_stability_score = EXCLUDED.coaching_stability_score,
          nil_program_strength = EXCLUDED.nil_program_strength,
          research_confidence = EXCLUDED.research_confidence,
          last_research_update = NOW(),
          updated_at = NOW()
      `, {
        bind: [
          teamData.teamId,
          season,
          portalRanking,
          recruitingRanking,
          coachingStability,
          this.classifyNILStrength(this.combineResearchText(researchContent)),
          'research_agents',
          teamData.confidence || 0.8
        ]
      });
      
      console.log(`📊 Updated comprehensive research data`);
      
    } catch (error) {
      console.error(`❌ Error updating comprehensive research:`, error.message);
    }
  }

  /**
   * Track external sources used in research
   */
  async trackExternalSources(teamData, researchContent) {
    try {
      const sources = this.extractExternalSources(researchContent);
      
      for (const source of sources) {
        await this.sequelize.query(`
          INSERT INTO external_data_sources (
            team_id, source_type, source_name, data_type,
            reliability_score, citation_text, research_confidence, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, {
          bind: [
            teamData.teamId,
            source.type,
            source.name,
            source.dataType,
            source.reliability,
            source.citation,
            source.confidence
          ]
        });
        
        this.stats.externalSourcesTracked++;
      }
      
      if (sources.length > 0) {
        console.log(`📄 Tracked ${sources.length} external sources`);
      }
      
    } catch (error) {
      console.error(`❌ Error tracking sources:`, error.message);
    }
  }

  // Helper methods for data extraction
  combineResearchText(researchContent) {
    let text = '';
    if (researchContent.history?.content) text += researchContent.history.content;
    if (researchContent.projections?.content) text += ' ' + researchContent.projections.content;
    return text;
  }

  determineTransferType(text) {
    return text.toLowerCase().includes('from') || text.toLowerCase().includes('addition') ? 'incoming' : 'outgoing';
  }

  extractPosition(text) {
    const positions = ['PG', 'SG', 'SF', 'PF', 'C', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB'];
    for (const pos of positions) {
      if (text.includes(pos)) return pos;
    }
    return null;
  }

  extractStarRating(text) {
    const match = text.match(/(\d)-star/);
    return match ? parseInt(match[1]) : null;
  }

  extractImpactRating(text) {
    if (text.toLowerCase().includes('elite') || text.toLowerCase().includes('all-american')) return 'high';
    if (text.toLowerCase().includes('starter') || text.toLowerCase().includes('key')) return 'medium';
    return 'low';
  }

  extractTransferReason(text) {
    if (text.toLowerCase().includes('playing time')) return 'playing_time';
    if (text.toLowerCase().includes('nil')) return 'nil_opportunity';
    if (text.toLowerCase().includes('coach')) return 'coaching_change';
    return 'other';
  }

  determineChangeType(text) {
    if (text.toLowerCase().includes('hired') || text.toLowerCase().includes('appointed')) return 'hired';
    if (text.toLowerCase().includes('fired')) return 'fired';
    return 'hired';
  }

  extractPreviousSchool(text) {
    // Logic to extract previous school from coaching change text
    return null; // Simplified for now
  }

  extractContractLength(text) {
    const match = text.match(/(\d+)[-\s]year/);
    return match ? parseInt(match[1]) : null;
  }

  extractHireDate(text) {
    // Logic to extract hire date
    return null; // Simplified for now
  }

  assessCoachingImpact(text) {
    if (text.toLowerCase().includes('championship') || text.toLowerCase().includes('elite')) return 'high';
    return 'medium';
  }

  extractCoachingExperience(text) {
    return text.substring(0, 200); // First 200 chars
  }

  classifyFacilityType(text) {
    if (text.toLowerCase().includes('stadium')) return 'stadium';
    if (text.toLowerCase().includes('practice')) return 'practice_facility';
    if (text.toLowerCase().includes('training')) return 'training_center';
    return 'facility';
  }

  extractProjectName(text) {
    // Extract project name from facility text
    return text.substring(0, 100); // Simplified
  }

  extractFundingSource(text) {
    if (text.toLowerCase().includes('donation')) return 'donation';
    if (text.toLowerCase().includes('university')) return 'university';
    return 'athletics_revenue';
  }

  assessRecruitingImpact(text) {
    return text.substring(0, 200); // First 200 chars
  }

  classifyNILStrength(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('elite nil') || lowerText.includes('top nil')) return 'elite';
    if (lowerText.includes('strong nil') || lowerText.includes('good nil')) return 'strong';
    if (lowerText.includes('average nil')) return 'average';
    if (lowerText.includes('developing nil')) return 'developing';
    return 'average';
  }

  extractNILAdvantages(text) {
    return text.substring(0, 300); // First 300 chars containing NIL info
  }

  extractPortalRanking(researchContent) {
    const text = this.combineResearchText(researchContent);
    const match = text.match(/portal.*?(?:class|ranking).*?#?(\d+)/i);
    return match ? parseInt(match[1]) : null;
  }

  extractRecruitingRanking(researchContent) {
    const text = this.combineResearchText(researchContent);
    const match = text.match(/recruiting.*?(?:class|ranking).*?#?(\d+)/i);
    return match ? parseInt(match[1]) : null;
  }

  assessCoachingStability(researchContent) {
    const text = this.combineResearchText(researchContent);
    if (text.toLowerCase().includes('lifetime contract') || text.toLowerCase().includes('long-term')) return 10.0;
    if (text.toLowerCase().includes('stable') || text.toLowerCase().includes('secure')) return 8.0;
    if (text.toLowerCase().includes('hot seat') || text.toLowerCase().includes('pressure')) return 3.0;
    return 6.0; // Average
  }

  extractExternalSources(researchContent) {
    const sources = [];
    
    // Extract citations
    if (researchContent.history?.citations) {
      researchContent.history.citations.forEach(citation => {
        sources.push({
          type: 'research_agent',
          name: this.extractSourceName(citation),
          dataType: 'historical_data',
          reliability: 0.8,
          citation: citation,
          confidence: 0.8
        });
      });
    }
    
    if (researchContent.projections?.citations) {
      researchContent.projections.citations.forEach(citation => {
        sources.push({
          type: 'research_agent',
          name: this.extractSourceName(citation),
          dataType: 'projection_data',
          reliability: 0.7,
          citation: citation,
          confidence: 0.7
        });
      });
    }
    
    return sources;
  }

  extractSourceName(citation) {
    if (typeof citation === 'string') {
      if (citation.includes('espn.com')) return 'ESPN';
      if (citation.includes('247sports.com')) return '247Sports';
      if (citation.includes('rivals.com')) return 'Rivals';
      if (citation.includes('cbssports.com')) return 'CBS Sports';
      return 'Unknown Source';
    }
    return 'Research Agent';
  }

  /**
   * Generate processing summary
   */
  generateSummary() {
    console.log('\n📊 COMPREHENSIVE RESEARCH PROCESSING SUMMARY:');
    console.log(`   👥 Teams Processed: ${this.stats.teamsProcessed}`);
    console.log(`   📥 Transfers Extracted: ${this.stats.transfersExtracted}`);
    console.log(`   👔 Coaching Changes: ${this.stats.coachingChangesExtracted}`);
    console.log(`   🏗️ Facility Investments: ${this.stats.facilityInvestmentsExtracted}`);
    console.log(`   💰 NIL Data Points: ${this.stats.nilDataExtracted}`);
    console.log(`   📄 External Sources: ${this.stats.externalSourcesTracked}`);
    console.log(`   ❌ Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.stats.errors.forEach(error => {
        console.log(`   - ${error.team}: ${error.error}`);
      });
    }
  }
}

module.exports = ComprehensiveResearchProcessor;