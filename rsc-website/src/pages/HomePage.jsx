import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { TIERS, TIER_COLORS, toSlug, formatWP, getFranchiseLogo, getTierIcon } from '../utils/dataUtils';

export default function HomePage() {
  const { standings, franchises, schedules } = useData();

  // Get recent results across all tiers
  const recentGames = [];
  for (const tier of TIERS) {
    const tierSched = schedules[tier] || [];
    for (const day of [...tierSched].reverse()) {
      const played = day.games.filter(g => g.played);
      if (played.length > 0) {
        played.slice(0, 2).forEach(g => recentGames.push({ ...g, tier, matchDay: day.label, date: day.date }));
        break;
      }
    }
  }

  // Get top teams from each tier (top 3)
  const tierHighlights = TIERS.slice(0, 6).map(tier => {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Results */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 24 }}>
          <h2 className="text-lg font-bold text-white mb-4">Recent Results</h2>
          <div className="space-y-3">
            {recentGames.slice(0, 9).map((g, i) => (
              <div key={i} style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px' }}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 11, color: TIER_COLORS[g.tier], fontWeight: 600 }}>{g.tier}</span>
                  <span className="text-xs text-slate-500">{g.matchDay}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Link to={`/team/${toSlug(g.away)}`} className={`text-sm font-medium ${g.awayScore > g.homeScore ? 'text-white' : 'text-slate-400'} hover:text-sky-400 transition-colors`}>
                    {g.away}
                  </Link>
                  <span className="text-sm font-bold mx-3" style={{ color: '#0ea5e9' }}>
                    {g.awayScore} – {g.homeScore}
                  </span>
                  <Link to={`/team/${toSlug(g.home)}`} className={`text-sm font-medium ${g.homeScore > g.awayScore ? 'text-white' : 'text-slate-400'} hover:text-sky-400 transition-colors`}>
                    {g.home}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tier Standings Snapshots */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white">Tier Leaders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tierHighlights.map(({ tier, teams }) => (
              <div key={tier} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
                <div className="flex items-center justify-between mb-3">
                  <Link to={`/tier/${toSlug(tier)}`} className="flex items-center gap-2 hover:opacity-80">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: TIER_COLORS[tier], display: 'inline-block' }} />
                    <span className="font-bold text-white text-sm">{tier}</span>
                  </Link>
                  <Link to={`/tier/${toSlug(tier)}`} className="text-xs text-sky-400 hover:text-sky-300">Full standings →</Link>
                </div>
                {teams.map((t, i) => (
                  <div key={t.name} className="flex items-center gap-2 py-1.5">
                    <span className="text-slate-500 text-xs w-4">{t.overallRank ?? i + 1}</span>
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
