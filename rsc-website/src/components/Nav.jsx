import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { TIERS, TIER_COLORS, toSlug, getFranchiseLogo, getTierIcon } from '../utils/dataUtils';
import { useData } from '../context/DataContext';

export default function Nav() {
  const [tierOpen, setTierOpen] = useState(false);
  const [franchiseOpen, setFranchiseOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const { franchises, contracts } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const tierRef = useRef(null);
  const franchiseRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (tierRef.current && !tierRef.current.contains(e.target)) setTierOpen(false);
      if (franchiseRef.current && !franchiseRef.current.contains(e.target)) setFranchiseOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close dropdowns on navigation
  useEffect(() => {
    setTierOpen(false);
    setFranchiseOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, [location.pathname]);

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    const results = [];

    // Search teams
    for (const f of franchises) {
      for (const t of f.teams || []) {
        if (t.name.toLowerCase().includes(q)) {
          results.push({ type: 'team', name: t.name, sub: f.name, url: `/team/${toSlug(t.name)}` });
        }
      }
    }

    // Search franchises
    for (const f of franchises) {
      if (f.name.toLowerCase().includes(q)) {
        results.push({ type: 'franchise', name: f.name, sub: `${f.teams?.length} teams`, url: `/franchise/${toSlug(f.name)}` });
      }
    }

    // Search players from contracts
    const playerNames = new Set();
    for (const c of contracts) {
      const name = c['Player Name'];
      if (name && name.toLowerCase().includes(q) && !playerNames.has(name)) {
        playerNames.add(name);
        results.push({ type: 'player', name, sub: `${c['Team']} · ${c['Tier']}`, url: `/player/${toSlug(name)}` });
      }
    }

    setSearchResults(results.slice(0, 8));
  }, [searchQuery, franchises, contracts]);

  return (
    <nav style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
      <div className="max-w-screen-xl mx-auto px-4 flex items-center h-16 gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/images/rsc-logo.png" alt="RSC" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <span className="font-bold text-white text-lg hidden sm:block">RSC</span>
        </Link>

        {/* Tiers Dropdown */}
        <div ref={tierRef} className="relative">
          <button
            onClick={() => setTierOpen(!tierOpen)}
            className="flex items-center gap-1 px-3 py-2 rounded text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition-colors"
          >
            Tiers
            <svg className={`w-4 h-4 transition-transform ${tierOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {tierOpen && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, minWidth: 200, position: 'absolute', top: '110%', left: 0, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              {TIERS.map(tier => (
                <Link
                  key={tier}
                  to={`/tier/${toSlug(tier)}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 text-sm text-slate-200 hover:text-white transition-colors"
                >
                  <img
                    src={getTierIcon(tier)}
                    alt=""
                    style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'inline-block'); }}
                  />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: TIER_COLORS[tier], flexShrink: 0, display: 'none' }} />
                  {tier}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Franchises Dropdown */}
        <div ref={franchiseRef} className="relative">
          <button
            onClick={() => setFranchiseOpen(!franchiseOpen)}
            className="flex items-center gap-1 px-3 py-2 rounded text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition-colors"
          >
            Franchises
            <svg className={`w-4 h-4 transition-transform ${franchiseOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {franchiseOpen && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, minWidth: 220, position: 'absolute', top: '110%', left: 0, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxHeight: 400, overflowY: 'auto' }}>
              {[...franchises].sort((a, b) => a.name.localeCompare(b.name)).map(f => (
                <Link
                  key={f.name}
                  to={`/franchise/${toSlug(f.name)}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 text-sm text-slate-200 hover:text-white transition-colors"
                >
                  <img src={getFranchiseLogo(f)} alt="" className="w-5 h-5 object-contain" onError={e => e.target.style.display='none'} />
                  {f.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Franchise Standings link */}
        <Link
          to="/franchise-standings"
          className="px-3 py-2 rounded text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition-colors hidden md:block"
        >
          Franchise Standings
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search players, teams..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 6, padding: '6px 12px 6px 32px', width: 200, fontSize: 13 }}
            className="focus:outline-none focus:border-sky-500"
          />
          <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchResults.length > 0 && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, position: 'absolute', top: '110%', right: 0, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 260 }}>
              {searchResults.map((r, i) => (
                <Link
                  key={i}
                  to={r.url}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-700 transition-colors"
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                >
                  <div>
                    <div className="text-sm text-white">{r.name}</div>
                    <div className="text-xs text-slate-400">{r.sub}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: r.type === 'player' ? '#0369a1' : r.type === 'team' ? '#065f46' : '#581c87', color: '#fff' }}>
                    {r.type}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
