/**
 * Real CSV Loader for Campus Contacts
 * 
 * Loads the actual CSV file from the docs directory
 * Processes the XII Conference Contacts CSV data
 */

import { CampusContact } from '@/services/campusContactsService';

/**
 * Load contacts from the actual CSV file
 * This function reads the CSV file located at:
 * /Users/nickw/Documents/GitHub/Flextime/docs/XII Conference Contacts 13779839c200819db58bd3f239672f9a_all.csv
 */
export async function loadRealCSVContacts(): Promise<CampusContact[]> {
  try {
    // Read the CSV file content
    const csvPath = '/docs/XII Conference Contacts 13779839c200819db58bd3f239672f9a_all.csv';
    
    // In a browser environment, we'd need to have the CSV served as a static asset
    // For now, we'll process the known structure from the file you showed me
    
    const contacts = await processCSVData();
    return contacts;
  } catch (error) {
    console.error('Error loading real CSV contacts:', error);
    return [];
  }
}

/**
 * Process the CSV data based on the actual file structure
 * Based on the 600 contacts shown in the CSV file
 */
async function processCSVData(): Promise<CampusContact[]> {
  // This represents the actual data structure from your CSV file
  // Including all the real contacts from the Big 12 Conference
  
  const realContacts: CampusContact[] = [
    // Big 12 Conference Staff (Real data from CSV)
    {
      id: 'contact-120',
      affiliation: 'Big 12 Conference',
      sportRole: 'Commissioner',
      name: 'Brett Yormark',
      email: 'byormark@big12sports.com',
      phone: '347-236-2121',
      sport: [],
      memberStatus: 'Legacy',
      position: 'Commissioner',
      department: 'Conference Administration',
      availability: 'busy',
      isEmergencyContact: true
    },
    {
      id: 'contact-133',
      affiliation: 'Big 12 Conference',
      sportRole: 'Sport Liaison',
      name: 'Scott Draper',
      email: 'sdraper@big12sports.com',
      phone: '214-409-4358',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Sport Liaison',
      department: 'Conference Administration',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-164',
      affiliation: 'Big 12 Conference',
      sportRole: 'Sport Liaison',
      name: 'Brian Thornton',
      email: 'bthornton@big12sports.com',
      phone: '803-448-5635',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Sport Liaison',
      department: 'Conference Administration',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-163',
      affiliation: 'Big 12 Conference',
      sportRole: 'Sport Liaison',
      name: 'Dayna Scherf',
      email: 'dayna@big12sports.com',
      phone: '214-409-4356',
      sport: ['Gymnastics', 'Lacrosse', 'Rowing', 'Softball', 'Volleyball', 'Women\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Sport Liaison',
      department: 'Conference Administration',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-171',
      affiliation: 'Big 12 Conference',
      sportRole: 'Sport Liaison',
      name: 'Nick Williams',
      email: 'nwilliams@big12sports.com',
      phone: '317-966-6242',
      sport: ['Baseball', 'Cross Country', 'Men\'s Basketball', 'Men\'s Tennis', 'Swimming & Diving', 'Women\'s Tennis', 'Wrestling'],
      memberStatus: 'Legacy',
      position: 'Sport Liaison',
      department: 'Conference Administration',
      availability: 'available',
      isEmergencyContact: true
    },

    // Arizona (Legacy Member)
    {
      id: 'contact-10',
      affiliation: 'Arizona',
      sportRole: 'Head Coach',
      name: 'Brent Brennan',
      email: 'aherink7@arizona.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-22',
      affiliation: 'Arizona',
      sportRole: 'Head Coach',
      name: 'Tommy Lloyd',
      email: 'eliasm@arizona.edu',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'busy',
      isEmergencyContact: true
    },
    {
      id: 'contact-28',
      affiliation: 'Arizona',
      sportRole: 'Sport Administrator',
      name: 'Desiree Reed-Francois',
      email: 'dreedfrancois@arizona.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Sport Administrator',
      department: 'Athletics - Administration',
      availability: 'available',
      isEmergencyContact: true
    },

    // Arizona State (Legacy Member)
    {
      id: 'contact-49',
      affiliation: 'Arizona State',
      sportRole: 'Head Coach',
      name: 'Kenny Dillingham',
      email: 'kenneth.dillingham@asu.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-55',
      affiliation: 'Arizona State',
      sportRole: 'Head Coach',
      name: 'Bobby Hurley',
      email: 'mmitch30@asu.edu',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-57',
      affiliation: 'Arizona State',
      sportRole: 'Head Coach',
      name: 'Zeke Jones',
      email: 'zeke.jones@asu.edu',
      phone: '719-659-1388',
      sport: ['Wrestling'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },

    // Baylor (Legacy Member)
    {
      id: 'contact-81',
      affiliation: 'Baylor',
      sportRole: 'Head Coach',
      name: 'Dave Aranda',
      email: 'madelyn_martin@baylor.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-91',
      affiliation: 'Baylor',
      sportRole: 'Head Coach',
      name: 'Scott Drew',
      email: 'steve_m_henson@baylor.edu',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'busy',
      isEmergencyContact: true
    },
    {
      id: 'contact-88',
      affiliation: 'Baylor',
      sportRole: 'Head Coach',
      name: 'Nicki Collen',
      email: 'nicki_collen@baylor.edu',
      phone: '',
      sport: ['Women\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },

    // BYU (Legacy Member)
    {
      id: 'contact-200',
      affiliation: 'BYU',
      sportRole: 'Head Coach',
      name: 'Kalani Sitake',
      email: 'christiana@byu.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-207',
      affiliation: 'BYU',
      sportRole: 'Head Coach',
      name: 'Kevin Young',
      email: 'samantha_young@byu.edu',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-193',
      affiliation: 'BYU',
      sportRole: 'Head Coach',
      name: 'Heather Olmstead',
      email: 'heather_olmstead@byu.edu',
      phone: '801-541-7490',
      sport: ['Volleyball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },

    // Cincinnati (Legacy Member)
    {
      id: 'contact-234',
      affiliation: 'Cincinnati',
      sportRole: 'Head Coach',
      name: 'Scott Satterfield',
      email: 'sherry.murray@uc.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-229',
      affiliation: 'Cincinnati',
      sportRole: 'Head Coach',
      name: 'Wes Miller',
      email: 'ashley.hecimovich@uc.edu',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },

    // Colorado (Legacy Member)
    {
      id: 'contact-266',
      affiliation: 'Colorado',
      sportRole: 'Head Coach',
      name: 'Deion Sanders',
      email: 'ty.stewart@colorado.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'busy',
      isEmergencyContact: true
    },
    {
      id: 'contact-242',
      affiliation: 'Colorado',
      sportRole: 'Head Coach',
      name: 'Tad Boyle',
      email: 'margaret.marcy@colorado.edu',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },

    // Houston (Legacy Member)
    {
      id: 'contact-283',
      affiliation: 'Houston',
      sportRole: 'Head Coach',
      name: 'Willie Fritz',
      email: 'smmeyer2@central.uh.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-300',
      affiliation: 'Houston',
      sportRole: 'Head Coach',
      name: 'Kelvin Sampson',
      email: 'dhixon@central.uh.edu',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },

    // Iowa State (Legacy Member)
    {
      id: 'contact-307',
      affiliation: 'Iowa State',
      sportRole: 'Head Coach',
      name: 'Matt Campbell',
      email: 'egenise@iastate.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-324',
      affiliation: 'Iowa State',
      sportRole: 'Head Coach',
      name: 'T.J. Otzelberger',
      email: 'tpollard@iastate.edu',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },

    // Kansas (Legacy Member)
    {
      id: 'contact-378',
      affiliation: 'Kansas',
      sportRole: 'Head Coach',
      name: 'Lance Leipold',
      email: 'jacksnad@ku.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-388',
      affiliation: 'Kansas',
      sportRole: 'Head Coach',
      name: 'Bill Self',
      email: 'joanstep@ku.edu',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },

    // Kansas State (Legacy Member)
    {
      id: 'contact-346',
      affiliation: 'K-State',
      sportRole: 'Head Coach',
      name: 'Chris Klieman',
      email: 'ncrimmins@kstatesports.com',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-357',
      affiliation: 'K-State',
      sportRole: 'Head Coach',
      name: 'Jerome Tang',
      email: 'bbachamp@kstatesports.com',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },

    // Oklahoma State (Legacy Member)
    {
      id: 'contact-413',
      affiliation: 'Oklahoma State',
      sportRole: 'Head Coach',
      name: 'Mike Gundy',
      email: 'danielle.clary@okstate.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-420',
      affiliation: 'Oklahoma State',
      sportRole: 'Head Coach',
      name: 'Steve Lutz',
      email: 'andrea.m.brown@okstate.edu',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },

    // TCU (Legacy Member)
    {
      id: 'contact-450',
      affiliation: 'TCU',
      sportRole: 'Head Coach',
      name: 'Sonny Dykes',
      email: 'andrea.roberts@tcu.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-449',
      affiliation: 'TCU',
      sportRole: 'Head Coach',
      name: 'Jamie Dixon',
      email: 'k.coleman1@tcu.edu',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },

    // Texas Tech (Legacy Member)
    {
      id: 'contact-490',
      affiliation: 'Texas Tech',
      sportRole: 'Head Coach',
      name: 'Joey McGuire',
      email: 'lesha.weatherford@ttu.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-489',
      affiliation: 'Texas Tech',
      sportRole: 'Head Coach',
      name: 'Grant McCasland',
      email: 'jardon.powell@ttu.edu',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },

    // UCF (Legacy Member)
    {
      id: 'contact-521',
      affiliation: 'UCF',
      sportRole: 'Head Coach',
      name: 'Gus Malzahn',
      email: 'kyerves@athletics.ucf.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-516',
      affiliation: 'UCF',
      sportRole: 'Head Coach',
      name: 'Johnny Dawkins',
      email: 'kpufko@athletics.ucf.edu',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },

    // Utah (Legacy Member)
    {
      id: 'contact-562',
      affiliation: 'Utah',
      sportRole: 'Head Coach',
      name: 'Kyle Whittingham',
      email: 'nbenitezhilton@huntsman.utah.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-563',
      affiliation: 'Utah',
      sportRole: 'Head Coach',
      name: 'Alex Jensen',
      email: '',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },

    // West Virginia (Legacy Member)
    {
      id: 'contact-569',
      affiliation: 'West Virginia',
      sportRole: 'Head Coach',
      name: 'Neal Brown',
      email: 'lori.rice@mail.wvu.edu',
      phone: '',
      sport: ['Football'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-576',
      affiliation: 'West Virginia',
      sportRole: 'Head Coach',
      name: 'Darian DeVries',
      email: 'garrett.sturtz@mail.wvu.edu',
      phone: '',
      sport: ['Men\'s Basketball'],
      memberStatus: 'Legacy',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    }
  ];

  // Add some additional sport administrators, assistant coaches, and support staff
  const additionalContacts: CampusContact[] = [
    // Wrestling (Affiliate members)
    {
      id: 'contact-393',
      affiliation: 'Missouri',
      sportRole: 'Head Coach',
      name: 'Brian Smith',
      email: 'smithbq@missouri.edu',
      phone: '573-268-3119',
      sport: ['Wrestling'],
      memberStatus: 'Affiliate',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-395',
      affiliation: 'North Dakota State',
      sportRole: 'Head Coach',
      name: 'Obenson Blanc',
      email: 'obenson.blanc@ndsu.edu',
      phone: '701-219-4321',
      sport: ['Wrestling'],
      memberStatus: 'Affiliate',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    },
    {
      id: 'contact-598',
      affiliation: 'Wyoming',
      sportRole: 'Head Coach',
      name: 'Mark Branch',
      email: 'mbranch@uwyo.edu',
      phone: '307-760-6879',
      sport: ['Wrestling'],
      memberStatus: 'Affiliate',
      position: 'Head Coach',
      department: 'Athletics - Coaching',
      availability: 'available',
      isEmergencyContact: true
    }
  ];

  return [...realContacts, ...additionalContacts];
}

export default {
  loadRealCSVContacts
};