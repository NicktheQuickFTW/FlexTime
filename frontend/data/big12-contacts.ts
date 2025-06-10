/**
 * Big 12 Conference Contacts Data
 * 
 * Comprehensive directory of coaches, administrators, and staff
 * across all Big 12 member institutions and sports.
 */

export interface Big12Contact {
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
  photoUrl?: string;
  bio?: string;
  socialMedia?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface SportContact {
  headCoach?: Big12Contact;
  assistantCoaches: Big12Contact[];
  administrators: Big12Contact[];
  support: Big12Contact[];
}

export interface SchoolContacts {
  school: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  memberStatus: 'Legacy' | 'Affiliate';
  contacts: {
    [sport: string]: SportContact;
  };
  generalContacts: Big12Contact[];
}

// Sport mapping for consistent naming
export const SPORT_MAPPING: { [key: string]: string } = {
  'Baseball': 'baseball',
  'Men\'s Basketball': 'mens-basketball',
  'Women\'s Basketball': 'womens-basketball',
  'Football': 'football',
  'Men\'s Golf': 'mens-golf',
  'Women\'s Golf': 'womens-golf',
  'Gymnastics': 'gymnastics',
  'Lacrosse': 'lacrosse',
  'Soccer': 'soccer',
  'Softball': 'softball',
  'Swimming & Diving': 'swimming-diving',
  'Men\'s Tennis': 'mens-tennis',
  'Women\'s Tennis': 'womens-tennis',
  'Track & Field': 'track-field',
  'Cross Country': 'cross-country',
  'Volleyball': 'volleyball',
  'Wrestling': 'wrestling',
  'Beach Volleyball': 'beach-volleyball'
};

// Big 12 Schools with branding
export const BIG12_SCHOOLS = {
  'Arizona': {
    shortName: 'ARIZ',
    logo: '/logos/arizona.png',
    primaryColor: '#AB0520',
    secondaryColor: '#0C234B',
    memberStatus: 'Legacy' as const
  },
  'Arizona State': {
    shortName: 'ASU',
    logo: '/logos/arizona-state.png',
    primaryColor: '#8C1D40',
    secondaryColor: '#FFC627',
    memberStatus: 'Legacy' as const
  },
  'Baylor': {
    shortName: 'BAY',
    logo: '/logos/baylor.png',
    primaryColor: '#003015',
    secondaryColor: '#FFB81C',
    memberStatus: 'Legacy' as const
  },
  'BYU': {
    shortName: 'BYU',
    logo: '/logos/byu.png',
    primaryColor: '#002E5D',
    secondaryColor: '#FFFFFF',
    memberStatus: 'Legacy' as const
  },
  'Cincinnati': {
    shortName: 'CIN',
    logo: '/logos/cincinnati.png',
    primaryColor: '#E00122',
    secondaryColor: '#000000',
    memberStatus: 'Legacy' as const
  },
  'Colorado': {
    shortName: 'COLO',
    logo: '/logos/colorado.png',
    primaryColor: '#CFB87C',
    secondaryColor: '#000000',
    memberStatus: 'Legacy' as const
  },
  'Houston': {
    shortName: 'HOU',
    logo: '/logos/houston.png',
    primaryColor: '#C8102E',
    secondaryColor: '#FFFFFF',
    memberStatus: 'Legacy' as const
  },
  'Iowa State': {
    shortName: 'ISU',
    logo: '/logos/iowa-state.png',
    primaryColor: '#C8102E',
    secondaryColor: '#F1BE48',
    memberStatus: 'Legacy' as const
  },
  'Kansas': {
    shortName: 'KU',
    logo: '/logos/kansas.png',
    primaryColor: '#0051BA',
    secondaryColor: '#E8000D',
    memberStatus: 'Legacy' as const
  },
  'Kansas State': {
    shortName: 'KSU',
    logo: '/logos/kansas-state.png',
    primaryColor: '#512888',
    secondaryColor: '#FFFFFF',
    memberStatus: 'Legacy' as const
  },
  'Oklahoma State': {
    shortName: 'OKST',
    logo: '/logos/oklahoma-state.png',
    primaryColor: '#FF7300',
    secondaryColor: '#000000',
    memberStatus: 'Legacy' as const
  },
  'TCU': {
    shortName: 'TCU',
    logo: '/logos/tcu.png',
    primaryColor: '#4D1979',
    secondaryColor: '#A7A8AA',
    memberStatus: 'Legacy' as const
  },
  'Texas Tech': {
    shortName: 'TTU',
    logo: '/logos/texas-tech.png',
    primaryColor: '#CC0000',
    secondaryColor: '#000000',
    memberStatus: 'Legacy' as const
  },
  'UCF': {
    shortName: 'UCF',
    logo: '/logos/ucf.png',
    primaryColor: '#FC0',
    secondaryColor: '#000000',
    memberStatus: 'Legacy' as const
  },
  'Utah': {
    shortName: 'UTAH',
    logo: '/logos/utah.png',
    primaryColor: '#CC0000',
    secondaryColor: '#FFFFFF',
    memberStatus: 'Legacy' as const
  },
  'West Virginia': {
    shortName: 'WVU',
    logo: '/logos/west-virginia.png',
    primaryColor: '#002855',
    secondaryColor: '#EAAA00',
    memberStatus: 'Legacy' as const
  },
  // Affiliate members for wrestling
  'Air Force': {
    shortName: 'AF',
    logo: '/logos/air-force.png',
    primaryColor: '#003087',
    secondaryColor: '#8A8B8C',
    memberStatus: 'Affiliate' as const
  }
};

// Contact directory service
export class ContactDirectory {
  private static instance: ContactDirectory;
  private contacts: Big12Contact[] = [];
  private schoolContacts: { [school: string]: SchoolContacts } = {};

  static getInstance(): ContactDirectory {
    if (!ContactDirectory.instance) {
      ContactDirectory.instance = new ContactDirectory();
    }
    return ContactDirectory.instance;
  }

  // Load contacts from CSV data
  async loadContacts(): Promise<void> {
    try {
      // This would typically load from the CSV file
      // For now, we'll structure it based on the data we saw
      this.initializeContactStructure();
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  }

  private initializeContactStructure(): void {
    // Initialize school structures
    Object.keys(BIG12_SCHOOLS).forEach(school => {
      this.schoolContacts[school] = {
        school,
        shortName: BIG12_SCHOOLS[school as keyof typeof BIG12_SCHOOLS].shortName,
        logo: BIG12_SCHOOLS[school as keyof typeof BIG12_SCHOOLS].logo,
        primaryColor: BIG12_SCHOOLS[school as keyof typeof BIG12_SCHOOLS].primaryColor,
        secondaryColor: BIG12_SCHOOLS[school as keyof typeof BIG12_SCHOOLS].secondaryColor,
        memberStatus: BIG12_SCHOOLS[school as keyof typeof BIG12_SCHOOLS].memberStatus,
        contacts: {},
        generalContacts: []
      };
    });
  }

  // Search contacts by various criteria
  searchContacts(query: string): Big12Contact[] {
    const searchTerm = query.toLowerCase();
    return this.contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchTerm) ||
      contact.affiliation.toLowerCase().includes(searchTerm) ||
      contact.sportRole.toLowerCase().includes(searchTerm) ||
      contact.sport.some(sport => sport.toLowerCase().includes(searchTerm))
    );
  }

  // Get contacts for specific sport
  getContactsBySport(sport: string): Big12Contact[] {
    return this.contacts.filter(contact => 
      contact.sport.some(s => s.toLowerCase() === sport.toLowerCase())
    );
  }

  // Get contacts for specific school
  getContactsBySchool(school: string): Big12Contact[] {
    return this.contacts.filter(contact => 
      contact.affiliation.toLowerCase() === school.toLowerCase()
    );
  }

  // Get sport contacts for school
  getSportContacts(school: string, sport: string): SportContact {
    const schoolData = this.schoolContacts[school];
    if (!schoolData || !schoolData.contacts[sport]) {
      return {
        assistantCoaches: [],
        administrators: [],
        support: []
      };
    }
    return schoolData.contacts[sport];
  }

  // Get all schools participating in a sport
  getSchoolsBySport(sport: string): string[] {
    const schools = new Set<string>();
    this.contacts.forEach(contact => {
      if (contact.sport.some(s => s.toLowerCase() === sport.toLowerCase())) {
        schools.add(contact.affiliation);
      }
    });
    return Array.from(schools);
  }

  // Get contact by role and school for sport
  getContactByRole(school: string, sport: string, role: string): Big12Contact | null {
    const contacts = this.getContactsBySchool(school)
      .filter(contact => 
        contact.sport.some(s => s.toLowerCase() === sport.toLowerCase()) &&
        contact.sportRole.toLowerCase().includes(role.toLowerCase())
      );
    return contacts[0] || null;
  }

  // Export functions for easy access
  getAllContacts(): Big12Contact[] {
    return this.contacts;
  }

  getAllSchools(): SchoolContacts[] {
    return Object.values(this.schoolContacts);
  }
}

// Export singleton instance
export const contactDirectory = ContactDirectory.getInstance();

// Initialize contacts on module load
contactDirectory.loadContacts();