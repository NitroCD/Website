import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { toSlug, getFranchiseLogo, getTierIcon, TIER_COLORS, FA_STATUSES, formatStat } from '../utils/dataUtils';

const STAT_SECTIONS = [
  { label: 'Performance', cols: ['GP', 'W', 'L', 'Win%', 'MVPs'] },
  { label: 'Scoring', cols: ['Pts', 'PPG', 'Goals', 'GPG', 'Assists', 'APG'] },
  { label: 'Defense & Shooting', cols: ['Saves', 'SvPG', 'Shots', 'ShPG', 'Shot %'] },
  { label: 'Advanced', cols: ['Cycles', 'Hat Tricks', 'Saviors', 'DI', 'DT', 'RPV'] },
];

const STAT_LABELS = {
  'GP': 'GP', 'W': 'W', 'L': 'L', 'Win%': 'WIN%', 'MVPs': 'MVPs',
  'Pts': 'PTS', 'PPG': 'PPG', 'Goals': 'G', 'GPG': 'GPG', 'Assists': 'A', 'APG': 'APG',
  'Saves': 'SV', 'SvPG': 'SVPG', 'Shots': 'SH', 'ShPG': 'SHPG', 'Shot %': 'SH%',
  'Cycles': 'CYC', 'Hat Tricks': 'HAT', 'Saviors': 'SAV',
  'DI': 'Demos Inflicted', 'DT': 'Demos Taken', 'RPV': 'RPV',
};

function StatCard({ label, value }) {
  return (
    <div style={{ background: '#0f172a', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl font-bold text-white">{value ?? '—'}</div>
    </div>
  );
}

export default function PlayerPage() {
  const { playerName } = useParams();
  const { franchises, contracts, stats } = useData();

  // Find player in contracts by name slug
  const contract = contracts.find(c => toSlug(c['Player Name']) === playerName);
  const playerName_ = contract?.['Player Name'];

  // Find player stats (all tiers)
  const playerStats = stats.filter(s => s['Name'] && toSlug(s['Name']) === playerName);

  const displayName = playerName_ || playerName.replace(/-/g, ' ');

  if (!contract && !playerStats.length) {
    return <div className="text-center text-slate-400 py-20">Player not found.</div>;
  }

  // Find franchise from contract data
  const franchiseName = contract?.['Franchise'];
  const teamName = contract?.['Team'];
  const franchise = franchiseName ? franchises.find(f => f.name === franchiseName) : null;

  const tierName = contract?.['Tier'] || playerStats[0]?.['Tier'] || '';
  const tierColor = TIER_COLORS[tierName] || '#0ea5e9';
  const isIR = contract?.['Contract Status'] === 'Inactive Reserve' || contract?.['Contract Status'] === 'AGM IR';
  const isAGMIR = contract?.['Contract Status'] === 'AGM IR';
  const isCaptain = contract?.['Captain'] === 'TRUE';
  const isFreeAgent = !franchiseName || FA_STATUSES.has(contract?.['Contract Status']);

  return (
    <div>
      {/* Player Header */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 28, marginBottom: 24 }}>
        <div className="flex items-start gap-4 flex-wrap">
          {isFreeAgent ? (
            tierName && (
              <img
                src={getTierIcon(tierName)}
                alt={tierName}
                style={{ width: 64, height: 64, objectFit: 'contain', opacity: 0.85 }}
                onError={e => e.target.style.display = 'none'}
              />
            )
          ) : franchise ? (
            <img
              src={getFranchiseLogo(franchise)}
              alt=""
              style={{ width: 64, height: 64, objectFit: 'contain' }}
              onError={e => e.target.style.display = 'none'}
            />
          ) : null}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              {isFreeAgent && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: '#0ea5e922', color: '#38bdf8', fontWeight: 700, border: '1px solid #0ea5e944' }}>Free Agent</span>}
              {isCaptain && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: '#b4530033', color: '#f59e0b', fontWeight: 700 }}>Captain</span>}
              {isIR && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: '#ef444422', color: '#f87171', fontWeight: 700 }}>{isAGMIR ? 'AGM IR' : 'Injured Reserve'}</span>}
            </div>

            <div className="mt-2 flex flex-wrap gap-3">
              {tierName && (
                <Link
                  to={`/tier/${toSlug(tierName)}`}
                  style={{ background: tierColor + '22', border: `1px solid ${tierColor}44`, color: tierColor, fontSize: 12, padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}
                  className="hover:opacity-80"
                >
                  {tierName}
                </Link>
              )}
              {!isFreeAgent && teamName && (
                <Link to={`/team/${toSlug(teamName)}`} className="text-slate-300 hover:text-sky-400 text-sm font-medium transition-colors">
                  {teamName}
                </Link>
              )}
              {!isFreeAgent && franchise && (
                <Link to={`/franchise/${toSlug(franchise.name)}`} className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
                  {franchise.name}
                </Link>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              {!isFreeAgent && contract?.['Base MMR'] && (
                <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 14px' }}>
                  <div className="text-xs text-slate-500">Salary (MMR)</div>
                  <div className="text-white font-bold">{contract['Base MMR']}</div>
                </div>
              )}
              {contract?.['RSC ID'] && (
                <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 14px' }}>
                  <div className="text-xs text-slate-500">RSC ID</div>
                  <div className="text-white font-bold text-sm">{contract['RSC ID']}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {playerStats.length > 0 && (
        <div className="space-y-6">
          {playerStats.map((s, si) => (
            <div key={si} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
              <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: TIER_COLORS[s['Tier']] || '#64748b' }} />
                  <span className="font-bold text-white">{s['Tier']}</span>
                  <span className="text-slate-400 text-sm">Season Stats</span>
                </div>
                {s['Team'] && (
                  <Link to={`/team/${toSlug(s['Team'].split(',')[0].trim())}`} className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
                    {s['Team'].split(',').map(t => t.trim()).join(', ')}
                  </Link>
                )}
              </div>
              {STAT_SECTIONS.map(section => (
                <div key={section.label} className="px-4 py-3 border-b border-slate-800 last:border-0">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">{section.label}</div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {section.cols.map(col => {
                      const val = s[col];
                      const formatted = col === 'Win%' ? (parseFloat(val) || 0).toFixed(3) : formatStat(val, col.includes('PG') || col.includes('%') || col === 'Win%' || col === 'RPV' ? 2 : 0);
                      return <StatCard key={col} label={STAT_LABELS[col] || col} value={formatted} />;
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {playerStats.length === 0 && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <p className="text-slate-400">No stats recorded yet this season.</p>
        </div>
      )}
    </div>
  );
}
