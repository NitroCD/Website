import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { toSlug, formatWP, getFranchiseLogo, TIERS, TIER_COLORS } from '../utils/dataUtils';

function TH({ children, tooltip, className = '', style }) {
  return (
    <th className={`py-3 px-2 text-center ${className}`} style={style}>
      <div className="relative group inline-block">
        {children}
        {tooltip && (
          <span style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            marginTop: 6, padding: '4px 8px', fontSize: 11, background: '#0f172a', color: '#e2e8f0',
            borderRadius: 4, whiteSpace: 'nowrap', border: '1px solid #334155', zIndex: 20,
            pointerEvents: 'none', transition: 'opacity 0.15s',
          }} className="opacity-0 group-hover:opacity-100">
            {tooltip}
          </span>
        )}
      </div>
    </th>
  );
}

export default function FranchiseStandingsPage() {
  const { franchiseStandings, franchises } = useData();

  const sorted = [...franchiseStandings].sort((a, b) => (a.overallRank || 99) - (b.overallRank || 99));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Franchise Standings</h1>
        <p className="text-slate-400 text-sm mt-1">Season 25 · Combined performance across all tiers</p>
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#162032', borderBottom: '1px solid #334155', color: '#64748b' }}>
                <th className="py-3 px-3 text-left w-8">#</th>
                <th className="py-3 px-3 text-left min-w-48">Franchise</th>
                <TH className="hidden sm:table-cell" tooltip="Conference">CONF</TH>
                <TH tooltip="Franchise Score">FS</TH>
                <TH>W</TH>
                <TH>L</TH>
                <TH className="hidden md:table-cell" tooltip="Win Percentage">WP</TH>
                <TH tooltip="Teams in Playoffs">PO</TH>
                {TIERS.map(t => (
                  <th key={t} className="py-3 px-2 text-center hidden xl:table-cell" style={{ minWidth: 80 }}>
                    <Link to={`/tier/${toSlug(t)}`} style={{ color: TIER_COLORS[t] }} className="hover:opacity-70">
                      {t}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((f, i) => {
                const franchise = franchises.find(fr => fr.name === f.name);
                const logo = franchise ? getFranchiseLogo(franchise) : null;
                return (
                  <tr
                    key={f.name}
                    style={{ borderBottom: '1px solid #1e293b44', background: i % 2 === 0 ? '#1e293b44' : 'transparent' }}
                    className="hover:bg-slate-800"
                  >
                    <td className="py-3 px-3 text-slate-500 text-center">{f.overallRank ?? i + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {logo && (
                          <img src={logo} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                        )}
                        <div>
                          <Link to={`/franchise/${toSlug(f.name)}`} className="text-white hover:text-sky-400 transition-colors font-medium">
                            {f.name}
                          </Link>
                          <div className="text-xs text-slate-500">{f.gm}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center hidden sm:table-cell">
                      <span style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                        background: f.conference?.includes('Solar') ? '#b4530022' : '#4c1d9522',
                        color: f.conference?.includes('Solar') ? '#f59e0b' : '#818cf8',
                      }}>
                        {f.conference}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-sky-400">{f.franchiseScore?.toFixed(2) ?? '—'}</td>
                    <td className="py-3 px-2 text-center text-white font-medium">{f.seasonW ?? '—'}</td>
                    <td className="py-3 px-2 text-center text-slate-400">{f.seasonL ?? '—'}</td>
                    <td className="py-3 px-2 text-center text-slate-300 hidden md:table-cell">{formatWP(f.seasonWP)}</td>
                    <td className="py-3 px-2 text-center">
                      <span style={{ fontWeight: 600, color: f.playoffTeams > 0 ? '#34d399' : '#475569', fontSize: 12 }}>{f.playoffTeams}</span>
                    </td>
                    {TIERS.map(tier => {
                      const ts = f.tierStandings?.[tier];
                      return (
                        <td key={tier} className="py-3 px-2 text-center hidden xl:table-cell">
                          {ts ? (
                            <div>
                              <Link to={`/team/${toSlug(ts.team)}`} className="text-xs text-slate-300 hover:text-sky-400 transition-colors block">
                                {ts.team}
                              </Link>
                              <div style={{ fontSize: 10, color: ts.playoffs === 'In' ? '#34d399' : '#64748b' }}>
                                #{ts.rank} · {ts.w}-{ts.l} · {ts.playoffs}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
