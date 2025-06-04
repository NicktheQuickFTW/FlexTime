import React from 'react';
import SportPage from './SportPage';

/**
 * Lacrosse Sport Page (sport_id: 12)
 * Code: LAX
 * Gender: Women's
 * Season: Spring
 * Teams: 5
 * Championship: Tournament (Dallas, TX)
 */
const LacrossePage: React.FC = () => {
  return <SportPage sportId={12} />;
};

export default LacrossePage;