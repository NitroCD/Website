import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { toSlug, getFranchiseLogo, getFranchiseForTeam, getStatsForTeam, TIER_COLORS, formatStat, formatWP } from '../utils/dataUtils';

const TOTALS_COLS = [
  { key: 'GP', label: 'GP', decimals: 0 },
  { key: 'W', label: 'W', decimals: 0 },
  { key: 'L', label: 'L', decimals: 0 },
  { key: 'Win%', label: 'WIN%', decimals: 3 },
  { key: 'Goals', label: 'G', decimals: 0 },
  { key: 'Assists', label: 'A', decimals: 0 },
  { key: 'Saves', label: 'SV', decimals: 0 },
  { key: 'Shots', label: 'SH', decimals: 0 },
  { key: 'DI', label: 'DI', decimals: 0 },
  { key: 'DT', label: 'DT', decimals: 0 },
  { key: 'RPV', label: 'RPV', decimals: 2 },
];

const PG_COLS = [
  { key: 'GP', label: 'GP', decimals: 0 },
  { key: 'Win%', label: 'WIN%', decimals: 3 },
  { key: 'PPG', label: 'PPG', decimals: 2 },
  { key: 'GPG', label: 'GPG', decimals: 2 },
  { key: 'APG', label: 'APG', decimals: 2 },
  { key: 'SvPG', label: 'SVPG', decimals: 2 },
  { key: 'ShPG', label: 'SHPG', decimals: 2 },
  { key: 'Shot %', label: 'SH%', decimals: 2 },
  { key: 'DI', label: 'DIPG', decimals: 2, perGame: true },
  { key: 'DT', label: 'DTPG', decimals: 2, perGame: true },
  { key: 'RPV', label: 'RPV', decimals: 2 },
];

function computeStat(player, key, perGame, colDef) {
  if (perGame && colDef?.perGame) {
    const gp = parseFloat(player['GP'] || 0);
    const raw = parseFloat(player[key] || 0);
    return gp > 0 ? raw / gp : 0;
  }
  return parseFloat(player[key] || 0);
}

const TABS = ['roster', 'stats', 'schedule'];

export default function TeamPage() {
  const { teamName, tab } = useParams();
  const { franchises, contracts, stats, schedules, standings } = useData();
  const navigate = useNavigate();

  // Find franchise that has this team
  const franchise = getFranchiseForTeam(franchises, null); // placeholder
  let teamDisplayName = null;
  let foundFranchise = null;
  for (const f of franchises) {
    const t = f.teams?.find(t => toSlug(t.name) === teamName);
    if (t) { teamDisplayName = t.name; foundFranchise = f; break; }
  }

  // If not found in franchises, try from contracts
  if (!teamDisplayName) {
    const c = contracts.find(c => toSlug(c['Team']) === teamName);
    if (c) teamDisplayName = c['Team'];
  }

  if (!teamDisplayName) {
    return <div className="text-center text-slate-400 py-20">Team not found.</div>;
  }

  // Get tier from contracts
  const tierName = contracts.find(c => c['Team'] === teamDisplayName)?.['Tier'] || '';
  const tierColor = TIER_COLORS[tierName] || '#0ea5e9';

  const activeTab = TABS.includes(tab) ? tab : 'roster';

  function setTab(t) {
    const base = `/team/${teamName}`;
    navigate(t === 'roster' ? base : `${base}/${t}`, { replace: true });
  }

  // Standings for this team
  const tierStandings = standings[tierName] || [];
  const teamStanding = tierStandings.find(s => s.name === teamDisplayName);

  // Players from contracts
  const players = contracts.filter(c =>
    c['Team'] === teamDisplayName && c['Player Name'] && c['Contract Status'] !== ''
  );

  // Stats
  const teamStats = getStatsForTeam(stats, teamDisplayName);

  // Schedule for this team
  const tierSchedule = schedules[tierName] || [];
  const teamSchedule = tierSchedule.map(day => ({
    ...day,
    games: day.games.filter(g => g.away === teamDisplayName || g.home === teamDisplayName)
  })).filter(d => d.games.length > 0);

  return (
    <div>
      {/* Team Header */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div className="flex items-start gap-4">
          {foundFranchise && (
            <img
              src={getFranchiseLogo(foundFranchise)}
              alt=""
              style={{ width: 64, height: 64, objectFit: 'contain' }}
              onError={e => e.target.style.display = 'none'}
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{teamDisplayName}</h1>
              {tierName && (
                <Link
                  to={`/tier/${toSlug(tierName)}`}
                  style={{ background: tierColor + '22', border: `1px solid ${tierColor}44`, color: tierColor, fontSize: 12, padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}
                  className="hover:opacity-80"
                >
                  {tierName}
                </Link>
              )}
            </div>
            {foundFranchise && (
              <Link to={`/franchise/${toSlug(foundFranchise.name)}`} className="text-slate-400 text-sm hover:text-slate-200 transition-colors mt-0.5 block">
                {foundFranchise.name}
              </Link>
            )}

            {teamStanding && (
              <div className="mt-3 flex flex-wrap gap-4">
                <Stat label="Rank" value={`#${teamStanding.overallRank}`} />
                <Stat label="W-L" value={`${teamStanding.w}-${teamStanding.l}`} />
                <Stat label="WP" value={formatWP(teamStanding.wp)} />
                {teamStanding.conference && teamStanding.conference !== 'N/A' && (
                  <Stat label="Conf" value={teamStanding.conference} />
                )}
                {teamStanding.last20 && <Stat label="L20" value={teamStanding.last20} />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #334155', marginBottom: 24, display: 'flex', gap: 0 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === t ? tierColor : '#64748b',
              borderBottom: activeTab === t ? `2px solid ${tierColor}` : '2px solid transparent',
              marginBottom: -1, textTransform: 'capitalize', transition: 'color 0.15s',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'roster' && <RosterTab players={players} />}
      {activeTab === 'stats' && <StatsTab stats={teamStats} teamName={teamDisplayName} />}
      {activeTab === 'schedule' && <ScheduleTab schedule={teamSchedule} teamName={teamDisplayName} franchises={franchises} />}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 14px', minWidth: 60 }}>
      <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-white font-bold mt-0.5">{value}</div>
    </div>
  );
}

function RosterTab({ players }) {
  if (!players.length) return <div className="text-slate-400 text-center py-10">No roster data available.</div>;

  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
      <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#162032', borderBottom: '1px solid #334155', color: '#64748b' }}>
            <th className="py-2.5 px-4 text-left">Player</th>
            <th className="py-2.5 px-3 text-center">MMR</th>
            <th className="py-2.5 px-3 text-center hidden md:table-cell">Status</th>
          </tr>
        </thead>
        <tbody>
          {players.map((c, i) => {
            const isIR = c['Contract Status'] === 'Inactive Reserve' || c['Contract Status'] === 'AGM IR';
            const isAGMIR = c['Contract Status'] === 'AGM IR';
            const isCaptain = c['Captain'] === 'TRUE';
            return (
              <tr key={c['RSC ID'] || c['Player Name']} style={{ borderBottom: '1px solid #1e293b', background: i % 2 === 0 ? '#1e293b44' : 'transparent' }} className="hover:bg-slate-800">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Link to={`/player/${toSlug(c['Player Name'])}`} className="text-white hover:text-sky-400 transition-colors font-medium">
                      {c['Player Name']}
                    </Link>
                    {isCaptain && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#b4530033', color: '#f59e0b', fontWeight: 700 }}>C</span>}
                    {isIR && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#ef444422', color: '#f87171', fontWeight: 700 }}>{isAGMIR ? 'AGM IR' : 'IR'}</span>}
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-slate-300">{c['Base MMR'] || '—'}</td>
                <td className="py-3 px-3 text-center hidden md:table-cell">
                  <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: isIR ? '#ef444422' : '#16a34a22', color: isIR ? '#f87171' : '#4ade80' }}>
                    {isAGMIR ? 'AGM IR' : isIR ? 'IR' : c['Contract Status'] || 'Active'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatsTab({ stats, teamName }) {
  const [perGame, setPerGame] = useState(false);
  if (!stats.length) return <div className="text-slate-400 text-center py-10">No stats available for {teamName}.</div>;

  const cols = perGame ? PG_COLS : TOTALS_COLS;

  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
      {/* Toggle */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <span className="text-sm text-slate-400 font-medium">Player Stats</span>
        <div style={{ display: 'flex', background: '#0f172a', borderRadius: 6, padding: 2, gap: 2 }}>
          {[['Totals', false], ['Per Game', true]].map(([label, val]) => (
            <button
              key={label}
              onClick={() => setPerGame(val)}
              style={{
                padding: '4px 12px', fontSize: 12, fontWeight: 600, borderRadius: 4, border: 'none', cursor: 'pointer',
                background: perGame === val ? '#1e293b' : 'transparent',
                color: perGame === val ? '#f1f5f9' : '#64748b',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
          <thead>
            <tr style={{ background: '#162032', borderBottom: '1px solid #334155', color: '#64748b' }}>
              <th className="py-2.5 px-4 text-left">Player</th>
              {cols.map(c => <th key={c.key} className="py-2.5 px-2 text-center">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr key={s['RSC ID'] || s['Name'] + i} style={{ borderBottom: '1px solid #1e293b', background: i % 2 === 0 ? '#1e293b44' : 'transparent' }} className="hover:bg-slate-800">
                <td className="py-2.5 px-4">
                  <Link to={`/player/${toSlug(s['Name'])}`} className="text-white hover:text-sky-400 transition-colors font-medium">
                    {s['Name']}
                  </Link>
                </td>
                {cols.map(c => <td key={c.key} className="py-2.5 px-2 text-center text-slate-300">{formatStat(computeStat(s, c.key, perGame, c), c.decimals)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamLogo({ teamName, franchises }) {
  const franchise = franchises?.find(f => f.teams?.some(t => t.name === teamName));
  if (!franchise) return null;
  return (
    <img
      src={getFranchiseLogo(franchise)}
      alt=""
      style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }}
      onError={e => e.target.style.display = 'none'}
    />
  );
}

function ScheduleTab({ schedule, teamName, franchises }) {
  if (!schedule.length) return <div className="text-slate-400 text-center py-10">No schedule data found.</div>;

  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
      <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#162032', borderBottom: '1px solid #334155', color: '#64748b' }}>
            <th className="py-2.5 px-4 text-left">Match Day</th>
            <th className="py-2.5 px-3 text-left hidden sm:table-cell">Date</th>
            <th className="py-2.5 px-3 text-right">Away</th>
            <th className="py-2.5 px-3 text-center w-24">Score</th>
            <th className="py-2.5 px-3 text-left">Home</th>
            <th className="py-2.5 px-3 text-center hidden md:table-cell">Result</th>
          </tr>
        </thead>
        <tbody>
          {schedule.flatMap(day =>
            day.games.map((g, gi) => {
              const isAway = g.away === teamName;
              const teamScore = isAway ? g.awayScore : g.homeScore;
              const oppScore = isAway ? g.homeScore : g.awayScore;
              const won = g.played && teamScore > oppScore;
              const lost = g.played && teamScore < oppScore;
              return (
                <tr key={day.label + gi} style={{ borderBottom: '1px solid #1e293b', background: gi % 2 === 0 ? '#1e293b44' : 'transparent' }} className="hover:bg-slate-800">
                  <td className="py-2.5 px-4 text-slate-400">{day.label}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-xs hidden sm:table-cell">{day.date}</td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`/team/${toSlug(g.away)}`} className={`hover:text-sky-400 transition-colors font-medium ${g.away === teamName ? 'text-white' : 'text-slate-400'}`}>
                        {g.away}
                      </Link>
                      <TeamLogo teamName={g.away} franchises={franchises} />
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold" style={{ color: g.played ? '#0ea5e9' : '#475569' }}>
                    {g.played ? `${g.awayScore} – ${g.homeScore}` : 'vs'}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <TeamLogo teamName={g.home} franchises={franchises} />
                      <Link to={`/team/${toSlug(g.home)}`} className={`hover:text-sky-400 transition-colors font-medium ${g.home === teamName ? 'text-white' : 'text-slate-400'}`}>
                        {g.home}
                      </Link>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center hidden md:table-cell">
                    {g.played && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 700, background: won ? '#16a34a22' : lost ? '#ef444422' : '#64748b22', color: won ? '#4ade80' : lost ? '#f87171' : '#94a3b8' }}>
                        {won ? 'W' : lost ? 'L' : 'T'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
