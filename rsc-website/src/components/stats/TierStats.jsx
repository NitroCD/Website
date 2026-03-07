import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { getStatsForTier, formatStat, toSlug, FA_STATUSES } from '../../utils/dataUtils';

const TOTALS_COLS = [
  { key: 'GP',          label: 'GP',   decimals: 0, desc: 'Games Played' },
  { key: 'W',           label: 'W',    decimals: 0, desc: 'Wins' },
  { key: 'L',           label: 'L',    decimals: 0, desc: 'Losses' },
  { key: 'Win%',        label: 'WIN%', decimals: 3, desc: 'Win Percentage' },
  { key: 'MVPs',        label: 'MVP',  decimals: 0, desc: 'MVP Awards' },
  { key: 'Pts',         label: 'PTS',  decimals: 0, desc: 'Total Points' },
  { key: 'Goals',       label: 'G',    decimals: 0, desc: 'Goals' },
  { key: 'Assists',     label: 'A',    decimals: 0, desc: 'Assists' },
  { key: 'Saves',       label: 'SV',   decimals: 0, desc: 'Saves' },
  { key: 'Shots',       label: 'SH',   decimals: 0, desc: 'Shots' },
  { key: 'Shot %',      label: 'SH%',  decimals: 1, desc: 'Shot Percentage' },
  { key: 'Cycles',      label: 'CYC',  decimals: 0, desc: 'Cycles' },
  { key: 'Hat Tricks',  label: 'HAT',  decimals: 0, desc: 'Hat Tricks' },
  { key: 'Saviors',     label: 'SAV',  decimals: 0, desc: 'Saviors' },
  { key: 'DI',          label: 'DI',   decimals: 0, desc: 'Demos Inflicted' },
  { key: 'DT',          label: 'DT',   decimals: 0, desc: 'Demos Taken' },
  { key: 'RPV',         label: 'RPV',  decimals: 2, desc: 'RSC Performance Value' },
];

const PG_COLS = [
  { key: 'GP',    label: 'GP',   decimals: 0, desc: 'Games Played' },
  { key: 'Win%',  label: 'WIN%', decimals: 3, desc: 'Win Percentage' },
  { key: 'PPG',   label: 'PPG',  decimals: 2, desc: 'Points Per Game' },
  { key: 'GPG',   label: 'GPG',  decimals: 2, desc: 'Goals Per Game' },
  { key: 'APG',   label: 'APG',  decimals: 2, desc: 'Assists Per Game' },
  { key: 'SvPG',  label: 'SVPG', decimals: 2, desc: 'Saves Per Game' },
  { key: 'ShPG',  label: 'SHPG', decimals: 2, desc: 'Shots Per Game' },
  { key: 'Shot %',label: 'SH%',  decimals: 1, desc: 'Shot Percentage' },
  { key: 'DI',    label: 'DIPG', decimals: 2, desc: 'Demos Inflicted Per Game', perGame: true },
  { key: 'DT',    label: 'DTPG', decimals: 2, desc: 'Demos Taken Per Game',     perGame: true },
  { key: 'RPV',   label: 'RPV',  decimals: 2, desc: 'RSC Performance Value' },
];

// For stats that don't have a per-game column in the data, compute from totals
function computeStat(player, key, perGame, colDef) {
  if (perGame && colDef?.perGame) {
    const gp = parseFloat(player['GP'] || 0);
    const raw = parseFloat(player[key] || 0);
    return gp > 0 ? raw / gp : 0;
  }
  return parseFloat(player[key] || 0);
}

export default function TierStats({ tier }) {
  const { stats, contracts } = useData();

  const contractMap = {};
  for (const c of contracts) {
    if (c['RSC ID']) contractMap[c['RSC ID']] = c;
  }
  const [sortCol, setSortCol] = useState('DI');
  const [sortDir, setSortDir] = useState('desc');
  const [minGP, setMinGP] = useState(1);
  const [perGame, setPerGame] = useState(false);

  const STAT_COLS = perGame ? PG_COLS : TOTALS_COLS;

  const tierStats = getStatsForTier(stats, tier);

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  function togglePerGame(val) {
    setPerGame(val);
    // Reset sort if current sort col not in new view
    const newCols = val ? PG_COLS : TOTALS_COLS;
    if (!newCols.find(c => c.key === sortCol)) setSortCol('DI');
  }

  const filtered = tierStats.filter(p => parseInt(p['GP'] || 0) >= minGP);
  const sortColDef = STAT_COLS.find(c => c.key === sortCol);
  const sorted = [...filtered].sort((a, b) => {
    const va = computeStat(a, sortCol, perGame, sortColDef);
    const vb = computeStat(b, sortCol, perGame, sortColDef);
    return sortDir === 'desc' ? vb - va : va - vb;
  });

  if (!tierStats.length) {
    return <div className="text-slate-400 text-center py-10">No stats available for {tier}.</div>;
  }

  const col = STAT_COLS.find(c => c.key === sortCol);

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <span className="text-slate-400 text-sm">{sorted.length} players</span>

        {/* Per Game Toggle */}
        <div style={{ display: 'flex', background: '#0f172a', borderRadius: 8, border: '1px solid #334155', padding: 2 }}>
          {[['Totals', false], ['Per Game', true]].map(([label, val]) => (
            <button
              key={label}
              onClick={() => togglePerGame(val)}
              style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: perGame === val ? '#1e293b' : 'transparent',
                color: perGame === val ? '#e2e8f0' : '#64748b',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-400 text-sm">Min GP:</label>
          <input
            type="number"
            value={minGP}
            onChange={e => setMinGP(Math.max(0, parseInt(e.target.value) || 0))}
            style={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 6, padding: '4px 8px', width: 60, fontSize: 13 }}
          />
        </div>
        {col && <span className="text-slate-400 text-sm">Sorted by: <span className="text-sky-400">{col.desc}</span></span>}
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#64748b', background: '#162032' }}>
                <th className="py-2 px-3 text-left w-8 sticky left-0 bg-slate-900">#</th>
                <th className="py-2 px-3 text-left sticky left-8 bg-slate-900 min-w-36">Player</th>
                <th className="py-2 px-2 text-left min-w-28 hidden md:table-cell">Team</th>
                {STAT_COLS.map(c => (
                  <th
                    key={c.key}
                    onClick={() => handleSort(c.key)}
                    title={c.desc}
                    style={{ cursor: 'pointer', padding: '8px 6px', textAlign: 'center', minWidth: 44, whiteSpace: 'nowrap', color: sortCol === c.key ? '#0ea5e9' : '#64748b', userSelect: 'none' }}
                    className="hover:text-slate-300 transition-colors"
                  >
                    {c.label}
                    {sortCol === c.key && (sortDir === 'desc' ? ' ↓' : ' ↑')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((player, i) => (
                <tr
                  key={player['RSC ID'] || player['Name'] + i}
                  style={{ borderBottom: '1px solid #1e293b44', background: i % 2 === 0 ? '#1e293b44' : 'transparent' }}
                  className="hover:bg-slate-800"
                >
                  <td className="py-2 px-3 text-slate-500 sticky left-0 bg-inherit">{i + 1}</td>
                  <td className="py-2 px-3 sticky left-8 bg-inherit">
                    <Link to={`/player/${toSlug(player['Name'])}`} className="text-white hover:text-sky-400 transition-colors font-medium">
                      {player['Name']}
                    </Link>
                  </td>
                  <td className="py-2 px-2 hidden md:table-cell">
                    {(() => {
                      const c = player['RSC ID'] ? contractMap[player['RSC ID']] : null;
                      const team = c?.['Team'];
                      const status = c?.['Contract Status'];
                      const isFa = !team || FA_STATUSES.has(status);
                      if (isFa) return <span className="text-slate-500 text-xs">Free Agent</span>;
                      return <Link to={`/team/${toSlug(team)}`} className="text-slate-400 hover:text-slate-200 transition-colors text-xs">{team}</Link>;
                    })()}
                  </td>
                  {STAT_COLS.map(c => (
                    <td
                      key={c.key}
                      style={{ padding: '8px 6px', textAlign: 'center', color: sortCol === c.key ? '#e2e8f0' : '#94a3b8', fontWeight: sortCol === c.key ? 600 : 400 }}
                    >
                      {formatStat(computeStat(player, c.key, perGame, c), c.decimals)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
