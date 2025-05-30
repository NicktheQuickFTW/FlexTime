/**
 * Big 12 School Branding Type Definitions
 * Generated from official Big 12 branding CSV
 */

export interface SchoolColors {
  primary: string;
  secondary: string;
  tertiary?: string;
}

export interface School {
  officialName: string;
  displayName: string;
  abbreviations: string[];
  mascot: string;
  mascotNames: string[];
  colors: SchoolColors;
  hashtags: string[];
  unapprovedNames: string[];
}

export interface SchoolBrandingData {
  schools: School[];
  lastUpdated: string;
  source: string;
}

export const BIG12_SCHOOL_NAMES = [
  'University of Arizona',
  'Arizona State University',
  'Baylor University',
  'Brigham Young University',
  'University of Central Florida',
  'University of Cincinnati',
  'University of Colorado',
  'University of Houston',
  'Iowa State University',
  'University of Kansas',
  'Kansas State University',
  'Oklahoma State University',
  'Texas Christian University',
  'Texas Tech University',
  'University of Utah',
  'West Virginia University'
] as const;

export type Big12SchoolName = typeof BIG12_SCHOOL_NAMES[number];
