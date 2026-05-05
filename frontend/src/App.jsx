import { useState, useEffect, useCallback, useMemo } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, AreaChart, Area } from 'recharts'

// ── API Helper ────────────────────────────────────────────────────────────────
const API = 'http://localhost:5000/api'
const api = async (path, opts = {}) => {
  try {
    console.log(`[API] ${opts.method || 'GET'} ${path}`);
    const r = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opts
    })
    if (!r.ok) {
      const errData = await r.json().catch(() => ({}));
      return { error: errData.error || `HTTP ${r.status}` };
    }
    return await r.json()
  } catch (err) { return null; }
}

// ── Icons (SVGs) ──────────────────────────────────────────────────────────────
const Icons = {
  Overview: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Chat: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  Papers: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Repos: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>,
  Trends: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 6l-9.5 9.5-5-5L1 18"></path><polyline points="17 6 23 6 23 12"></polyline></svg>,
  Ideas: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>,
  Snap: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>,
  Audit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  Settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Zap: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Logout: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  ChevronDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
}

// ── Shared UI Components ──────────────────────────────────────────────────────

const Badge = ({ children, variant = 'info' }) => {
  const styles = {
    info: { bg: '#E0E7FF', color: '#4338CA' },
    success: { bg: '#D1FAE5', color: '#065F46' },
    warning: { bg: '#FEF3C7', color: '#92400E' },
    error: { bg: '#FEE2E2', color: '#991B1B' }
  }[variant] || { bg: '#F3F4F6', color: '#475569' }
  return <span style={{ background: styles.bg, color: styles.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.025em' }}>{children}</span>
}

const StatCard = ({ label, value, sub, color = 'var(--primary)' }) => (
  <div className="card" style={{ padding: 20, flex: 1, minWidth: 200 }}>
    <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 32, fontWeight: 800, color: color, marginBottom: 4 }}>{value}</div>
    {sub && <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{sub}</div>}
  </div>
)

const ScoreBar = ({ value = 0, color = 'var(--primary)' }) => (
  <div style={{ background: '#F3F4F6', borderRadius: 99, height: 5, width: '100%', overflow: 'hidden' }}>
    <div style={{ background: color, height: '100%', width: `${Math.min(100, value)}%`, borderRadius: 99, transition: 'width 1s ease' }} />
  </div>
)

const PageHeader = ({ title, description, actions }) => (
  <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
    <div><h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{title}</h1><p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{description}</p></div>
    <div style={{ display: 'flex', gap: 12 }}>{actions}</div>
  </div>
)

// ── Feature Cards ─────────────────────────────────────────────────────────────

const PaperCard = ({ paper, index }) => {
  const [expanded, setExpanded] = useState(false); const [explainMode, setExplainMode] = useState('beginner'); const [explanation, setExplanation] = useState(null); const [isExplaining, setIsExplaining] = useState(false)
  const handleExplain = async () => { setExpanded(true); if (!explanation) { setIsExplaining(true); const r = await api(`/papers/${index}/explain`, { method: 'POST', body: JSON.stringify({ mode: explainMode }) }); if (r?.explanation) setExplanation({ text: r.explanation }); setIsExplaining(false) } }
  return (
    <div className="card" style={{ padding: 20, marginBottom: 16, borderLeft: expanded ? '4px solid var(--primary)' : '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
        <div style={{ flex: 1 }}><div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}><Badge variant={paper.actionLabel}>{paper.actionLabel}</Badge><span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{paper.researchArea}</span></div><h3 style={{ fontSize: 16, fontWeight: 700 }}>{paper.title}</h3><p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{(paper.authors || []).slice(0, 3).join(', ')}</p></div>
        <div style={{ textAlign: 'right' }}><div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{paper.overallScore || 50}</div><div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>MATCH</div></div>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{paper.tldr || paper.abstract?.slice(0, 180) + '...'}</p>
      {expanded && <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}><div style={{ background: '#F9FAFB', padding: 16, borderRadius: 12 }}>{isExplaining ? 'Thinking...' : explanation?.text || <button onClick={handleExplain} className="btn btn-primary" style={{ fontSize: 11 }}>Explain with AI</button>}</div></div>}
      <div style={{ display: 'flex', gap: 12, marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}><a href={paper.arxivUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 12, textDecoration: 'none' }}>Read Paper</a><button onClick={() => setExpanded(!expanded)} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: 12, marginLeft: 'auto' }}>{expanded ? 'Show Less' : 'Details'}</button></div>
    </div>
  )
}

const RepoCard = ({ repo }) => (
  <div className="card" style={{ padding: 20, marginBottom: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
      <div><h3 style={{ fontSize: 16, fontWeight: 700 }}>{repo.name?.split('/')[1] || repo.name}</h3><p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{repo.name?.split('/')[0]}</p></div>
      <div style={{ textAlign: 'right' }}><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>⭐ {(repo.stars || 0).toLocaleString()}</div></div>
    </div>
    <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>{repo.quickSummary || repo.description}</p>
    <a href={repo.url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: 12, textDecoration: 'none', textAlign: 'center' }}>View Repository</a>
  </div>
)

// ── Views ──────────────────────────────────────────────────────────────────

const OverviewView = ({ digest, triggerPipeline, isRunning, status }) => (
  <div className="animate-slide-up">
    <PageHeader title="Research Dashboard" description="Executive summary of latest GenAI movements." actions={<button onClick={triggerPipeline} disabled={isRunning} className="btn btn-primary"><Icons.Zap /> {isRunning ? 'Syncing...' : 'Sync Digest'}</button>} />
    {isRunning && <div className="card" style={{ padding: 20, marginBottom: 32, borderLeft: '4px solid var(--primary)' }}>Pipeline Active: {status?.message}</div>}
    {!isRunning && (
      <>
        <div style={{ display: 'flex', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
          <StatCard label="Papers" value={digest?.stats?.papersAnalyzed || 0} sub="ArXiv GenAI" />
          <StatCard label="Repos" value={digest?.stats?.reposAnalyzed || 0} sub="GitHub Trend" color="var(--success)" />
          <StatCard label="Trends" value={digest?.trends?.topTrends?.length || 0} sub="Market Momentum" color="var(--accent)" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div><h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Top Research</h2>{(digest?.papers || []).slice(0, 3).map((p, i) => <PaperCard key={i} paper={p} index={i} />)}</div>
          <div><h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Top Repositories</h2>{(digest?.repos || []).slice(0, 3).map((r, i) => <RepoCard key={i} repo={r} index={i} />)}</div>
        </div>
      </>
    )}
  </div>
)

// ── Auth Components ───────────────────────────────────────────────────────────

const AuthModal = ({ mode, setMode, onClose, onAuth }) => {
  const [email, setEmail] = useState(''); const [pass, setPass] = useState(''); const [name, setName] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div className="card animate-slide-up" style={{ maxWidth: 400, width: '100%', padding: 40 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, textAlign: 'center' }}>{mode === 'login' ? 'Welcome Back' : 'Join OpenScholar'}</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 14, marginBottom: 32 }}>{mode === 'login' ? 'Access your personal research hub' : 'Build your custom AI research agent'}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'signup' && <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none' }} />}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" type="email" style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none' }} />
          <input value={pass} onChange={e => setPass(e.target.value)} placeholder="Password" type="password" style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none' }} />
          <button onClick={() => onAuth({ email, name: name || email.split('@')[0] })} className="btn btn-primary" style={{ padding: 14, borderRadius: 12, marginTop: 12, fontSize: 15 }}>{mode === 'login' ? 'Login to Dashboard' : 'Create Researcher Account'}</button>
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>{mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Login'}</button>
        </div>
      </div>
    </div>
  )
}

const ProfileDropdown = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 12, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 12 }}>{user.name[0].toUpperCase()}</div>
        <div style={{ textAlign: 'left' }}><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{user.name}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Researcher</div></div>
        <Icons.ChevronDown />
      </button>
      {open && (
        <div className="card animate-slide-up" style={{ position: 'absolute', top: '120%', right: 0, width: 220, padding: 8, zIndex: 1000, boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}><div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>SIGNED IN AS</div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div></div>
          <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}><Icons.User /> My Profile</button>
          <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}><Icons.Papers /> Saved Research</button>
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }}></div>
          <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--error)', fontWeight: 600 }}><Icons.Logout /> Sign Out</button>
        </div>
      )}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null); const [authMode, setAuthMode] = useState(null)
  const [digest, setDigest] = useState(null); const [status, setStatus] = useState(null); const [tab, setTab] = useState('overview'); const [isRunning, setIsRunning] = useState(false); const [notification, setNotification] = useState(null)
  
  const loadData = useCallback(async () => { const d = await api('/digest'); const s = await api('/status'); if (d && !d.error) setDigest(d); if (s && !s.error) setStatus(s) }, [])
  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { const interval = setInterval(async () => { const s = await api('/status'); if (s && !s.error) { setStatus(s); if (!s.isRunning && isRunning) { setIsRunning(false); loadData(); setNotification({ msg: '✅ Sync complete!', type: 'success' }); setTimeout(() => setNotification(null), 4000) } } }, 3000); return () => clearInterval(interval) }, [isRunning, loadData])

  const triggerPipeline = async () => { if (isRunning) return; setIsRunning(true); setNotification({ msg: '🚀 Pipeline started...', type: 'info' }); await api('/pipeline/run', { method: 'POST' }) }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 'var(--sidebar-width)', height: '100vh', background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column', padding: '24px 16px', zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, padding: '0 8px' }}><div style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>OS</div><div style={{ fontSize: 18, fontWeight: 800 }}>OpenScholar AI</div></div>
        <nav style={{ flex: 1 }}>{[ { id: 'overview', label: 'Dashboard', icon: <Icons.Overview /> }, { id: 'chat', label: 'Research Chat', icon: <Icons.Chat /> }, { id: 'papers', label: 'Library', icon: <Icons.Papers /> }, { id: 'repos', label: 'Codebases', icon: <Icons.Repos /> }, { id: 'trends', label: 'Trends', icon: <Icons.Trends /> }, { id: 'ideas', label: 'Build Ideas', icon: <Icons.Ideas /> }, { id: 'snap2research', label: 'Snap2Research', icon: <Icons.Snap /> }, { id: 'audit', label: 'Telemetry', icon: <Icons.Audit /> }, { id: 'settings', label: 'Settings', icon: <Icons.Settings /> } ].map(item => ( <button key={item.id} onClick={() => setTab(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: tab === item.id ? 'var(--primary-light)' : 'transparent', color: tab === item.id ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: tab === item.id ? 700 : 500, marginBottom: 4 }}> {item.icon} <span style={{ fontSize: 13 }}>{item.label}</span> </button> ))} </nav>
        <button onClick={triggerPipeline} disabled={isRunning} className="btn btn-primary" style={{ width: '100%', borderRadius: 10, padding: '12px' }}><Icons.Zap /> {isRunning ? 'Running...' : 'Sync Digest'}</button>
      </aside>
      <div style={{ flex: 1, marginLeft: 'var(--sidebar-width)', display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: 64, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {user ? (
               <ProfileDropdown user={user} onLogout={() => setUser(null)} />
            ) : (
               <button onClick={() => setAuthMode('login')} className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13 }}>Sign In</button>
            )}
          </div>
        </header>
        <main style={{ padding: '40px 32px', flex: 1, maxWidth: 1400 }}>
          {tab === 'overview' && <OverviewView digest={digest} triggerPipeline={triggerPipeline} setTab={setTab} isRunning={isRunning} status={status} />}
          {tab === 'chat' && <div className="card" style={{ padding: 60, textAlign: 'center' }}><h3>Research Chat is restricted to premium members.</h3><p>Sign in to unlock RAG-enhanced paper analysis.</p></div>}
          {tab === 'papers' && <div className="animate-slide-up"><PageHeader title="Library" description="Full catalog of analyzed papers." />{(digest?.papers || []).map((p, i) => <PaperCard key={i} paper={p} index={i} />)}</div>}
          {tab === 'repos' && <div className="animate-slide-up"><PageHeader title="Codebases" description="Trending GitHub repositories." /><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>{(digest?.repos || []).map((r, i) => <RepoCard key={i} repo={r} index={i} />)}</div></div>}
          {tab === 'audit' && <div className="animate-slide-up"><PageHeader title="Telemetry" description="Real-time diagnostics." /><div className="card" style={{ padding: 24 }}>System Core: 100% Operational</div></div>}
        </main>
      </div>
      {authMode && <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => setAuthMode(null)} onAuth={(u) => { setUser(u); setAuthMode(null); setNotification({ msg: `Welcome, ${u.name}!`, type: 'success' }); setTimeout(() => setNotification(null), 3000) }} />}
      {notification && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 6000, background: 'white', padding: '16px 24px', borderRadius: 12, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, animation: 'slideUp 0.3s ease-out' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: notification.type === 'error' ? 'var(--error)' : 'var(--success)' }}></div><div style={{ fontSize: 14, fontWeight: 600 }}>{notification.msg}</div></div>}
    </div>
  )
}
