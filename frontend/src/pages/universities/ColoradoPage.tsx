import React from 'react';
import SchoolPage from './UniversityPage';

/**
 * University of Colorado Page (school_id: 7)
 * Official Name: University of Colorado
 * Mascot: Buffaloes (Ralphie)
 * Colors: Gold (#CFB87C) & Black (#000000)
 * Location: Boulder, Colorado
 */
const ColoradoPage: React.FC = () => {
  return <SchoolPage schoolId={7} />;
};

export default ColoradoPage;