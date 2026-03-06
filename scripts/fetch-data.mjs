/**
 * RSC Data Fetcher
 * Run: node scripts/fetch-data.mjs
 * Fetches all data from Google Sheets and RSC API, saves as JSON.
 */
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../rsc-website/src/data');

const STANDINGS_SHEET = '15CULaegoEMXK_X9NFCJ7ChlDI2e-cy9ZRHcqcxL4I4I';
const STATS_SHEET = '1aJ3H1mEcOCzNJXXzPLhmZS1C7m824b4Jphnmfj62z2I';
const CONTRACTS_SHEET = '1bqmviA6pfWXuM3S5huG7KNwsv9ENvelW9Im4q_4AMRM';
const TIERS = ['Premier', 'Master', 'Elite', 'Veteran', 'Rival', 'Challenger', 'Prospect', 'Contender', 'Amateur'];

// ─── HTTP helpers ───────────────────────────────────────────────────────────

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchText(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// ─── CSV Parser ──────────────────────────────────────────────────────────────

function parseCSV(text) {
  const rows = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const row = [];
    let inQuote = false, cur = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        row.push(cur.trim()); cur = '';
      } else {
        cur += ch;
      }
    }
    row.push(cur.trim());
    rows.push(row);
  }
  return rows;
}

function gvizURL(sheetId, tabName) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
}

function exportURL(sheetId) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
}

// ─── Standings Parser ────────────────────────────────────────────────────────

function parseStandingsTab(rows) {
  const teams = [];
  // Find the data header row (contains "Team" in col 4)
  let dataStart = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][4] === 'Team') { dataStart = i + 1; break; }
  }
  if (dataStart === -1) return teams;

  for (let i = dataStart; i < rows.length; i++) {
    const r = rows[i];
    const name = r[4];
    // Skip empty rows, section headers, and playoff hunt sections
    if (!name || name.includes('Conference') || name.includes('Hunt') || name.includes('Team') || name.length > 40) continue;
    // Skip the bottom summary row (usually just a count number)
    if (!isNaN(Number(name)) && Number(name) < 100) continue;

    const team = {
      name,
      conference: r[5] || '',
      division: r[6] || '',
      overallRank: r[7] ? parseInt(r[7]) || null : null,
      wp: r[8] ? parseFloat(r[8]) : null,
      w: r[9] ? parseInt(r[9]) : null,
      l: r[10] ? parseInt(r[10]) : null,
      gb: r[11] || '--',
      confRank: r[12] ? parseInt(r[12]) || null : null,
      confWp: r[13] ? parseFloat(r[13]) : null,
      confW: r[14] ? parseInt(r[14]) : null,
      confL: r[15] ? parseInt(r[15]) : null,
      confGb: r[16] || '--',
      divRank: r[17] ? parseInt(r[17]) || null : null,
      divWp: r[18] ? parseFloat(r[18]) : null,
      divW: r[19] ? parseInt(r[19]) : null,
      divL: r[20] ? parseInt(r[20]) : null,
      divGb: r[21] || '--',
      last20: r[30] || '',
      roster: [r[33], r[34], r[35], r[36]].filter(Boolean),
    };
    // Dedup by name (conference sub-tables repeat teams)
    if (!teams.find(t => t.name === name)) {
      teams.push(team);
    }
  }
  return teams;
}

// ─── SNR (Schedule) Parser ───────────────────────────────────────────────────

function parseSNR(rows) {
  const matchDays = [];
  let currentDay = null;
  let currentDate = '';

  for (const row of rows) {
    // Match day header: col 2 starts with "Match Day" or "SEMIFINALS"/"FINALS"
    const col2 = row[2] || '';
    const col5 = row[5] || '';

    // Detect match day headers (col 2 says "Match Day - N" or "SEMIFINALS"/"FINALS")
    if (col2.startsWith('Match Day') || col2 === 'SEMIFINALS' || col2 === 'FINALS') {
      currentDay = { label: col2, date: col5, games: [] };
      matchDays.push(currentDay);
    }
    // Also detect if 2nd match day in same row (col 11)
    const col11 = row[11] || '';
    const col14 = row[14] || '';
    if (col11.startsWith('Match Day') || col11 === 'SEMIFINALS' || col11 === 'FINALS') {
      const day2 = { label: col11, date: col14, games: [] };
      matchDays.push(day2);
    }
    const col20 = row[20] || '';
    const col23 = row[23] || '';
    if (col20.startsWith('Match Day') || col20 === 'SEMIFINALS' || col20 === 'FINALS') {
      const day3 = { label: col20, date: col23, games: [] };
      matchDays.push(day3);
    }

    // Detect game rows (col 4 is team name, col 5 is score, col 6 is team name)
    const away1 = row[4] || '';
    const score1 = row[5] || '';
    const home1 = row[6] || '';
    if (away1 && home1 && away1 !== 'AWAY' && home1 !== 'HOME') {
      // Find the most recent match day for this column group
      const day = findMostRecentDay(matchDays, 0);
      if (day) {
        const [awayScore, homeScore] = score1 ? score1.split('-').map(Number) : [null, null];
        day.games.push({ away: away1, home: home1, awayScore, homeScore, played: !!score1 });
      }
    }

    const away2 = row[13] || '';
    const score2 = row[14] || '';
    const home2 = row[15] || '';
    if (away2 && home2 && away2 !== 'AWAY' && home2 !== 'HOME') {
      const day = findMostRecentDay(matchDays, 1);
      if (day) {
        const [awayScore, homeScore] = score2 ? score2.split('-').map(Number) : [null, null];
        day.games.push({ away: away2, home: home2, awayScore, homeScore, played: !!score2 });
      }
    }

    const away3 = row[22] || '';
    const score3 = row[23] || '';
    const home3 = row[24] || '';
    if (away3 && home3 && away3 !== 'AWAY' && home3 !== 'HOME') {
      const day = findMostRecentDay(matchDays, 2);
      if (day) {
        const [awayScore, homeScore] = score3 ? score3.split('-').map(Number) : [null, null];
        day.games.push({ away: away3, home: home3, awayScore, homeScore, played: !!score3 });
      }
    }
  }

  return matchDays.filter(d => d.label.startsWith('Match Day') || d.label === 'SEMIFINALS' || d.label === 'FINALS');
}

function findMostRecentDay(matchDays, groupIndex) {
  // Find the last match day added that corresponds to this column group
  // Column group 0 = first 3 cols block, 1 = second, 2 = third
  // The match days are pushed in order, so we count backwards to find the right one
  for (let i = matchDays.length - 1; i >= 0; i--) {
    // Simple approach: pick the last pushed day since we process rows in order
    return matchDays[i];
  }
  return null;
}

// Better SNR parser that correctly handles the 3-column grid layout
function parseSNRBetter(rows) {
  // The SNR sheet lays out 3 match days per row group
  // Col 2 = MD label col 1; Col 11 = MD label col 2; Col 20 = MD label col 3
  // Col 4-6 = away/score/home for group 1; Col 13-15 = group 2; Col 22-24 = group 3

  const matchDayMap = {}; // label -> { label, date, games[] }

  for (const row of rows) {
    // Check each of the 3 column groups for a match day header
    const groups = [
      { labelCol: 2, dateCol: 5, awayCol: 4, scoreCol: 5, homeCol: 6 },
      { labelCol: 11, dateCol: 14, awayCol: 13, scoreCol: 14, homeCol: 15 },
      { labelCol: 20, dateCol: 23, awayCol: 22, scoreCol: 23, homeCol: 24 },
    ];

    for (const g of groups) {
      const label = row[g.labelCol] || '';
      if (label.startsWith('Match Day') || label === 'SEMIFINALS' || label === 'FINALS') {
        const date = row[g.dateCol] || '';
        if (!matchDayMap[label]) {
          matchDayMap[label] = { label, date, games: [] };
        }
      }
    }

    // Now parse game rows for each group
    // We need to know which match day each game belongs to
    // We'll track the "current" match day for each column group
  }

  // Re-parse: track current MD for each column group
  const currentMD = [null, null, null];
  const colGroups = [
    { labelCol: 2, dateCol: 5, awayCol: 4, scoreCol: 5, homeCol: 6 },
    { labelCol: 11, dateCol: 14, awayCol: 13, scoreCol: 14, homeCol: 15 },
    { labelCol: 20, dateCol: 23, awayCol: 22, scoreCol: 23, homeCol: 24 },
  ];

  const matchDayMap2 = {};

  for (const row of rows) {
    for (let gi = 0; gi < 3; gi++) {
      const g = colGroups[gi];
      const label = row[g.labelCol] || '';

      if (label.startsWith('Match Day') || label === 'SEMIFINALS' || label === 'FINALS') {
        if (!matchDayMap2[label]) {
          const dateCol = gi === 0 ? 5 : gi === 1 ? 14 : 23;
          matchDayMap2[label] = { label, date: row[dateCol] || '', games: [] };
        }
        currentMD[gi] = label;
      } else {
        // Check if this is a game row (away/score/home)
        const awayCol = gi === 0 ? 4 : gi === 1 ? 13 : 22;
        const scoreCol = gi === 0 ? 5 : gi === 1 ? 14 : 23;
        const homeCol = gi === 0 ? 6 : gi === 1 ? 15 : 24;

        const away = row[awayCol] || '';
        const score = row[scoreCol] || '';
        const home = row[homeCol] || '';

        if (away && home && away !== 'AWAY' && home !== 'HOME' && currentMD[gi]) {
          const parts = score ? score.split('-') : [];
          const awayScore = parts.length === 2 ? parseInt(parts[0]) : null;
          const homeScore = parts.length === 2 ? parseInt(parts[1]) : null;
          matchDayMap2[currentMD[gi]].games.push({
            away, home, awayScore, homeScore, played: parts.length === 2
          });
        }
      }
    }
  }

  // Sort match days
  const sorted = Object.values(matchDayMap2).sort((a, b) => {
    const numA = parseInt(a.label.replace('Match Day - ', '')) || 999;
    const numB = parseInt(b.label.replace('Match Day - ', '')) || 999;
    return numA - numB;
  });

  return sorted;
}

// ─── Robust CSV parser (handles multi-line quoted fields) ────────────────────

function parseCSVRobust(text) {
  const rows = [];
  let row = [], cur = '', inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuote && text[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === '\n' && !inQuote) {
      row.push(cur.trim()); rows.push(row); row = []; cur = '';
    } else if (ch === ',' && !inQuote) {
      row.push(cur.trim()); cur = '';
    } else if (ch !== '\r') {
      cur += ch;
    }
  }
  if (cur.trim() || row.length) { row.push(cur.trim()); rows.push(row); }
  return rows;
}

// ─── RPV Parser ───────────────────────────────────────────────────────────────

function parseRPV(text) {
  // Sheet layout: rows 0-1 are metadata, row 2 is headers
  // Data cols: 0=Tier, 1=RSC ID, 2=Name, 3=Team, 4=Conference, 5=RPV
  const rows = parseCSVRobust(text);
  const rpvMap = {}; // RSC ID → RPV value
  for (const row of rows.slice(3)) {
    const rscId = row[1];
    const rpv = row[5];
    if (rscId && rscId.startsWith('RSC') && rpv && !isNaN(parseFloat(rpv))) {
      rpvMap[rscId] = parseFloat(rpv);
    }
  }
  return rpvMap;
}

// ─── Stats Parser ─────────────────────────────────────────────────────────────

function parseStats(rows) {
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = row[i] || ''; });
    return obj;
  }).filter(r => r['Name'] || r['Player']);
}

// ─── Contracts Parser ─────────────────────────────────────────────────────────

function parseContracts(rows) {
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = row[i] || ''; });
    return obj;
  }).filter(r => r['Player Name'] || r['RSC ID']);
}

// ─── Franchise Standings Parser ───────────────────────────────────────────────

function parseFranchiseStandings(rows) {
  const franchises = [];
  let headerFound = false;

  for (const row of rows) {
    // Header row has "Franchise" or "Franchise " in col 1
    if (row[1] && row[1].trim() === 'Franchise') { headerFound = true; continue; }
    if (!headerFound) continue;
    if (!row[1] || row[1].trim() === 'Franchise') continue;

    const f = {
      name: row[1].trim(),
      gm: row[2].trim(),
      conference: row[3].trim(),
      overallRank: parseInt(row[4]) || null,
      franchiseScore: parseFloat(row[5]) || null,
      teams: parseInt(row[6]) || null,
      seasonWP: parseFloat(row[8]) || null,
      seasonW: parseInt(row[9]) || null,
      seasonL: parseInt(row[10]) || null,
      playoffTeams: parseInt(row[20]) || 0,
    };

    // Parse per-tier data
    const tierMap = { Premier: 22, Master: 29, Elite: 36, Veteran: 43, Rival: 50, Challenger: 57, Prospect: 64, Contender: 71, Amateur: 78 };
    f.tierStandings = {};
    for (const [tier, startCol] of Object.entries(tierMap)) {
      if (row[startCol + 1]) {
        f.tierStandings[tier] = {
          team: row[startCol].trim(),
          rank: parseInt(row[startCol + 1]) || null,
          wp: parseFloat(row[startCol + 2]) || null,
          w: parseInt(row[startCol + 3]) || null,
          l: parseInt(row[startCol + 4]) || null,
          playoffs: row[startCol + 5] === 'In' ? 'In' : 'Out',
        };
      }
    }

    if (f.name) franchises.push(f);
  }
  return franchises;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Creating data directory...');
  await mkdir(DATA_DIR, { recursive: true });

  // 1. Fetch standings for all tiers
  console.log('Fetching tier standings...');
  const allStandings = {};
  for (const tier of TIERS) {
    const csv = await fetchText(gvizURL(STANDINGS_SHEET, tier));
    const rows = parseCSV(csv);
    allStandings[tier] = parseStandingsTab(rows);
    console.log(`  ${tier}: ${allStandings[tier].length} teams`);
  }
  await writeFile(path.join(DATA_DIR, 'standings.json'), JSON.stringify(allStandings, null, 2));

  // 3. Fetch schedule/scores for all tiers (SNR tabs)
  console.log('Fetching schedules...');
  const allSchedules = {};
  for (const tier of TIERS) {
    const csv = await fetchText(gvizURL(STANDINGS_SHEET, `${tier} SNR`));
    const rows = parseCSV(csv);
    allSchedules[tier] = parseSNRBetter(rows);
    const totalGames = allSchedules[tier].reduce((s, d) => s + d.games.length, 0);
    console.log(`  ${tier} SNR: ${allSchedules[tier].length} match days, ${totalGames} games`);
  }
  await writeFile(path.join(DATA_DIR, 'schedules.json'), JSON.stringify(allSchedules, null, 2));

  // 4. Fetch stats + RPV, merge together
  console.log('Fetching player stats...');
  const statsCsv = await fetchText(gvizURL(STATS_SHEET, 'Stats'));
  const statsRows = parseCSVRobust(statsCsv);
  const stats = parseStats(statsRows);

  console.log('Fetching RPV data...');
  const rpvCsv = await fetchText(gvizURL(STATS_SHEET, 'Sorted RPV'));
  const rpvMap = parseRPV(rpvCsv);
  console.log(`  RPV records: ${Object.keys(rpvMap).length}`);

  // Merge RPV into stats by RSC ID
  const statsWithRPV = stats.map(s => ({
    ...s,
    RPV: s['RSC ID'] && rpvMap[s['RSC ID']] != null ? rpvMap[s['RSC ID']].toFixed(2) : '',
  }));

  // Only overwrite stats.json if we got real data (prevent wiping with empty sheet)
  if (statsWithRPV.length > 0) {
    await writeFile(path.join(DATA_DIR, 'stats.json'), JSON.stringify(statsWithRPV, null, 2));
    console.log(`  Saved ${statsWithRPV.length} player stat records (with RPV)`);
  } else {
    console.log(`  Stats sheet has no data yet — keeping existing stats.json`);
  }

  // 5. Fetch contracts (use gviz default first sheet)
  console.log('Fetching contracts...');
  const contractsCsv = await fetchText(gvizURL(CONTRACTS_SHEET, 'Contracts'));
  const contractRows = parseCSV(contractsCsv);
  const contracts = parseContracts(contractRows);
  await writeFile(path.join(DATA_DIR, 'contracts.json'), JSON.stringify(contracts, null, 2));
  console.log(`  Saved ${contracts.length} contracts`);

  // 6. Fetch franchise standings
  console.log('Fetching franchise standings...');
  const fsCsv = await fetchText(gvizURL(STANDINGS_SHEET, 'Franchise Standings'));
  const fsRows = parseCSV(fsCsv);
  const franchiseStandings = parseFranchiseStandings(fsRows);
  await writeFile(path.join(DATA_DIR, 'franchise-standings.json'), JSON.stringify(franchiseStandings, null, 2));
  console.log(`  Saved ${franchiseStandings.length} franchise standings`);

  console.log('\nAll data fetched successfully!');
}

main().catch(e => { console.error(e); process.exit(1); });
