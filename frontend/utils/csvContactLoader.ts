/**
 * CSV Contact Loader Utility
 * 
 * Loads and parses campus contacts from the XII Conference Contacts CSV file
 * Converts CSV data into CampusContact interface format
 */

import { CampusContact } from '@/services/campusContactsService';

interface CSVContactRow {
  Affiliation: string;
  'Sport Role': string;
  Name: string;
  'E-Mail': string;
  Phone: string;
  Sport: string;
  'Member Status': string;
}

/**
 * Parse CSV content into contact objects
 */
export function parseCSVContacts(csvContent: string): CampusContact[] {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const contacts: CampusContact[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line handling quoted values
    const values = parseCSVLine(line);
    if (values.length < headers.length) continue;
    
    const rowData: any = {};
    headers.forEach((header, index) => {
      rowData[header] = values[index] || '';
    });
    
    // Convert to CampusContact format
    const contact = convertRowToContact(rowData, i);
    if (contact) {
      contacts.push(contact);
    }
  }
  
  return contacts;
}

/**
 * Parse a single CSV line handling quoted values and commas within quotes
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last value
  values.push(current.trim());
  
  return values;
}

/**
 * Convert CSV row data to CampusContact object
 */
function convertRowToContact(row: any, index: number): CampusContact | null {
  const name = row.Name?.trim();
  const affiliation = row.Affiliation?.trim();
  
  if (!name || !affiliation) {
    return null; // Skip incomplete records
  }
  
  // Parse sports into array
  const sportsString = row.Sport || '';
  const sports = sportsString
    .split(',')
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);
  
  // Clean phone number
  const phone = cleanPhoneNumber(row.Phone || '');
  
  // Clean email
  const email = (row['E-Mail'] || '').trim().toLowerCase();
  
  // Determine member status
  const memberStatus = row['Member Status']?.trim() === 'Legacy' ? 'Legacy' : 'Affiliate';
  
  // Determine availability (random for now, could be enhanced)
  const availability = getAvailabilityStatus();
  
  // Determine if emergency contact
  const isEmergencyContact = isEmergencyRole(row['Sport Role'] || '');
  
  return {
    id: `contact-${index}`,
    affiliation,
    sportRole: row['Sport Role']?.trim() || 'Staff',
    name,
    email,
    phone,
    sport: sports,
    memberStatus,
    position: row['Sport Role']?.trim(),
    department: getDepartmentFromRole(row['Sport Role'] || ''),
    availability,
    isEmergencyContact
  };
}

/**
 * Clean and format phone number
 */
function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove common non-digit characters except +, -, (), and spaces
  let cleaned = phone.replace(/[^\d\-\(\)\+\s]/g, '');
  
  // If it's already formatted nicely, return as is
  if (/^\(\d{3}\)\s\d{3}-\d{4}$/.test(cleaned)) {
    return cleaned;
  }
  
  // Extract just digits
  const digits = cleaned.replace(/\D/g, '');
  
  // Format US phone numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  // Return original if can't parse
  return phone;
}

/**
 * Get random availability status with weighted distribution
 */
function getAvailabilityStatus(): 'available' | 'busy' | 'unavailable' {
  const random = Math.random();
  if (random < 0.6) return 'available';    // 60% available
  if (random < 0.9) return 'busy';         // 30% busy
  return 'unavailable';                    // 10% unavailable
}

/**
 * Determine if role is considered emergency contact
 */
function isEmergencyRole(role: string): boolean {
  const emergencyRoles = [
    'Commissioner',
    'Head Coach', 
    'Sport Administrator',
    'Director of Athletics',
    'Sport Liaison',
    'Athletics Director'
  ];
  
  return emergencyRoles.some(er => 
    role.toLowerCase().includes(er.toLowerCase())
  );
}

/**
 * Get department based on sport role
 */
function getDepartmentFromRole(role: string): string {
  const lowerRole = role.toLowerCase();
  
  if (lowerRole.includes('head coach') || lowerRole.includes('assistant coach')) {
    return 'Athletics - Coaching';
  }
  if (lowerRole.includes('sport administrator')) {
    return 'Athletics - Administration';
  }
  if (lowerRole.includes('director of operations')) {
    return 'Athletics - Operations';
  }
  if (lowerRole.includes('communications') || lowerRole.includes('media')) {
    return 'Athletics - Media Relations';
  }
  if (lowerRole.includes('game operations')) {
    return 'Athletics - Events';
  }
  if (lowerRole.includes('commissioner') || lowerRole.includes('liaison')) {
    return 'Conference Administration';
  }
  if (lowerRole.includes('video coordinator')) {
    return 'Athletics - Technology';
  }
  if (lowerRole.includes('director')) {
    return 'Athletics - Leadership';
  }
  
  return 'Athletics - General';
}

/**
 * Load contacts from CSV file
 * In a real implementation, this would read from the actual CSV file
 */
export async function loadContactsFromCSV(): Promise<CampusContact[]> {
  try {
    // In a real implementation, you would fetch the CSV file:
    // const response = await fetch('/path/to/XII Conference Contacts.csv');
    // const csvContent = await response.text();
    
    // For now, we'll use the sample data structure we know exists
    // This could be enhanced to actually read the file at:
    // /Users/nickw/Documents/GitHub/Flextime/docs/XII Conference Contacts 13779839c200819db58bd3f239672f9a_all.csv
    
    const sampleCSVContent = generateSampleCSVContent();
    return parseCSVContacts(sampleCSVContent);
  } catch (error) {
    console.error('Error loading contacts from CSV:', error);
    return [];
  }
}

/**
 * Generate sample CSV content based on the known structure
 * This represents the actual data structure from the CSV file
 */
function generateSampleCSVContent(): string {
  return `Affiliation,Sport Role,Name,E-Mail,Phone,Sport,Member Status
Big 12 Conference,Commissioner,Brett Yormark,byormark@big12sports.com,347-236-2121,,Legacy
Big 12 Conference,Sport Liaison,Scott Draper,sdraper@big12sports.com,214-409-4358,Football,Legacy
Big 12 Conference,Sport Liaison,Brian Thornton,bthornton@big12sports.com,803-448-5635,Men's Basketball,Legacy
Big 12 Conference,Sport Liaison,Dayna Scherf,dayna@big12sports.com,214-409-4356,"Gymnastics, Lacrosse, Rowing, Softball, Volleyball, Women's Basketball",Legacy
Big 12 Conference,Sport Liaison,Nick Williams,nwilliams@big12sports.com,317-966-6242,"Baseball, Cross Country, Men's Basketball, Men's Tennis, Swimming & Diving, Women's Tennis, Wrestling",Legacy
Arizona,Head Coach,Brent Brennan,aherink7@arizona.edu,,Football,Legacy
Arizona,Head Coach,Tommy Lloyd,eliasm@arizona.edu,,Men's Basketball,Legacy
Arizona,Sport Administrator,Desiree Reed-Francois,dreedfrancois@arizona.edu,,Football,Legacy
Arizona State,Head Coach,Kenny Dillingham,kenneth.dillingham@asu.edu,,Football,Legacy
Arizona State,Head Coach,Bobby Hurley,mmitch30@asu.edu,,Men's Basketball,Legacy
Arizona State,Head Coach,Zeke Jones,zeke.jones@asu.edu,719-659-1388,Wrestling,Legacy
Baylor,Head Coach,Dave Aranda,madelyn_martin@baylor.edu,,Football,Legacy
Baylor,Head Coach,Scott Drew,steve_m_henson@baylor.edu,,Men's Basketball,Legacy
Baylor,Head Coach,Nicki Collen,nicki_collen@baylor.edu,,Women's Basketball,Legacy
BYU,Head Coach,Kalani Sitake,christiana@byu.edu,,Football,Legacy
BYU,Head Coach,Kevin Young,samantha_young@byu.edu,,Men's Basketball,Legacy
BYU,Head Coach,Heather Olmstead,heather_olmstead@byu.edu,801-541-7490,Volleyball,Legacy
Cincinnati,Head Coach,Scott Satterfield,sherry.murray@uc.edu,,Football,Legacy
Cincinnati,Head Coach,Wes Miller,ashley.hecimovich@uc.edu,,Men's Basketball,Legacy
Colorado,Head Coach,Deion Sanders,ty.stewart@colorado.edu,,Football,Legacy
Colorado,Head Coach,Tad Boyle,margaret.marcy@colorado.edu,,Men's Basketball,Legacy
Houston,Head Coach,Willie Fritz,smmeyer2@central.uh.edu,,Football,Legacy
Houston,Head Coach,Kelvin Sampson,dhixon@central.uh.edu,,Men's Basketball,Legacy
Iowa State,Head Coach,Matt Campbell,egenise@iastate.edu,,Football,Legacy
Iowa State,Head Coach,T.J. Otzelberger,tpollard@iastate.edu,,Men's Basketball,Legacy
Kansas,Head Coach,Lance Leipold,jacksnad@ku.edu,,Football,Legacy
Kansas,Head Coach,Bill Self,joanstep@ku.edu,,Men's Basketball,Legacy
K-State,Head Coach,Chris Klieman,ncrimmins@kstatesports.com,,Football,Legacy
K-State,Head Coach,Jerome Tang,bbachamp@kstatesports.com,,Men's Basketball,Legacy
Oklahoma State,Head Coach,Mike Gundy,danielle.clary@okstate.edu,,Football,Legacy
Oklahoma State,Head Coach,Steve Lutz,andrea.m.brown@okstate.edu,,Men's Basketball,Legacy
TCU,Head Coach,Sonny Dykes,andrea.roberts@tcu.edu,,Football,Legacy
TCU,Head Coach,Jamie Dixon,k.coleman1@tcu.edu,,Men's Basketball,Legacy
Texas Tech,Head Coach,Joey McGuire,lesha.weatherford@ttu.edu,,Football,Legacy
Texas Tech,Head Coach,Grant McCasland,jardon.powell@ttu.edu,,Men's Basketball,Legacy
UCF,Head Coach,Gus Malzahn,kyerves@athletics.ucf.edu,,Football,Legacy
UCF,Head Coach,Johnny Dawkins,kpufko@athletics.ucf.edu,,Men's Basketball,Legacy
Utah,Head Coach,Kyle Whittingham,nbenitezhilton@huntsman.utah.edu,,Football,Legacy
Utah,Head Coach,Alex Jensen,,,Men's Basketball,Legacy
West Virginia,Head Coach,Neal Brown,lori.rice@mail.wvu.edu,,Football,Legacy
West Virginia,Head Coach,Darian DeVries,garrett.sturtz@mail.wvu.edu,,Men's Basketball,Legacy`;
}

export default {
  parseCSVContacts,
  loadContactsFromCSV,
  cleanPhoneNumber,
  getDepartmentFromRole,
  isEmergencyRole
};