export interface Big12University {
  id: string;
  name: string;
  location: string;
  mascot: string;
  colors: {
    primary: string;
    secondary: string;
  };
  logo: string;
  founded: number;
  enrollment: number;
  conference: string;
}

export const big12Universities: Big12University[] = [
  {
    id: 'arizona',
    name: 'University of Arizona',
    location: 'Tucson, Arizona',
    mascot: 'Wildcats',
    colors: { primary: '#AB0520', secondary: '#0C234B' },
    logo: '/logos/arizona.png',
    founded: 1885,
    enrollment: 47000,
    conference: 'Big 12'
  },
  {
    id: 'arizona-state',
    name: 'Arizona State University',
    location: 'Tempe, Arizona',
    mascot: 'Sun Devils',
    colors: { primary: '#8C1D40', secondary: '#FFC627' },
    logo: '/logos/arizona-state.png',
    founded: 1885,
    enrollment: 80000,
    conference: 'Big 12'
  },
  {
    id: 'baylor',
    name: 'Baylor University',
    location: 'Waco, Texas',
    mascot: 'Bears',
    colors: { primary: '#003015', secondary: '#FFB81C' },
    logo: '/logos/baylor.png',
    founded: 1845,
    enrollment: 20000,
    conference: 'Big 12'
  },
  {
    id: 'byu',
    name: 'Brigham Young University',
    location: 'Provo, Utah',
    mascot: 'Cougars',
    colors: { primary: '#002E5D', secondary: '#FFFFFF' },
    logo: '/logos/byu.png',
    founded: 1875,
    enrollment: 33000,
    conference: 'Big 12'
  },
  {
    id: 'cincinnati',
    name: 'University of Cincinnati',
    location: 'Cincinnati, Ohio',
    mascot: 'Bearcats',
    colors: { primary: '#E00122', secondary: '#000000' },
    logo: '/logos/cincinnati.png',
    founded: 1819,
    enrollment: 46000,
    conference: 'Big 12'
  },
  {
    id: 'colorado',
    name: 'University of Colorado Boulder',
    location: 'Boulder, Colorado',
    mascot: 'Buffaloes',
    colors: { primary: '#CFB87C', secondary: '#000000' },
    logo: '/logos/colorado.png',
    founded: 1876,
    enrollment: 35000,
    conference: 'Big 12'
  },
  {
    id: 'houston',
    name: 'University of Houston',
    location: 'Houston, Texas',
    mascot: 'Cougars',
    colors: { primary: '#C8102E', secondary: '#FFFFFF' },
    logo: '/logos/houston.png',
    founded: 1927,
    enrollment: 47000,
    conference: 'Big 12'
  },
  {
    id: 'iowa-state',
    name: 'Iowa State University',
    location: 'Ames, Iowa',
    mascot: 'Cyclones',
    colors: { primary: '#C8102E', secondary: '#F1BE48' },
    logo: '/logos/iowa-state.png',
    founded: 1858,
    enrollment: 36000,
    conference: 'Big 12'
  },
  {
    id: 'kansas',
    name: 'University of Kansas',
    location: 'Lawrence, Kansas',
    mascot: 'Jayhawks',
    colors: { primary: '#0051BA', secondary: '#E8000D' },
    logo: '/logos/kansas.png',
    founded: 1865,
    enrollment: 28000,
    conference: 'Big 12'
  },
  {
    id: 'kansas-state',
    name: 'Kansas State University',
    location: 'Manhattan, Kansas',
    mascot: 'Wildcats',
    colors: { primary: '#512888', secondary: '#FFFFFF' },
    logo: '/logos/kansas-state.png',
    founded: 1863,
    enrollment: 24000,
    conference: 'Big 12'
  },
  {
    id: 'oklahoma-state',
    name: 'Oklahoma State University',
    location: 'Stillwater, Oklahoma',
    mascot: 'Cowboys',
    colors: { primary: '#FF7300', secondary: '#000000' },
    logo: '/logos/oklahoma-state.png',
    founded: 1890,
    enrollment: 25000,
    conference: 'Big 12'
  },
  {
    id: 'tcu',
    name: 'Texas Christian University',
    location: 'Fort Worth, Texas',
    mascot: 'Horned Frogs',
    colors: { primary: '#4D1979', secondary: '#A7A8AA' },
    logo: '/logos/tcu.png',
    founded: 1873,
    enrollment: 11000,
    conference: 'Big 12'
  },
  {
    id: 'texas-tech',
    name: 'Texas Tech University',
    location: 'Lubbock, Texas',
    mascot: 'Red Raiders',
    colors: { primary: '#CC0000', secondary: '#000000' },
    logo: '/logos/texas-tech.png',
    founded: 1923,
    enrollment: 40000,
    conference: 'Big 12'
  },
  {
    id: 'ucf',
    name: 'University of Central Florida',
    location: 'Orlando, Florida',
    mascot: 'Knights',
    colors: { primary: '#000000', secondary: '#FFC904' },
    logo: '/logos/ucf.png',
    founded: 1963,
    enrollment: 70000,
    conference: 'Big 12'
  },
  {
    id: 'utah',
    name: 'University of Utah',
    location: 'Salt Lake City, Utah',
    mascot: 'Utes',
    colors: { primary: '#CC0000', secondary: '#FFFFFF' },
    logo: '/logos/utah.png',
    founded: 1850,
    enrollment: 33000,
    conference: 'Big 12'
  },
  {
    id: 'west-virginia',
    name: 'West Virginia University',
    location: 'Morgantown, West Virginia',
    mascot: 'Mountaineers',
    colors: { primary: '#002855', secondary: '#EAAA00' },
    logo: '/logos/west-virginia.png',
    founded: 1867,
    enrollment: 26000,
    conference: 'Big 12'
  }
];

export default big12Universities;