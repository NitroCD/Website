import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { TIERS, TIER_COLORS, toSlug, formatWP, getFranchiseLogo, getTierIcon } from '../utils/dataUtils';

function TeamLogo({ teamName, franchises, size = 18 }) {
  const franchise = franchises?.find(f => f.teams?.some(t => t.name === teamName));
  if (!franchise) return null;
  return (
    <img
      src={getFranchiseLogo(franchise)}
      alt=""
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      onError={e => e.target.style.display = 'none'}
    />
  );
}

export default function HomePage() {
  const { standings, franchises } = useData();

  // Get top teams from each tier (top 3)
  const tierHighlights = TIERS.map(tier => {
    const teams = (standings[tier] || []).slice(0, 3);
    return { tier, teams };
  });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', border: '1px solid #334155', borderRadius: 12, padding: '40px 32px' }}>
        <div className="flex items-center gap-4 mb-4">
          <img src="/images/rsc-logo.png" alt="RSC" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          <div>
            <h1 className="text-3xl font-bold text-white">Rocket Soccar Confederation</h1>
            <p className="text-slate-400">Season 25 · 9 Tiers · 28 Franchises · 180 Teams</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          {TIERS.map(tier => (
            <Link
              key={tier}
              to={`/tier/${toSlug(tier)}`}
              style={{ background: TIER_COLORS[tier] + '22', border: `1px solid ${TIER_COLORS[tier]}44`, borderRadius: 8, padding: '8px 14px', color: TIER_COLORS[tier], fontSize: 13, fontWeight: 600, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
              className="hover:opacity-80"
            >
              <img src={getTierIcon(tier)} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
              {tier}
            </Link>
          ))}
          <Link
            to="/franchise-standings"
            style={{ background: '#ffffff11', border: '1px solid #334155', borderRadius: 8, padding: '8px 16px', color: '#94a3b8', fontSize: 13, fontWeight: 600 }}
            className="hover:bg-slate-700 hover:text-white transition-colors"
          >
            Franchise Standings
          </Link>
        </div>
      </div>

      {/* Tier Leaders */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Tier Leaders</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tierHighlights.map(({ tier, teams }) => (
            <div key={tier} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
              <div className="flex items-center justify-between mb-3">
                <Link to={`/tier/${toSlug(tier)}`} className="flex items-center gap-2 hover:opacity-80">
                  <img src={getTierIcon(tier)} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                  <span className="font-bold text-white text-sm">{tier}</span>
                </Link>
                <Link to={`/tier/${toSlug(tier)}`} className="text-xs text-sky-400 hover:text-sky-300">Full standings →</Link>
              </div>
              {teams.map((t, i) => (
                <div key={t.name} className="flex items-center gap-2 py-1.5">
                  <span className="text-slate-500 text-xs w-4">{t.overallRank ?? i + 1}</span>
                  <TeamLogo teamName={t.name} franchises={franchises} />
                  <Link to={`/team/${toSlug(t.name)}`} className="flex-1 text-sm text-slate-200 hover:text-sky-400 transition-colors font-medium truncate">
                    {t.name}
                  </Link>
                  <span className="text-xs text-slate-400">{t.w}-{t.l}</span>
                  <span className="text-xs text-slate-500 w-10 text-right">{formatWP(t.wp)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Franchises */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Franchises</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {[...franchises].sort((a, b) => a.name.localeCompare(b.name)).map(f => (
            <Link
              key={f.name}
              to={`/franchise/${toSlug(f.name)}`}
              style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'border-color 0.15s' }}
              className="hover:border-sky-500 hover:bg-slate-700"
            >
              <img
                src={getFranchiseLogo(f)}
                alt={f.name}
                style={{ width: 40, height: 40, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
              <span className="text-xs text-slate-300 text-center leading-tight font-medium">{f.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
