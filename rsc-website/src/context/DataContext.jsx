import { createContext, useContext, useMemo } from 'react';

// Static JSON imports (bundled at build time) — all from Google Sheets
import standingsRaw from '../data/standings.json';
import schedulesRaw from '../data/schedules.json';
import statsRaw from '../data/stats.json';
import contractsRaw from '../data/contracts.json';
import franchiseStandingsRaw from '../data/franchise-standings.json';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  // Build franchise list entirely from sheets data (contracts + franchise-standings)
  const franchises = useMemo(() => {
    const franchiseMap = {};

    // Collect franchise names and their teams from the contracts sheet
    for (const c of contractsRaw) {
      const name = c['Franchise'];
      if (!name) continue;
      if (!franchiseMap[name]) franchiseMap[name] = { name, teams: new Set() };
      if (c['Team']) franchiseMap[name].teams.add(c['Team']);
    }

    // Add GM names from the franchise standings sheet tab
    for (const fs of franchiseStandingsRaw) {
      if (fs.name && franchiseMap[fs.name]) {
        franchiseMap[fs.name].gm = { rsc_name: fs.gm };
      }
    }

    return Object.values(franchiseMap)
      .map(f => ({ ...f, teams: [...f.teams].map(name => ({ name })) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const data = {
    franchises,
    standings: standingsRaw,
    schedules: schedulesRaw,
    stats: statsRaw,
    contracts: contractsRaw,
    franchiseStandings: franchiseStandingsRaw,
    loaded: true,
  };

  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
