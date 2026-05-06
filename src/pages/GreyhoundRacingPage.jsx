import React from 'react';
import SportPageWithLayout from '../components/SportPage';

const greyhoundCompetitions = [
  'Greyhound Racing - Today’s Card', 'ANTEPOST'
];

const greyhoundCountries = ['Australia', 'United Kingdom', 'Ireland', 'United States', 'New Zealand'];

function GreyhoundRacingPage() {
  return (
    <SportPageWithLayout
      sport="Greyhound Racing"
      kvImage={null}
      competitions={greyhoundCompetitions}
      countries={greyhoundCountries}
    />
  );
}

export default GreyhoundRacingPage;
