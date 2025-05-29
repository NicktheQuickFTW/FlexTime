#!/usr/bin/env node

/**
 * Contact Integration and Softball Analysis Processor
 * Integrates XII Conference Contacts and processes softball research results
 */

const fs = require('fs').promises;
const path = require('path');

class ContactsAndSoftballProcessor {
  constructor() {
    this.contactsPath = path.join(__dirname, '../docs/XII Conference Contacts 13779839c200819db58bd3f239672f9a_all.csv');
    this.softballDataPath = path.join(__dirname, '../data/research_results/softball_research_latest.json');
    this.basketballDataPath = path.join(__dirname, '../data/research_results/basketball_research_latest.json');
    this.outputPath = path.join(__dirname, '../data/integrated_analysis');
  }

  async processContacts() {
    console.log('📋 Processing XII Conference Contacts...');
    
    const contactsRaw = await fs.readFile(this.contactsPath, 'utf8');
    const lines = contactsRaw.split('\n').slice(1); // Skip header
    
    const contacts = {};
    
    lines.forEach(line => {
      const fields = this.parseCSVLine(line);
      if (fields.length < 7) return;
      
      const [affiliation, sportRole, name, email, phone, sport, memberStatus] = fields;
      
      if (!contacts[affiliation]) {
        contacts[affiliation] = {
          institution: affiliation,
          memberStatus: memberStatus,
          contacts: [],
          sports: new Set()
        };
      }
      
      if (name && name.trim()) {
        contacts[affiliation].contacts.push({
          name: name.trim(),
          role: sportRole,
          email: email,
          phone: phone,
          sport: sport
        });
      }
      
      if (sport && sport.trim()) {
        sport.split(',').forEach(s => contacts[affiliation].sports.add(s.trim()));
      }
    });

    // Convert sports Sets to Arrays
    Object.values(contacts).forEach(contact => {
      contact.sports = Array.from(contact.sports).filter(s => s);
    });

    console.log(`✅ Processed ${Object.keys(contacts).length} institutions`);
    console.log(`📊 Contact categories: ${Object.values(contacts).reduce((sum, inst) => sum + inst.contacts.length, 0)} total contacts`);
    
    return contacts;
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  async processSoftballData() {
    console.log('🥎 Processing Softball Research Data...');
    
    try {
      const softballDataRaw = await fs.readFile(this.softballDataPath, 'utf8');
      const softballData = JSON.parse(softballDataRaw);
      
      console.log(`✅ Loaded softball data for ${Object.keys(softballData.research).length} teams`);
      console.log(`📊 Research completion rate: ${this.calculateCompletionRate(softballData)}%`);
      
      return softballData;
    } catch (error) {
      console.error('❌ Failed to load softball data:', error.message);
      return null;
    }
  }

  async processBasketballData() {
    console.log('🏀 Processing Basketball Research Data...');
    
    try {
      const basketballDataRaw = await fs.readFile(this.basketballDataPath, 'utf8');
      const basketballData = JSON.parse(basketballDataRaw);
      
      console.log(`✅ Loaded basketball data for ${Object.keys(basketballData.research).length} teams`);
      console.log(`📊 Research completion rate: ${this.calculateCompletionRate(basketballData)}%`);
      
      return basketballData;
    } catch (error) {
      console.error('❌ Failed to load basketball data:', error.message);
      return null;
    }
  }

  calculateCompletionRate(data) {
    const expectedJobs = data.metadata.teams * 2; // history + projections
    const completedJobs = Object.values(data.research).reduce((count, team) => {
      return count + (team.history ? 1 : 0) + (team.projections ? 1 : 0);
    }, 0);
    return ((completedJobs / expectedJobs) * 100).toFixed(1);
  }

  async integrateData(contacts, softballData, basketballData) {
    console.log('🔗 Integrating contacts with research data...');
    
    const integrated = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalInstitutions: Object.keys(contacts).length,
        sportsData: {
          softball: softballData ? Object.keys(softballData.research).length : 0,
          basketball: basketballData ? Object.keys(basketballData.research).length : 0
        }
      },
      institutions: {}
    };

    // Process each institution
    Object.entries(contacts).forEach(([institution, data]) => {
      integrated.institutions[institution] = {
        ...data,
        sportsAnalysis: {}
      };

      // Add softball analysis if available
      if (softballData && softballData.research[institution]) {
        integrated.institutions[institution].sportsAnalysis.softball = {
          available: true,
          historical: !!softballData.research[institution].history,
          projections: !!softballData.research[institution].projections,
          lastUpdated: softballData.metadata.completedAt
        };
      }

      // Add basketball analysis if available
      if (basketballData && basketballData.research[institution]) {
        integrated.institutions[institution].sportsAnalysis.basketball = {
          available: true,
          historical: !!basketballData.research[institution].history,
          projections: !!basketballData.research[institution].projections,
          lastUpdated: basketballData.metadata.completedAt
        };
      }
    });

    // Generate contact summaries by sport
    const sportContacts = {};
    Object.values(integrated.institutions).forEach(inst => {
      inst.contacts.forEach(contact => {
        if (contact.sport) {
          contact.sport.split(',').forEach(sport => {
            const sportName = sport.trim();
            if (!sportContacts[sportName]) {
              sportContacts[sportName] = [];
            }
            sportContacts[sportName].push({
              institution: inst.institution,
              name: contact.name,
              role: contact.role,
              email: contact.email,
              phone: contact.phone
            });
          });
        }
      });
    });

    integrated.sportContacts = sportContacts;

    console.log(`✅ Integrated data for ${Object.keys(integrated.institutions).length} institutions`);
    console.log(`📊 Sports with contacts: ${Object.keys(sportContacts).length}`);
    
    return integrated;
  }

  async generateAnalysisSummary(integratedData, softballData, basketballData) {
    console.log('📈 Generating comprehensive analysis summary...');
    
    const summary = {
      executiveSummary: {
        timestamp: new Date().toISOString(),
        totalInstitutions: Object.keys(integratedData.institutions).length,
        dataCompleteness: {
          contacts: Object.keys(integratedData.institutions).length,
          softball: softballData ? Object.keys(softballData.research).length : 0,
          basketball: basketballData ? Object.keys(basketballData.research).length : 0
        }
      },
      keyFindings: {
        contactCoverage: this.analyzeContactCoverage(integratedData),
        researchDepth: this.analyzeResearchDepth(softballData, basketballData),
        institutionalReadiness: this.analyzeInstitutionalReadiness(integratedData)
      },
      recommendations: this.generateRecommendations(integratedData, softballData, basketballData)
    };

    return summary;
  }

  analyzeContactCoverage(data) {
    const coverage = {};
    Object.keys(data.sportContacts).forEach(sport => {
      coverage[sport] = {
        totalContacts: data.sportContacts[sport].length,
        institutions: [...new Set(data.sportContacts[sport].map(c => c.institution))].length
      };
    });
    return coverage;
  }

  analyzeResearchDepth(softballData, basketballData) {
    const analysis = {};
    
    if (softballData) {
      analysis.softball = {
        teams: Object.keys(softballData.research).length,
        avgHistoricalLength: this.calculateAverageLength(softballData.research, 'history'),
        avgProjectionsLength: this.calculateAverageLength(softballData.research, 'projections'),
        totalCitations: this.countCitations(softballData.research)
      };
    }
    
    if (basketballData) {
      analysis.basketball = {
        teams: Object.keys(basketballData.research).length,
        avgHistoricalLength: this.calculateAverageLength(basketballData.research, 'history'),
        avgProjectionsLength: this.calculateAverageLength(basketballData.research, 'projections'),
        totalCitations: this.countCitations(basketballData.research)
      };
    }
    
    return analysis;
  }

  calculateAverageLength(research, type) {
    const lengths = Object.values(research)
      .filter(team => team[type] && team[type].content)
      .map(team => team[type].content.length);
    return lengths.length > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0;
  }

  countCitations(research) {
    return Object.values(research).reduce((total, team) => {
      return total + 
        (team.history?.citations?.length || 0) + 
        (team.projections?.citations?.length || 0);
    }, 0);
  }

  analyzeInstitutionalReadiness(data) {
    const readiness = {};
    Object.entries(data.institutions).forEach(([name, inst]) => {
      const hasBasketball = inst.sportsAnalysis.basketball?.available || false;
      const hasSoftball = inst.sportsAnalysis.softball?.available || false;
      const contactCount = inst.contacts.length;
      
      readiness[name] = {
        dataReadiness: (hasBasketball ? 50 : 0) + (hasSoftball ? 50 : 0),
        contactReadiness: Math.min(contactCount * 10, 100),
        overallReadiness: Math.round(((hasBasketball ? 50 : 0) + (hasSoftball ? 50 : 0) + Math.min(contactCount * 10, 100)) / 2)
      };
    });
    return readiness;
  }

  generateRecommendations(integratedData, softballData, basketballData) {
    return {
      dataGaps: this.identifyDataGaps(integratedData),
      contactImprovements: this.identifyContactImprovements(integratedData),
      researchPriorities: this.identifyResearchPriorities(softballData, basketballData)
    };
  }

  identifyDataGaps(data) {
    const gaps = [];
    Object.entries(data.institutions).forEach(([name, inst]) => {
      if (!inst.sportsAnalysis.basketball?.available) {
        gaps.push(`${name}: Missing basketball analysis`);
      }
      if (!inst.sportsAnalysis.softball?.available && inst.sports.includes('Softball')) {
        gaps.push(`${name}: Missing softball analysis`);
      }
    });
    return gaps;
  }

  identifyContactImprovements(data) {
    const improvements = [];
    Object.entries(data.institutions).forEach(([name, inst]) => {
      if (inst.contacts.length < 3) {
        improvements.push(`${name}: Limited contact information (${inst.contacts.length} contacts)`);
      }
    });
    return improvements;
  }

  identifyResearchPriorities(softballData, basketballData) {
    const priorities = [];
    
    if (softballData) {
      const incompleteSoftball = Object.entries(softballData.research)
        .filter(([team, data]) => !data.history || !data.projections)
        .map(([team]) => team);
      if (incompleteSoftball.length > 0) {
        priorities.push(`Complete softball analysis for: ${incompleteSoftball.join(', ')}`);
      }
    }
    
    if (basketballData) {
      const incompleteBasketball = Object.entries(basketballData.research)
        .filter(([team, data]) => !data.history || !data.projections)
        .map(([team]) => team);
      if (incompleteBasketball.length > 0) {
        priorities.push(`Complete basketball analysis for: ${incompleteBasketball.join(', ')}`);
      }
    }
    
    return priorities;
  }

  async saveResults(integratedData, summary) {
    // Ensure output directory exists
    try {
      await fs.access(this.outputPath);
    } catch {
      await fs.mkdir(this.outputPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save integrated data
    const integratedPath = path.join(this.outputPath, `integrated_contacts_sports_${timestamp}.json`);
    await fs.writeFile(integratedPath, JSON.stringify(integratedData, null, 2));
    
    // Save summary
    const summaryPath = path.join(this.outputPath, `analysis_summary_${timestamp}.json`);
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    // Save latest versions
    const latestIntegratedPath = path.join(this.outputPath, 'integrated_contacts_sports_latest.json');
    const latestSummaryPath = path.join(this.outputPath, 'analysis_summary_latest.json');
    
    await fs.writeFile(latestIntegratedPath, JSON.stringify(integratedData, null, 2));
    await fs.writeFile(latestSummaryPath, JSON.stringify(summary, null, 2));
    
    console.log('💾 Results saved:');
    console.log(`   📋 Integrated data: ${integratedPath}`);
    console.log(`   📊 Analysis summary: ${summaryPath}`);
    console.log(`   🔗 Latest versions saved for easy access`);
  }

  async run() {
    console.log('🚀 STARTING CONTACT INTEGRATION & SOFTBALL ANALYSIS 🚀');
    console.log('=' * 60);

    try {
      // Process all data sources
      const contacts = await this.processContacts();
      const softballData = await this.processSoftballData();
      const basketballData = await this.processBasketballData();

      // Integrate data
      const integratedData = await this.integrateData(contacts, softballData, basketballData);
      
      // Generate analysis
      const summary = await this.generateAnalysisSummary(integratedData, softballData, basketballData);
      
      // Save results
      await this.saveResults(integratedData, summary);

      console.log('🎉 INTEGRATION COMPLETED SUCCESSFULLY! 🎉');
      return { integratedData, summary };

    } catch (error) {
      console.error('💥 INTEGRATION FAILED:', error);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const processor = new ContactsAndSoftballProcessor();
  processor.run().catch(console.error);
}

module.exports = ContactsAndSoftballProcessor;