import React from 'react';
import SchoolPage from './UniversityPage';

/**
 * University of Arizona Page (school_id: 1)
 * Official Name: The University of Arizona
 * Mascot: Wildcats (Wilbur & Wilma)
 * Colors: Cardinal Red (#AB0520) & Navy Blue (#0C234B)
 * Location: Tucson, Arizona
 */
const ArizonaPage: React.FC = () => {
  return <SchoolPage schoolId={1} />;
};

export default ArizonaPage;