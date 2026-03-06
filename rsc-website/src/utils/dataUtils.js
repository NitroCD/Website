// Tier order (top to bottom, strongest to weakest)
export const TIERS = ['Premier', 'Master', 'Elite', 'Veteran', 'Rival', 'Challenger', 'Prospect', 'Contender', 'Amateur'];

export const TIER_COLORS = {
  Premier:    '#e879f9',
  Master:     '#a855f7',
  Elite:      '#3b82f6',
  Veteran:    '#2dd4bf',
  Rival:      '#22c55e',
  Challenger: '#d97706',
  Prospect:   '#f97316',
  Contender:  '#ec4899',
  Amateur:    '#fda4af',
};

export function getTierIcon(tier) {
  return `/images/tiers/${tier.toLowerCase()}.png`;
}

// Playoff cutoff rules per tier
export const PLAYOFF_CUTOFF = {
  Premier:    { type: 'overall',    count: 4 },
  Master:     { type: 'overall',    count: 8 },
  Elite:      { type: 'conference', count: 8 },
  Veteran:    { type: 'conference', count: 8 },
  Rival:      { type: 'conference', count: 8 },
  Challenger: { type: 'conference', count: 8 },
  Prospect:   { type: 'conference', count: 6 },
  Contender:  { type: 'overall',    count: 8 },
  Amateur:    { type: 'overall',    count: 4 },
};

// Free agent contract statuses
export const FA_STATUSES = new Set([
  'Free Agent', 'Permanent Free Agent', 'Perm FA in Waiting.', 'Dropped', 'Former',
]);

export function toSlug(name) {
  return name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '';
}

export function fromSlug(slug) {
  // We'll match against known names
  return slug;
}

export function tierFromSlug(slug) {
  return TIERS.find(t => toSlug(t) === slug) || slug;
}

// Build a lookup of team name -> franchise
export function buildTeamLookup(franchises) {
  const map = {};
  for (const f of franchises) {
    for (const team of f.teams || []) {
      map[team.name] = { ...team, franchise: f };
    }
  }
  return map;
}

// Build player lookup by name and RSC ID
export function buildPlayerLookup(contracts, stats) {
  const byName = {};
  const byId = {};
  for (const c of contracts) {
    const key = c['Player Name']?.toLowerCase();
    if (key) byName[key] = c;
    if (c['RSC ID']) byId[c['RSC ID']] = c;
  }
  return { byName, byId };
}

// Get teams for a tier from standings
export function getTeamsForTier(standings, tier) {
  return standings[tier] || [];
}

// Get all players in a tier from contracts
export function getPlayersForTier(contracts, tier) {
  return contracts.filter(c => c['Tier'] === tier && c['Contract Status'] !== '');
}

// Get players for a specific team
export function getPlayersForTeam(contracts, teamName) {
  return contracts.filter(c => c['Team'] === teamName);
}

// Get stats for a tier
export function getStatsForTier(stats, tier) {
  return stats.filter(s => s['Tier'] === tier);
}

// Get stats for a specific team
export function getStatsForTeam(stats, teamName) {
  return stats.filter(s => {
    const teams = s['Team'] || '';
    return teams.split(/[,\/]/).map(t => t.trim()).includes(teamName);
  });
}

// Get stats for a player
export function getStatsForPlayer(stats, playerName) {
  return stats.filter(s => s['Name']?.toLowerCase() === playerName?.toLowerCase());
}

// Format win percentage
export function formatWP(wp) {
  if (wp === null || wp === undefined || wp === '') return '—';
  const n = parseFloat(wp);
  return isNaN(n) ? '—' : n.toFixed(3).replace(/^0/, '');
}

// Format a stat number
export function formatStat(val, decimals = 2) {
  if (val === null || val === undefined || val === '') return '—';
  const n = parseFloat(val);
  return isNaN(n) ? '—' : decimals === 0 ? Math.round(n).toString() : n.toFixed(decimals);
}

// Find franchise by team name
export function getFranchiseForTeam(franchises, teamName) {
  return franchises.find(f => f.teams?.some(t => t.name === teamName));
}

// Get a franchise's logo path (locally stored)
export function getFranchiseLogo(franchise) {
  if (!franchise) return null;
  return `/images/franchises/${toSlug(franchise.name)}.png`;
}

// Get conference color
export function getConferenceColor(conf) {
  if (!conf) return '#94a3b8';
  const lower = conf.toLowerCase();
  if (lower.includes('solar')) return '#f59e0b';
  if (lower.includes('lunar')) return '#818cf8';
  return '#94a3b8';
}

// Derive playoff status from standings data or franchise standings
export function isInPlayoffs(teamName, tier, franchiseStandings) {
  for (const f of franchiseStandings) {
    const ts = f.tierStandings?.[tier];
    if (ts?.team === teamName) return ts.playoffs === 'In';
  }
  return false;
}

// Sort standings by overall rank or WP
export function sortStandings(teams) {
  return [...teams].sort((a, b) => {
    const rankA = a.overallRank || 999;
    const rankB = b.overallRank || 999;
    return rankA - rankB;
  });
}

// Group standings by conference
export function groupByConference(teams) {
  const groups = {};
  for (const t of teams) {
    const conf = t.conference || 'N/A';
    if (!groups[conf]) groups[conf] = [];
    groups[conf].push(t);
  }
  return groups;
}

// Compute team record from schedule
export function computeTeamRecord(schedule, teamName) {
  let w = 0, l = 0;
  for (const day of schedule) {
    for (const game of day.games) {
      if (!game.played) continue;
      if (game.away === teamName) {
        if (game.awayScore > game.homeScore) w++;
        else if (game.awayScore < game.homeScore) l++;
        // ties don't really happen (best of 4 can tie 2-2 = counts as loss in standings?)
      } else if (game.home === teamName) {
        if (game.homeScore > game.awayScore) w++;
        else if (game.homeScore < game.awayScore) l++;
      }
    }
  }
  return { w, l };
}
