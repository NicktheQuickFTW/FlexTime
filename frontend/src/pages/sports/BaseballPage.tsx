import React from 'react';
import SportPage from './SportPage';

/**
 * Baseball Sport Page (sport_id: 1)
 * Code: BSB
 * Gender: Men's
 * Season: Spring
 * Teams: 14
 * Championship: Tournament (Arlington, TX)
 */
const BaseballPage: React.FC = () => {
  return <SportPage sportId={1} />;
};

export default BaseballPage;