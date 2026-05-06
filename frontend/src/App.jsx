import { useState, useEffect, useCallback, useMemo } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, AreaChart, Area } from 'recharts'

// ── API Helper ────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
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

// ── Label Config ──────────────────────────────────────────────────────────────
const LABELS = {
  'Should Build': { color: '#2a14b4', bg: '#eef2ff', border: '#c7d2fe', icon: 'bolt' },
  'Should Learn': { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: 'menu_book' },
  'Should Watch': { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: 'visibility' },
  'Should Ignore': { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', icon: 'close' },
}

// ── Shared UI Components ──────────────────────────────────────────────────────

function ScoreBar({ value = 0, color = 'var(--primary)' }) {
  return (
    <div style={{ background: '#f1f5f9', borderRadius: '10px', height: 6, width: '100%', overflow: 'hidden' }}>
      <div style={{
        background: color,
        height: '100%',
        width: `${Math.min(100, value)}%`,
        transition: 'width 1s ease',
      }} />
    </div>
  )
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
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
      letterSpacing: '0.02em', display: 'inline-flex', alignItems: 'center', gap: 4,
      textTransform: 'uppercase'
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{cfg.icon}</span>
      {label}
    </span>
  )
}

function StatCard({ label, value, sub, color = 'var(--primary)', icon, trend }) {
  return (
    <div className="premium-card" style={{ padding: 24, flex: 1, minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ padding: 8, background: `${color}10`, color, borderRadius: '8px' }}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {trend && (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 2 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span> {trend}
          </span>
        )}
      </div>
      <div style={{ color: 'var(--on-surface-variant)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--on-surface)' }}>{value}</div>
      <div style={{ marginTop: 16, height: 4, background: '#f1f5f9', borderRadius: 'full', overflow: 'hidden' }}>
        <div style={{ width: '70%', height: '100%', background: color }} />
      </div>
    </div>
  )
}

function PaperCard({ paper, index }) {
  const [expanded, setExpanded] = useState(false)
  const [explainMode, setExplainMode] = useState('beginner')
  const [explanation, setExplanation] = useState(null)
  const [isExplaining, setIsExplaining] = useState(false)

  const handleExplain = async () => {
    setExpanded(true)
    if (!explanation || explanation.mode !== explainMode) {
      setIsExplaining(true)
      const r = await api(`/papers/${index}/explain`, { method: 'POST', body: JSON.stringify({ mode: explainMode }) })
      if (r?.explanation) setExplanation({ mode: explainMode, text: r.explanation })
      setIsExplaining(false)
    }
  }

  const scoreData = [
    { axis: 'Relevance', A: paper.relevanceScore || 50 },
    { axis: 'Novelty', A: paper.noveltyScore || 50 },
    { axis: 'Clarity', A: paper.clarityScore || 50 },
    { axis: 'Practical', A: paper.practicalityScore || 50 },
    { axis: 'Adoption', A: paper.adoptionScore || 50 },
  ]

  return (
    <div className="premium-card animate-fade" style={{ padding: 24, marginBottom: 16, animationDelay: `${index * 0.05}s` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <span style={{ background: '#f1f5f9', color: 'var(--on-surface-variant)', fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              Node #{index + 1} // {paper.researchArea || 'AI'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--outline)', fontWeight: 600 }}>Complexity: {paper.complexity || 'Institutional'}</span>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1.4, marginBottom: 8 }}>{paper.title}</h3>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', fontWeight: 500 }}>
            {(paper.authors || []).slice(0, 3).join(', ')}{paper.authors?.length > 3 ? ' et al.' : ''}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <LabelBadge label={paper.actionLabel} />
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{paper.overallScore || 50}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--outline)', textTransform: 'uppercase' }}>Score</div>
          </div>
        </div>
      </>
    )}
  </div>
)

      <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: 20 }}>
        {paper.tldr || paper.abstract?.slice(0, 180) + '...'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Novelty', val: paper.noveltyScore, color: '#3b82f6' },
          { label: 'Practical', val: paper.practicalityScore, color: '#10b981' },
          { label: 'Accuracy', val: paper.overallScore, color: '#f59e0b' },
        ].map(({ label, val, color }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--outline)' }}>{label}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color }}>{val || 50}</span>
            </div>
            <ScoreBar value={val} color={color} />
          </div>
        ))}
      </div>

      {expanded && (
        <div className="animate-fade" style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: 24, marginTop: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
            <div>
              {paper.keyContributions?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: 12 }}>Key Contributions</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {paper.keyContributions.map((k, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--on-surface)' }}>
                        <span style={{ color: 'var(--primary)' }}>•</span> {k}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {paper.keyTakeaway && (
                <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', marginBottom: 8 }}>AI SYNTHESIS</h4>
                  <p style={{ fontSize: 13, color: 'var(--on-surface)', lineHeight: 1.6 }}>{paper.keyTakeaway}</p>
                </div>
              )}
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={scoreData}>
                  <PolarGrid stroke="var(--outline-variant)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--outline)', fontSize: 10, fontWeight: 600 }} />
                  <Radar name="Metrics" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <a href={paper.arxivUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '8px 16px', fontSize: 12, textDecoration: 'none' }}>
          Open Abstract
        </a>
        <button onClick={handleExplain} disabled={isExplaining} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>
          {isExplaining ? 'Processing...' : 'Deep Explain'}
        </button>
        <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', color: 'var(--outline)', fontSize: 12, fontWeight: 700, marginLeft: 'auto', cursor: 'pointer' }}>
          {expanded ? 'Show Less' : 'Full Analysis'}
        </button>
      </div>

      {expanded && explanation && (
        <div className="animate-fade" style={{ marginTop: 20, padding: 24, background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#2a14b4', textTransform: 'uppercase' }}>Neural Synthesis Result</span>
            <select value={explainMode} onChange={(e) => setExplainMode(e.target.value)} style={{ background: 'white', border: '1px solid var(--outline-variant)', borderRadius: '6px', fontSize: 11, padding: '4px 8px' }}>
              <option value="beginner">Beginner</option>
              <option value="developer">Developer</option>
              <option value="researcher">Researcher</option>
            </select>
          </div>
          <p style={{ fontSize: 14, color: 'var(--on-surface)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{explanation.text}</p>
        </div>
      )}
    </div>
  )
}

function RepoCard({ repo, index }) {
  const scoreData = [
    { name: 'Fresh', val: repo.freshnessScore || 60 },
    { name: 'Build', val: repo.buildFeasibilityScore || 60 },
    { name: 'Docs', val: repo.documentationScore || 60 },
    { name: 'Repro', val: repo.reproducibilityScore || 60 },
  ]
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1']

const AuthModal = ({ mode, setMode, onClose, onAuth }) => {
  const [email, setEmail] = useState(''); const [pass, setPass] = useState(''); const [name, setName] = useState('')
  return (
    <div className="premium-card animate-fade" style={{ padding: 24, marginBottom: 16, animationDelay: `${index * 0.05}s` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 10, background: '#eff6ff', color: '#2a14b4', borderRadius: '12px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>account_tree</span>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>{repo.name?.split('/')[1] || repo.name}</h3>
            <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', fontWeight: 500 }}>{repo.name?.split('/')[0]}</p>
          </div>
        </div>
        <LabelBadge label={repo.usabilityLabel} />
      </div>

      <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', lineHeight: 1.5, marginBottom: 20 }}>
        {repo.quickSummary || repo.description}
      </p>

      <div style={{ height: 100, marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={scoreData}>
            <XAxis dataKey="name" tick={{ fill: 'var(--outline)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'white', borderRadius: '8px', border: '1px solid var(--outline-variant)', fontSize: 12 }} />
            <Bar dataKey="val" radius={[4, 4, 0, 0]}>
              {scoreData.map((_, i) => <Cell key={i} fill={colors[i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <a href={repo.url} target="_blank" rel="noreferrer" className="btn-secondary" style={{
        width: '100%', textAlign: 'center', textDecoration: 'none', display: 'block', padding: '10px 0'
      }}>View on GitHub →</a>
    </div>
  )
}

const ProfileDropdown = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="premium-card animate-fade" style={{ padding: '16px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16, animationDelay: `${index * 0.08}s` }}>
      <div style={{ fontSize: 24, padding: 12, background: '#f8fafc', borderRadius: '12px' }}>{trend.emoji}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>{trend.trend}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)' }}>+{trend.momentum}%</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 8 }}>{trend.description}</p>
        <ScoreBar value={trend.momentum} color="var(--primary)" />
      </div>
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

  useEffect(() => {
    if (tab === 'trends' && !liveTrends && !isLoadingTrends && digest?.papers?.length > 0) {
      setIsLoadingTrends(true)
      api('/trends').then(r => {
        setLiveTrends(r)
        setIsLoadingTrends(false)
      })
    }
  }, [tab, digest, liveTrends, isLoadingTrends])

  useEffect(() => {
    const interval = setInterval(async () => {
      const s = await api('/status')
      if (s) {
        setStatus(s)
        if (!s.isRunning && isRunning) {
          setIsRunning(false)
          loadData()
          notify('✅ Pipeline complete! Digest updated.')
        }
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [isRunning, loadData])

  const handleChat = async () => {
    if (!chatInput.trim() || isChatting) return
    const msg = chatInput
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: msg }])
    setIsChatting(true)
    const r = await api('/research-chat', { method: 'POST', body: JSON.stringify({ question: msg }) })
    if (r?.answer) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: r.answer, sources: r.sources || [] }])
    } else {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error answering your question.', sources: [] }])
    }
    setIsChatting(false)
  }

  const triggerPipeline = async () => {
    if (isRunning) return
    setIsRunning(true)
    notify('🚀 Pipeline started! Scouting papers & repos...', 'info')
    // Set skipEmail to true so it doesn't automatically send the email
    await api('/pipeline/run', { method: 'POST', body: JSON.stringify({ skipEmail: true }) })
  }

  const sendDigestEmail = async () => {
    if (isSendingEmail || !digest) return
    setIsSendingEmail(true)
    notify('📧 Sending digest to recipients...', 'info')
    const r = await api('/email/send', { method: 'POST', body: JSON.stringify({}) })
    if (r && !r.error && r.success !== false) {
      notify('✅ Digest emailed successfully!')
    } else {
      notify(`❌ Error sending email: ${r?.error || 'Unknown error'}`, 'error')
    }
    setIsSendingEmail(false)
  }

  const sendEmail = async () => {
    if (!emailInput) return
    setEmailStatus('sending')
    const r = await api('/email/test', { method: 'POST', body: JSON.stringify({ email: emailInput }) })
    setEmailStatus(r?.success ? 'sent' : 'error')
    notify(r?.success ? '✅ Test email sent!' : `❌ Error: ${r?.error}`, r?.success ? 'success' : 'error')
  }

  const handleValidateIdea = async () => {
    if (!validateInput.trim() || isValidating) return
    setIsValidating(true)
    setValidateResult(null)
    const r = await api('/validate', { method: 'POST', body: JSON.stringify({ idea: validateInput }) })
    setValidateResult(r)
    setIsValidating(false)
  }

  const handleGeneratePitch = async (index) => {
    setLoadingPitch(index)
    const r = await api(`/ideas/${index}/pitch`, { method: 'POST' })
    if (r?.pitch) {
      setPitchModal({ index, pitch: r.pitch, ideaName: ideas[index]?.name })
    } else {
      notify('❌ Failed to generate pitch. Try again.', 'error')
    }
    setLoadingPitch(null)
  }

  const papers = digest?.papers || []
  const repos = digest?.repos || []
  const trends = digest?.trends || {}
  const stats = digest?.stats || {}

  const filteredPapers = papers.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.actionLabel === filter
    return matchSearch && matchFilter
  })

  const filteredRepos = repos.filter(r => {
    const matchSearch = !search || r.name?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || r.usabilityLabel === filter
    return matchSearch && matchFilter
  })

  const ideas = digest?.buildIdeas || []

  const TABS = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'papers', label: 'Research Library', icon: 'menu_book' },
    { id: 'repos', label: 'Codebase Audit', icon: 'biotech' },
    { id: 'trends', label: 'Trend Radar', icon: 'radar' },
    { id: 'chat', label: 'Research Console', icon: 'terminal' },
    { id: 'settings', label: 'System Settings', icon: 'settings' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--background)' }}>

      {/* Side Nav */}
      <aside style={{
        width: 'var(--sidebar-width)', background: '#f8fafc', borderRight: '1px solid var(--outline-variant)',
        position: 'fixed', top: 0, bottom: 0, left: 0, display: 'flex', flexDirection: 'column', padding: '24px 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, padding: '0 8px' }}>
          <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <span className="material-symbols-outlined">science</span>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Research Console</div>
            <div style={{ fontSize: 10, color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Institutional Access</div>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`sidebar-link ${tab === t.id ? 'active' : ''}`} style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '16px 8px' }}>
          <button onClick={() => setTab('chat')} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            New Analysis
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, marginLeft: 'var(--sidebar-width)', display: 'flex', flexDirection: 'column' }}>
        {/* Top Nav */}
        <header style={{
          height: 'var(--header-height)', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--outline-variant)', position: 'sticky', top: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--on-surface)' }}>OpenScholar <span style={{ color: 'var(--primary)' }}>AI</span></div>
            <nav style={{ display: 'flex', gap: 24 }}>
              {['Overview', 'Research', 'Analytics'].map(n => (
                <button key={n} style={{ background: 'none', border: 'none', color: n === 'Overview' ? 'var(--primary)' : 'var(--on-surface-variant)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{n}</button>
              ))}
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--outline)' }}>search</span>
              <input type="text" placeholder="Search research library..." style={{
                background: '#f1f5f9', border: '1px solid var(--outline-variant)', borderRadius: '100px', padding: '8px 16px 8px 40px',
                fontSize: 13, width: 260, outline: 'none'
              }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {['notifications', 'help_outline'].map(i => (
                <button key={i} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined">{i}</span>
                </button>
              ))}
            </div>
            <div style={{ width: 32, height: 32, borderRadius: 'full', background: '#e2e8f0', border: '1px solid var(--outline-variant)', overflow: 'hidden' }}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
            </div>
          </div>
        </header>

        {notification && (
          <div className="animate-fade" style={{
            position: 'fixed', bottom: 32, right: 32, zIndex: 1000,
            background: notification.type === 'error' ? '#fee2e2' : '#ecfdf5',
            color: notification.type === 'error' ? '#b91c1c' : '#047857',
            border: `1px solid ${notification.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
            padding: '12px 24px', borderRadius: '8px', fontWeight: 600, fontSize: 14,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
          }}>
            {notification.msg}
          </div>
        )}

        {/* Content */}
      <main style={{ flex: 1, padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        {/* ── Overview Tab ── */}
        {tab === 'overview' && (
          <div className="animate-fade">
            {/* Hero Section: Initialize Research Engine */}
            <section className="premium-card" style={{
              background: 'white', padding: '48px 64px', display: 'flex', alignItems: 'center', gap: 48, marginBottom: 32, overflow: 'hidden', position: 'relative'
            }}>
              <div style={{ flex: 1, zIndex: 10 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: '#eff6ff', color: 'var(--primary)', borderRadius: '20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 24 }}>
                  <span style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
                  Neural Engine Active
                </div>
                <h1 style={{ fontSize: 42, fontWeight: 800, color: 'var(--on-surface)', lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.02em' }}>
                  Scale your discovery with <span style={{ color: 'var(--primary)' }}>OpenScholar AI</span>.
                </h1>
                <p style={{ fontSize: 16, color: 'var(--on-surface-variant)', marginBottom: 32, lineHeight: 1.6, maxWidth: 540 }}>
                  Synthesize multi-modal research repositories, perform automated technical audits, and generate peer-reviewed level insights with our latest LLM architecture.
                </p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <button onClick={triggerPipeline} disabled={isRunning} className="btn-primary" style={{ padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isRunning ? 'Executing...' : 'Initialize Research Engine'}
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>bolt</span>
                  </button>
                  <button className="btn-secondary" style={{ padding: '14px 28px' }}>View Documentation</button>
                </div>
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div className="premium-card" style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                  <img src="https://lh3.googleusercontent.com/aida/ADBb0uh1t5x9P5A1EM_tYxqbz6__MKLCJmgrcjSQ6SNQUAiI6rIrvhzYuHSCxNi3h335XpvH0dwFp7U4IdGIZxu0uIk6eRM-xYT6tNCsNbMd6gdoeiW_rIXiQH74366oYSCBbdXyLeNYSZcMh3-B8IEDkWW6ZlOvIktEFmf4hAAPQ5U-ZaiPNBYVwahq1CeUzP9Y1P9-fxF8nXMmd1kzvQUBtd9hjbqlCsBr42bs25DhW1UJltQPcj7DGcnEeCZhc6bgWhwpUKbZcJvh7LU" alt="Neural Trace" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
              </div>
            </section>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
              <StatCard label="Papers Analyzed" value={(stats.papersAnalyzed || 0).toLocaleString()} trend="+12%" color="#3b82f6" icon="library_books" />
              <StatCard label="Repos Audited" value={(stats.reposAnalyzed || 0).toLocaleString()} trend="+8%" color="#6366f1" icon="code" />
              <StatCard label="Inference Accuracy" value="99.98%" color="#10b981" icon="verified" />
              <StatCard label="Global Latency" value="14.2ms" color="#f59e0b" icon="speed" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
              {/* Top Papers Section */}
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)' }}>Top Research Nodes</h2>
                  <button onClick={() => setTab('papers')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    View All <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {papers.slice(0, 3).map((p, i) => <PaperCard key={i} paper={p} index={i} />)}
                </div>
              </section>

              {/* Intelligence Feed */}
              <section className="premium-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline-variant)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>Recent Intelligence</h3>
                  <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Global breakthroughs in last 24h</p>
                </div>
                <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {[
                    { topic: 'Quantum Computing', time: '2m ago', title: 'Superconductivity breakthrough in room-temp conditions', meta: 'Nature Rep.' },
                    { topic: 'Oncology Research', time: '14m ago', title: 'Targeted T-Cell delivery via nano-particles', meta: 'Audit Pass' },
                    { topic: 'Astrophysics', time: '1h ago', title: 'Anomalous radio signals from Proxima Centauri', meta: 'JWST Sync' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16 }}>
                      <div style={{ width: 8, height: 8, background: i === 0 ? 'var(--primary)' : '#e2e8f0', borderRadius: '50%', marginTop: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.topic}</span>
                          <span style={{ fontSize: 10, color: 'var(--outline)' }}>{item.time}</span>
                        </div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4 }}>{item.title}</h4>
                        <div style={{ display: 'inline-flex', padding: '2px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: 10, color: 'var(--on-surface-variant)', fontWeight: 600 }}>{item.meta}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 16, borderTop: '1px solid var(--outline-variant)' }}>
                  <button onClick={() => setTab('trends')} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>View All Intelligence</button>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ── Papers Tab ── */}
        {tab === 'papers' && (
          <div className="animate-fade">
            <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 300 }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }}>search</span>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search across 1.2M+ papers..."
                  style={{
                    width: '100%', background: 'white', border: '1px solid var(--outline-variant)',
                    borderRadius: '12px', padding: '14px 16px 14px 48px', color: 'var(--on-surface)', fontSize: 14, outline: 'none',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['all', 'Should Build', 'Should Learn', 'Should Watch', 'Should Ignore'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    background: filter === f ? 'var(--primary)' : 'white',
                    border: `1px solid ${filter === f ? 'var(--primary)' : 'var(--outline-variant)'}`,
                    color: filter === f ? 'white' : 'var(--on-surface-variant)',
                    borderRadius: '8px', padding: '0 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>{f === 'all' ? 'All Signals' : f.replace('Should ', '')}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, fontWeight: 600 }}>Showing {filteredPapers.length} analysis results</p>
              <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>Sort: Relevance</button>
            </div>
            {filteredPapers.length === 0 && (
              <div className="premium-card" style={{ textAlign: 'center', padding: 64, color: 'var(--outline)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16 }}>manage_search</span>
                <p>No research matches your current filters.</p>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(600px, 1fr))', gap: 24 }}>
              {filteredPapers.map((p, i) => <PaperCard key={i} paper={p} index={i} />)}
            </div>
          </div>
        )}

        {/* ── Repos Tab ── */}
        {tab === 'repos' && (
          <div className="animate-fade">
            <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 300 }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }}>search</span>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Audit technical repositories..."
                  style={{
                    width: '100%', background: 'white', border: '1px solid var(--outline-variant)',
                    borderRadius: '12px', padding: '14px 16px 14px 48px', color: 'var(--on-surface)', fontSize: 14, outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['all', 'Should Build', 'Should Learn', 'Should Watch'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    background: filter === f ? 'var(--primary)' : 'white',
                    border: `1px solid ${filter === f ? 'var(--primary)' : 'var(--outline-variant)'}`,
                    color: filter === f ? 'white' : 'var(--on-surface-variant)',
                    borderRadius: '8px', padding: '0 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}>{f === 'all' ? 'All Repos' : f.replace('Should ', '')}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
              {filteredRepos.map((r, i) => <RepoCard key={i} repo={r} index={i} />)}
            </div>
          </div>
        )}

        {/* ── Chat Tab ── */}
        {tab === 'chat' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
            <div className="premium-card" style={{ padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ padding: 8, background: '#eff6ff', color: 'var(--primary)', borderRadius: '8px' }}>
                <span className="material-symbols-outlined">terminal</span>
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>Research Console</h2>
                <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Direct neural interface for multi-modal analysis</p>
              </div>
            </div>
            
            <div className="premium-card" style={{ flex: 1, marginBottom: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, padding: 32, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, background: '#f8fafc' }}>
                {chatMessages.length === 0 && (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--outline)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16, display: 'block' }}>forum</span>
                    <p style={{ fontSize: 14, fontWeight: 500 }}>Awaiting your research inquiry...</p>
                  </div>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i} style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    <div style={{
                      background: m.role === 'user' ? 'var(--primary)' : 'white',
                      color: m.role === 'user' ? 'white' : 'var(--on-surface)',
                      padding: '16px 20px',
                      borderRadius: m.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                      boxShadow: 'var(--shadow-sm)',
                      fontSize: 14,
                      lineHeight: 1.6,
                      border: m.role === 'user' ? 'none' : '1px solid var(--outline-variant)'
                    }}>
                      {m.content}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--outline)', textAlign: m.role === 'user' ? 'right' : 'left', textTransform: 'uppercase' }}>
                      {m.role === 'user' ? 'You' : 'OpenScholar AI'}
                    </span>
                  </div>
                ))}
                {isChatting && (
                  <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 8, alignItems: 'center', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>
                    <span className="material-symbols-outlined" style={{ animation: 'spin 2s linear infinite' }}>autorenew</span>
                    Synthesizing response...
                  </div>
                )}
              </div>

              <div style={{ padding: 24, background: 'white', borderTop: '1px solid var(--outline-variant)' }}>
                <div style={{ position: 'relative', display: 'flex', gap: 12 }}>
                  <input
                    value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleChat()}
                    placeholder="Ask about specific papers, trends, or technical audits..."
                    style={{
                      flex: 1, background: '#f1f5f9', border: '1px solid var(--outline-variant)', borderRadius: '12px',
                      padding: '14px 20px', color: 'var(--on-surface)', fontSize: 14, outline: 'none'
                    }}
                  />
                  <button onClick={handleChat} disabled={isChatting || !chatInput.trim()} className="btn-primary" style={{ padding: '0 24px', borderRadius: '12px' }}>
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Trends Tab ── */}
        {tab === 'trends' && (
          <div className="animate-fade">
            <div className="premium-card" style={{ padding: 32, marginBottom: 40, background: 'linear-gradient(135deg, white, #f8faff)', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>radar</span>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--on-surface)' }}>Trend Radar</h2>
              </div>
              <p style={{ fontSize: 16, color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
                {liveTrends?.weeklySummary || "Global breakthroughs in multi-modal LLMs and autonomous agents are accelerating. Our neural trace identifies a significant shift towards room-temperature superconductivity and targeted nano-delivery systems."}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
              {(liveTrends?.trends || [
                { topic: 'Neural Architecture', direction: 'up', count: 124, explanation: 'Massive shift towards sparse MoE models for edge device deployment.', relatedPapers: ['ArXiv:2403.1102', 'ArXiv:2403.1105'] },
                { topic: 'Bio-Computing', direction: 'up', count: 82, explanation: 'Synthetic protein folding via geometric deep learning showing 40% accuracy gains.', relatedPapers: ['Nature:Bio-2024'] },
                { topic: 'Quantum Safety', direction: 'stable', count: 45, explanation: 'Post-quantum cryptography standards finalizing for institutional integration.', relatedPapers: ['NIST-PQ-04'] },
              ]).map((t, i) => (
                <div key={i} className="premium-card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>{t.topic}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: t.direction === 'up' ? '#ecfdf5' : '#f8fafc', color: t.direction === 'up' ? '#10b981' : 'var(--outline)', borderRadius: '4px', fontSize: 10, fontWeight: 700 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{t.direction === 'up' ? 'trending_up' : 'trending_flat'}</span>
                      {t.direction?.toUpperCase()} // {t.count} NODES
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 20, lineHeight: 1.6 }}>{t.explanation}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(t.relatedPapers || []).map((rp, idx) => (
                      <span key={idx} style={{ padding: '4px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: 10, color: 'var(--primary)', fontWeight: 600 }}>{rp}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Ideas Tab ── */}
        {tab === 'ideas' && (
          <div className="animate-fade">
            {/* Hypothesis Validation Module */}
            <div className="premium-card" style={{
              background: 'linear-gradient(135deg, white, #eff6ff)',
              padding: 32, marginBottom: 40, position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>psychology</span>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)' }}>Hypothesis Validation</h2>
                </div>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, marginBottom: 24 }}>
                  Input a project idea to receive an instant feasibility verdict based on our 1.2M+ paper dataset.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    value={validateInput}
                    onChange={e => setValidateInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleValidateIdea()}
                    placeholder="Describe your research project or product idea..."
                    style={{
                      flex: 1, background: 'white', border: '1px solid var(--outline-variant)',
                      borderRadius: '12px', padding: '14px 18px', color: 'var(--on-surface)', fontSize: 14, outline: 'none'
                    }}
                  />
                  <button onClick={handleValidateIdea} disabled={isValidating || !validateInput.trim()} className="btn-primary" style={{ padding: '0 32px' }}>
                    {isValidating ? 'Analyzing...' : 'Validate'}
                  </button>
                </div>
              </div>
              {validateResult && (
                <div className="animate-fade" style={{ marginTop: 32, background: 'white', borderRadius: '12px', border: '1px solid var(--outline-variant)', padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <span style={{
                      background: validateResult.verdict === 'BUILD' ? '#ecfdf5' : '#fef3c7',
                      color: validateResult.verdict === 'BUILD' ? '#10b981' : '#d97706',
                      padding: '4px 16px', borderRadius: '20px', fontSize: 12, fontWeight: 800
                    }}>{validateResult.verdict}</span>
                    <span style={{ fontSize: 12, color: 'var(--outline)', fontWeight: 600 }}>Time to MVP: {validateResult.mvpTime}</span>
                  </div>
                  <p style={{ color: 'var(--on-surface)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{validateResult.verdictReason}</p>
                  <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 12 }}>Unique Angle: </span>
                    <span style={{ color: 'var(--on-surface-variant)', fontSize: 13 }}>{validateResult.suggestedTwist}</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: 24 }}>
              {ideas.map((idea, idx) => (
                <div key={idx} className="premium-card animate-fade" style={{ padding: 24, animationDelay: `${idx * 0.1}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <span style={{ padding: '2px 8px', background: '#eff6ff', color: 'var(--primary)', borderRadius: '4px', fontSize: 10, fontWeight: 700 }}>{idea.actionLabel || 'BUILD'}</span>
                        <span style={{ padding: '2px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: 10, color: 'var(--outline)', fontWeight: 600 }}>{idea.difficulty?.toUpperCase()}</span>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>{idea.name}</h3>
                      <p style={{ fontSize: 12, color: 'var(--primary)', fontStyle: 'italic', fontWeight: 600 }}>"{idea.pitchLine}"</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{idea.impactScore}</div>
                      <div style={{ fontSize: 10, color: 'var(--outline)', fontWeight: 700 }}>IMPACT SCORE</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div style={{ padding: 12, background: '#fff1f2', borderRadius: '8px' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#e11d48', marginBottom: 4 }}>TARGET PROBLEM</div>
                      <p style={{ fontSize: 12, color: '#9f1239', lineHeight: 1.5 }}>{idea.problem}</p>
                    </div>
                    <div style={{ padding: 12, background: '#f0fdf4', borderRadius: '8px' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#16a34a', marginBottom: 4 }}>PROPOSED SOLUTION</div>
                      <p style={{ fontSize: 12, color: '#166534', lineHeight: 1.5 }}>{idea.solution}</p>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--outline)', fontWeight: 700 }}>AUDIENCE: {idea.targetUsers?.toUpperCase()}</span>
                    <button onClick={() => handleGeneratePitch(idx)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>
                      {loadingPitch === idx ? 'Generating...' : 'Generate Pitch'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pitchModal && (
          <div className="animate-fade" style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(12px)'
          }} onClick={() => setPitchModal(null)}>
            <div className="premium-card animate-scale" style={{
              background: 'white', padding: 40, maxWidth: 800, width: '100%', maxHeight: '90vh',
              overflowY: 'auto', position: 'relative'
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', marginBottom: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>campaign</span>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pitch Package Extracted</span>
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.01em' }}>{pitchModal.ideaName}</h2>
                </div>
                <button onClick={() => setPitchModal(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--outline)' }}>close</span>
                </button>
              </div>

              <div style={{ background: '#eff6ff', borderRadius: '16px', padding: 32, marginBottom: 32, border: '1px solid #dbeafe' }}>
                <p style={{ fontSize: 18, color: 'var(--primary)', lineHeight: 1.7, fontWeight: 600 }}>{pitchModal.pitch.elevatorPitch}</p>
              </div>

              <div style={{ display: 'grid', gap: 32 }}>
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Operational Script</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {pitchModal.pitch.demoScript?.map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 16, padding: 16, background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>{i + 1}</span>
                        <p style={{ fontSize: 14, color: 'var(--on-surface)', lineHeight: 1.5 }}>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div style={{ padding: 24, background: '#fffbeb', borderRadius: '16px', border: '1px solid #fef3c7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#d97706' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>stars</span>
                      <span style={{ fontSize: 12, fontWeight: 800 }}>JUDGES HOOK</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#92400e', lineHeight: 1.6 }}>{pitchModal.pitch.judgesHook}</p>
                  </div>
                  <div style={{ padding: 24, background: '#f0fdf4', borderRadius: '16px', border: '1px solid #dcfce7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#16a34a' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>schedule</span>
                      <span style={{ fontSize: 12, fontWeight: 800 }}>WHY NOW</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#166534', lineHeight: 1.6 }}>{pitchModal.pitch.whyNow}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Settings Tab ── */}
        {tab === 'settings' && (
          <div className="animate-fade" style={{ maxWidth: 800 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 32 }}>System Configuration</h2>

            <div style={{ display: 'grid', gap: 24 }}>
              <div className="premium-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 16 }}>Communication Vetting</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, marginBottom: 20 }}>Verify SMTP connectivity and notification delivery vectors.</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    value={emailInput} onChange={e => setEmailInput(e.target.value)}
                    placeholder="Enter recipient email..."
                    type="email"
                    style={{
                      flex: 1, background: '#f8fafc', border: '1px solid var(--outline-variant)',
                      borderRadius: '8px', padding: '12px 16px', color: 'var(--on-surface)', fontSize: 13, outline: 'none'
                    }}
                  />
                  <button onClick={sendEmail} className="btn-secondary" style={{ padding: '0 24px' }}>
                    {emailStatus === 'sending' ? 'Sending...' : 'Test Sync'}
                  </button>
                </div>
              </div>

              <div className="premium-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 20 }}>Execution Log</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(status?.runHistory || []).map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 8, height: 8, background: r.success ? '#10b981' : '#ef4444', borderRadius: '50%' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)' }}>{new Date(r.runAt).toLocaleString()}</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--outline)', fontWeight: 700 }}>
                        {r.success ? `PAYLOAD: ${r.papers}P // ${r.repos}R` : `FAILURE: ${r.error?.slice(0, 30)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-card" style={{ padding: 24, background: '#f8fafc' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 16 }}>Security Environment</h3>
                <pre style={{ fontSize: 11, color: 'var(--outline)', lineHeight: 1.8, background: 'white', padding: 20, borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {`ANTHROPIC_API_KEY=********************\nGITHUB_TOKEN=********************\nRESEARCH_TOPICS=LLM,RAG,AGENTS,MULTIMODAL`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Institutional Footer */}
      <footer style={{
        borderTop: '1px solid var(--outline-variant)', padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 24, height: 24, background: 'var(--primary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'white' }}>school</span>
          </div>
          <span style={{ color: 'var(--on-surface-variant)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            OpenScholar AI // Institutional Protocol // v4.2.0
          </span>
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {digest?.generatedAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} />
              <span style={{ color: 'var(--outline)', fontSize: 11, fontWeight: 600 }}>
                System Synced: {new Date(digest.generatedAt).toLocaleTimeString()}
              </span>
            </div>
          )}
          <span style={{ color: 'var(--outline)', fontSize: 11, fontWeight: 600 }}>© 2026 Advanced Research Labs</span>
        </div>
      </footer>
    </div>
    </div>
  )
}
