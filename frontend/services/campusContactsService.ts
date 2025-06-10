/**
 * Campus Contacts Service for FlexTime
 * 
 * Processes and manages Big 12 Conference campus contacts from CSV data
 * Provides role-based filtering, search, and institutional organization
 */

export interface CampusContact {
  id: string;
  affiliation: string;
  sportRole: string;
  name: string;
  email: string;
  phone: string;
  sport: string[];
  memberStatus: 'Legacy' | 'Affiliate';
  position?: string;
  department?: string;
  availability?: 'available' | 'busy' | 'unavailable';
  isEmergencyContact?: boolean;
}

export interface ContactGroup {
  institution: string;
  memberStatus: 'Legacy' | 'Affiliate';
  contacts: CampusContact[];
  totalContacts: number;
  roleBreakdown: Record<string, number>;
}

export interface SportContactSummary {
  sport: string;
  totalContacts: number;
  institutions: string[];
  roleTypes: string[];
  contacts: CampusContact[];
}

class CampusContactsService {
  private contacts: CampusContact[] = [];
  private contactGroups: Map<string, ContactGroup> = new Map();
  private sportContacts: Map<string, SportContactSummary> = new Map();
  
  constructor() {
    this.loadContactsFromCSV();
  }

  /**
   * Load and process contacts from CSV data
   * Based on the CSV structure: Affiliation,Sport Role,Name,E-Mail,Phone,Sport,Member Status
   */
  private async loadContactsFromCSV(): Promise<void> {
    try {
      // Import the real CSV loader
      const { loadRealCSVContacts } = await import('@/utils/realCSVLoader');
      this.contacts = await loadRealCSVContacts();
    } catch (error) {
      console.error('Failed to load contacts from real CSV, using fallback data:', error);
      // Fallback to sample data
      this.loadFallbackData();
    }

    this.buildContactGroups();
    this.buildSportContacts();
  }

  /**
   * Load fallback data when CSV loading fails
   */
  private loadFallbackData(): void {
    const csvData = this.getCSVData();
    
    this.contacts = csvData.map((row, index) => {
      const sports = row.Sport ? row.Sport.split(',').map(s => s.trim()) : [];
      
      return {
        id: `contact-${index + 1}`,
        affiliation: row.Affiliation,
        sportRole: row['Sport Role'] || 'Staff',
        name: row.Name,
        email: row['E-Mail'] || '',
        phone: row.Phone || '',
        sport: sports,
        memberStatus: (row['Member Status'] === 'Legacy' ? 'Legacy' : 'Affiliate') as 'Legacy' | 'Affiliate',
        position: row['Sport Role'],
        department: this.getDepartmentFromRole(row['Sport Role']),
        availability: this.getRandomAvailability(),
        isEmergencyContact: this.isEmergencyRole(row['Sport Role'])
      };
    });
  }

  /**
   * Get sample CSV data based on the actual structure
   */
  private getCSVData() {
    return [
      // Big 12 Conference Staff
      { Affiliation: 'Big 12 Conference', 'Sport Role': 'Commissioner', Name: 'Brett Yormark', 'E-Mail': 'byormark@big12sports.com', Phone: '347-236-2121', Sport: '', 'Member Status': 'Legacy' },
      { Affiliation: 'Big 12 Conference', 'Sport Role': 'Sport Liaison', Name: 'Scott Draper', 'E-Mail': 'sdraper@big12sports.com', Phone: '214-409-4358', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'Big 12 Conference', 'Sport Role': 'Sport Liaison', Name: 'Brian Thornton', 'E-Mail': 'bthornton@big12sports.com', Phone: '803-448-5635', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      { Affiliation: 'Big 12 Conference', 'Sport Role': 'Sport Liaison', Name: 'Dayna Scherf', 'E-Mail': 'dayna@big12sports.com', Phone: '214-409-4356', Sport: 'Gymnastics, Lacrosse, Rowing, Softball, Volleyball, Women\'s Basketball', 'Member Status': 'Legacy' },
      
      // Arizona
      { Affiliation: 'Arizona', 'Sport Role': 'Head Coach', Name: 'Brent Brennan', 'E-Mail': 'aherink7@arizona.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'Arizona', 'Sport Role': 'Head Coach', Name: 'Tommy Lloyd', 'E-Mail': 'eliasm@arizona.edu', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      { Affiliation: 'Arizona', 'Sport Role': 'Sport Administrator', Name: 'Desiree Reed-Francois', 'E-Mail': 'dreedfrancois@arizona.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      
      // Arizona State
      { Affiliation: 'Arizona State', 'Sport Role': 'Head Coach', Name: 'Kenny Dillingham', 'E-Mail': 'kenneth.dillingham@asu.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'Arizona State', 'Sport Role': 'Head Coach', Name: 'Bobby Hurley', 'E-Mail': 'mmitch30@asu.edu', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      { Affiliation: 'Arizona State', 'Sport Role': 'Head Coach', Name: 'Zeke Jones', 'E-Mail': 'zeke.jones@asu.edu', Phone: '719-659-1388', Sport: 'Wrestling', 'Member Status': 'Legacy' },
      
      // Baylor
      { Affiliation: 'Baylor', 'Sport Role': 'Head Coach', Name: 'Dave Aranda', 'E-Mail': 'madelyn_martin@baylor.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'Baylor', 'Sport Role': 'Head Coach', Name: 'Scott Drew', 'E-Mail': 'steve_m_henson@baylor.edu', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      { Affiliation: 'Baylor', 'Sport Role': 'Head Coach', Name: 'Nicki Collen', 'E-Mail': 'nicki_collen@baylor.edu', Phone: '', Sport: 'Women\'s Basketball', 'Member Status': 'Legacy' },
      
      // BYU
      { Affiliation: 'BYU', 'Sport Role': 'Head Coach', Name: 'Kalani Sitake', 'E-Mail': 'christiana@byu.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'BYU', 'Sport Role': 'Head Coach', Name: 'Kevin Young', 'E-Mail': 'samantha_young@byu.edu', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      { Affiliation: 'BYU', 'Sport Role': 'Head Coach', Name: 'Heather Olmstead', 'E-Mail': 'heather_olmstead@byu.edu', Phone: '801-541-7490', Sport: 'Volleyball', 'Member Status': 'Legacy' },
      
      // Cincinnati
      { Affiliation: 'Cincinnati', 'Sport Role': 'Head Coach', Name: 'Scott Satterfield', 'E-Mail': 'sherry.murray@uc.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'Cincinnati', 'Sport Role': 'Head Coach', Name: 'Wes Miller', 'E-Mail': 'ashley.hecimovich@uc.edu', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      
      // Colorado
      { Affiliation: 'Colorado', 'Sport Role': 'Head Coach', Name: 'Deion Sanders', 'E-Mail': 'ty.stewart@colorado.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'Colorado', 'Sport Role': 'Head Coach', Name: 'Tad Boyle', 'E-Mail': 'margaret.marcy@colorado.edu', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      
      // Houston
      { Affiliation: 'Houston', 'Sport Role': 'Head Coach', Name: 'Willie Fritz', 'E-Mail': 'smmeyer2@central.uh.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'Houston', 'Sport Role': 'Head Coach', Name: 'Kelvin Sampson', 'E-Mail': 'dhixon@central.uh.edu', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      
      // Iowa State
      { Affiliation: 'Iowa State', 'Sport Role': 'Head Coach', Name: 'Matt Campbell', 'E-Mail': 'egenise@iastate.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'Iowa State', 'Sport Role': 'Head Coach', Name: 'T.J. Otzelberger', 'E-Mail': 'tpollard@iastate.edu', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      
      // Kansas
      { Affiliation: 'Kansas', 'Sport Role': 'Head Coach', Name: 'Lance Leipold', 'E-Mail': 'jacksnad@ku.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'Kansas', 'Sport Role': 'Head Coach', Name: 'Bill Self', 'E-Mail': 'joanstep@ku.edu', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      
      // Kansas State
      { Affiliation: 'K-State', 'Sport Role': 'Head Coach', Name: 'Chris Klieman', 'E-Mail': 'ncrimmins@kstatesports.com', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'K-State', 'Sport Role': 'Head Coach', Name: 'Jerome Tang', 'E-Mail': 'bbachamp@kstatesports.com', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      
      // Oklahoma State
      { Affiliation: 'Oklahoma State', 'Sport Role': 'Head Coach', Name: 'Mike Gundy', 'E-Mail': 'danielle.clary@okstate.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'Oklahoma State', 'Sport Role': 'Head Coach', Name: 'Steve Lutz', 'E-Mail': 'andrea.m.brown@okstate.edu', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      
      // TCU
      { Affiliation: 'TCU', 'Sport Role': 'Head Coach', Name: 'Sonny Dykes', 'E-Mail': 'andrea.roberts@tcu.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'TCU', 'Sport Role': 'Head Coach', Name: 'Jamie Dixon', 'E-Mail': 'k.coleman1@tcu.edu', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      
      // Texas Tech
      { Affiliation: 'Texas Tech', 'Sport Role': 'Head Coach', Name: 'Joey McGuire', 'E-Mail': 'lesha.weatherford@ttu.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'Texas Tech', 'Sport Role': 'Head Coach', Name: 'Grant McCasland', 'E-Mail': 'jardon.powell@ttu.edu', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      
      // UCF
      { Affiliation: 'UCF', 'Sport Role': 'Head Coach', Name: 'Gus Malzahn', 'E-Mail': 'kyerves@athletics.ucf.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'UCF', 'Sport Role': 'Head Coach', Name: 'Johnny Dawkins', 'E-Mail': 'kpufko@athletics.ucf.edu', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      
      // Utah
      { Affiliation: 'Utah', 'Sport Role': 'Head Coach', Name: 'Kyle Whittingham', 'E-Mail': 'nbenitezhilton@huntsman.utah.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'Utah', 'Sport Role': 'Head Coach', Name: 'Alex Jensen', 'E-Mail': '', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' },
      
      // West Virginia
      { Affiliation: 'West Virginia', 'Sport Role': 'Head Coach', Name: 'Neal Brown', 'E-Mail': 'lori.rice@mail.wvu.edu', Phone: '', Sport: 'Football', 'Member Status': 'Legacy' },
      { Affiliation: 'West Virginia', 'Sport Role': 'Head Coach', Name: 'Darian DeVries', 'E-Mail': 'garrett.sturtz@mail.wvu.edu', Phone: '', Sport: 'Men\'s Basketball', 'Member Status': 'Legacy' }
    ];
  }

  /**
   * Determine department based on sport role
   */
  private getDepartmentFromRole(role: string): string {
    if (role.includes('Head Coach') || role.includes('Assistant Coach')) return 'Athletics - Coaching';
    if (role.includes('Sport Administrator')) return 'Athletics - Administration';
    if (role.includes('Director of Operations')) return 'Athletics - Operations';
    if (role.includes('Communications')) return 'Athletics - Media Relations';
    if (role.includes('Game Operations')) return 'Athletics - Events';
    if (role.includes('Commissioner') || role.includes('Liaison')) return 'Conference Administration';
    return 'Athletics - General';
  }

  /**
   * Get random availability status for contacts
   */
  private getRandomAvailability(): 'available' | 'busy' | 'unavailable' {
    const statuses: ('available' | 'busy' | 'unavailable')[] = ['available', 'busy', 'unavailable'];
    const weights = [0.6, 0.3, 0.1]; // 60% available, 30% busy, 10% unavailable
    const random = Math.random();
    let sum = 0;
    
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random <= sum) return statuses[i];
    }
    
    return 'available';
  }

  /**
   * Determine if role is emergency contact
   */
  private isEmergencyRole(role: string): boolean {
    const emergencyRoles = [
      'Commissioner', 'Head Coach', 'Sport Administrator', 
      'Director of Athletics', 'Sport Liaison'
    ];
    return emergencyRoles.some(er => role.includes(er));
  }

  /**
   * Build contact groups by institution
   */
  private buildContactGroups(): void {
    this.contactGroups.clear();
    
    this.contacts.forEach(contact => {
      if (!this.contactGroups.has(contact.affiliation)) {
        this.contactGroups.set(contact.affiliation, {
          institution: contact.affiliation,
          memberStatus: contact.memberStatus,
          contacts: [],
          totalContacts: 0,
          roleBreakdown: {}
        });
      }
      
      const group = this.contactGroups.get(contact.affiliation)!;
      group.contacts.push(contact);
      group.totalContacts++;
      
      const role = contact.sportRole;
      group.roleBreakdown[role] = (group.roleBreakdown[role] || 0) + 1;
    });
  }

  /**
   * Build sport-specific contact maps
   */
  private buildSportContacts(): void {
    this.sportContacts.clear();
    
    this.contacts.forEach(contact => {
      contact.sport.forEach(sport => {
        if (!this.sportContacts.has(sport)) {
          this.sportContacts.set(sport, {
            sport: sport,
            totalContacts: 0,
            institutions: [],
            roleTypes: [],
            contacts: []
          });
        }
        
        const sportSummary = this.sportContacts.get(sport)!;
        sportSummary.contacts.push(contact);
        sportSummary.totalContacts++;
        
        if (!sportSummary.institutions.includes(contact.affiliation)) {
          sportSummary.institutions.push(contact.affiliation);
        }
        
        if (!sportSummary.roleTypes.includes(contact.sportRole)) {
          sportSummary.roleTypes.push(contact.sportRole);
        }
      });
    });
  }

  /**
   * Get all contacts
   */
  public getAllContacts(): CampusContact[] {
    return [...this.contacts];
  }

  /**
   * Get contacts by institution
   */
  public getContactsByInstitution(institution: string): CampusContact[] {
    return this.contacts.filter(contact => 
      contact.affiliation.toLowerCase().includes(institution.toLowerCase())
    );
  }

  /**
   * Get contacts by sport
   */
  public getContactsBySport(sport: string): CampusContact[] {
    return this.contacts.filter(contact => 
      contact.sport.some(s => s.toLowerCase().includes(sport.toLowerCase()))
    );
  }

  /**
   * Get contacts by role
   */
  public getContactsByRole(role: string): CampusContact[] {
    return this.contacts.filter(contact => 
      contact.sportRole.toLowerCase().includes(role.toLowerCase())
    );
  }

  /**
   * Search contacts by name, email, or institution
   */
  public searchContacts(query: string): CampusContact[] {
    const lowerQuery = query.toLowerCase();
    return this.contacts.filter(contact =>
      contact.name.toLowerCase().includes(lowerQuery) ||
      contact.email.toLowerCase().includes(lowerQuery) ||
      contact.affiliation.toLowerCase().includes(lowerQuery) ||
      contact.sportRole.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get contact groups (institutions)
   */
  public getContactGroups(): ContactGroup[] {
    return Array.from(this.contactGroups.values());
  }

  /**
   * Get sport contact summaries
   */
  public getSportContactSummaries(): SportContactSummary[] {
    return Array.from(this.sportContacts.values());
  }

  /**
   * Get emergency contacts
   */
  public getEmergencyContacts(): CampusContact[] {
    return this.contacts.filter(contact => contact.isEmergencyContact);
  }

  /**
   * Get Big 12 Conference staff contacts
   */
  public getConferenceStaff(): CampusContact[] {
    return this.contacts.filter(contact => 
      contact.affiliation === 'Big 12 Conference'
    );
  }

  /**
   * Get contact statistics
   */
  public getContactStatistics() {
    const stats = {
      totalContacts: this.contacts.length,
      legacyMembers: this.contacts.filter(c => c.memberStatus === 'Legacy').length,
      affiliateMembers: this.contacts.filter(c => c.memberStatus === 'Affiliate').length,
      emergencyContacts: this.contacts.filter(c => c.isEmergencyContact).length,
      institutions: this.contactGroups.size,
      sports: this.sportContacts.size,
      roleBreakdown: {} as Record<string, number>,
      availabilityBreakdown: {
        available: this.contacts.filter(c => c.availability === 'available').length,
        busy: this.contacts.filter(c => c.availability === 'busy').length,
        unavailable: this.contacts.filter(c => c.availability === 'unavailable').length
      }
    };

    // Calculate role breakdown
    this.contacts.forEach(contact => {
      const role = contact.sportRole;
      stats.roleBreakdown[role] = (stats.roleBreakdown[role] || 0) + 1;
    });

    return stats;
  }
}

// Create and export singleton instance
export const campusContactsService = new CampusContactsService();
export default campusContactsService;