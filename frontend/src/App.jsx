import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, AreaChart, Area
} from 'recharts'

// ── API Helper ────────────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = async (path, opts = {}) => {
  try {
    const r = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opts
    })
    if (!r.ok) {
      const errData = await r.json().catch(() => ({}));
      return { error: errData.error || `HTTP ${r.status}` };
    }
    return await r.json()
  } catch (err) {
    console.error(`[API Error] ${path}:`, err);
    return { error: "Network error or server unreachable" };
  }
}

// ── Shared UI Components ──────────────────────────────────────────────────────

const LabelBadge = ({ label }) => {
  const configs = {
    'Should Build': { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: 'bolt' },
    'Should Learn': { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: 'menu_book' },
    'Should Watch': { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: 'visibility' },
    'Should Ignore': { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', icon: 'close' },
    'BUILD': { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: 'auto_awesome' },
    'RESEARCH': { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: 'science' }
  }
  const cfg = configs[label] || configs['Should Watch']
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

const ScoreBar = ({ value = 0, color = 'var(--primary)' }) => (
  <div style={{ background: '#f1f5f9', borderRadius: 99, height: 5, width: '100%', overflow: 'hidden' }}>
    <div style={{ background: color, height: '100%', width: `${Math.min(100, value)}%`, borderRadius: 99, transition: 'width 1s ease' }} />
  </div>
)

const StatCard = ({ label, value, trend, color, icon }) => (
  <div className="premium-card" style={{ padding: 24, flex: 1, minWidth: 200 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
      <div style={{ padding: 8, background: `${color}15`, color, borderRadius: '8px' }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      {trend && (
        <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 2 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span> {trend}
        </span>
      )}
    </div>
    <div style={{ color: 'var(--on-surface-variant)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--on-surface)' }}>{value}</div>
  </div>
)

// ── Feature Cards ─────────────────────────────────────────────────────────────

function PaperCard({ paper, index }) {
  const [expanded, setExpanded] = useState(false)
  const [explainMode, setExplainMode] = useState('beginner')
  const [explanation, setExplanation] = useState(null)
  const [isExplaining, setIsExplaining] = useState(false)

  const handleExplain = async () => {
    setExpanded(true)
    if (!explanation || explanation.mode !== explainMode) {
      setIsExplaining(true)
      const r = await api(`/papers/${paper.id || index}/explain`, { 
        method: 'POST', 
        body: JSON.stringify({ mode: explainMode }) 
      })
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
              {paper.researchArea || 'General AI'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--outline)', fontWeight: 600 }}>Complexity: {paper.complexity || 'Intermediate'}</span>
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
      </div>

      <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: 20 }}>
        {paper.tldr || (paper.abstract?.length > 180 ? paper.abstract.slice(0, 180) + '...' : paper.abstract)}
      </p>

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
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>Neural Synthesis Result</span>
            <select value={explainMode} onChange={(e) => setExplainMode(e.target.value)} style={{ background: 'white', border: '1px solid var(--outline-variant)', borderRadius: '6px', fontSize: 11, padding: '4px 8px' }}>
              <option value="beginner">Beginner</option>
              <option value="developer">Developer</option>
              <option value="researcher">Researcher</option>
            </select>
          </div>
          <div style={{ fontSize: 14, color: 'var(--on-surface)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }} className="markdown-content">
            {explanation.text}
          </div>
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

  return (
    <div className="premium-card animate-fade" style={{ padding: 24, marginBottom: 16, animationDelay: `${index * 0.05}s` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 10, background: '#eff6ff', color: 'var(--primary)', borderRadius: '12px' }}>
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

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', fontWeight: 600 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>star</span>
          {repo.stars?.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', fontWeight: 600 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>fork_right</span>
          {repo.forks?.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, marginLeft: 'auto' }}>
          {repo.language}
        </div>
      </div>

      <a href={repo.url} target="_blank" rel="noreferrer" className="btn-secondary" style={{
        width: '100%', textAlign: 'center', textDecoration: 'none', display: 'block', padding: '10px 0'
      }}>View on GitHub →</a>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState('overview')
  const [digest, setDigest] = useState(null)
  const [status, setStatus] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [notification, setNotification] = useState(null)

  // Chat State
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [isChatting, setIsChatting] = useState(false)
  
  // Validation State
  const [validateInput, setValidateInput] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validateResult, setValidateResult] = useState(null)
  
  // Pitch State
  const [loadingPitch, setLoadingPitch] = useState(null)
  const [pitchModal, setPitchModal] = useState(null)

  // Settings State
  const [emailInput, setEmailInput] = useState('')
  const [emailStatus, setEmailStatus] = useState(null)

  // Trends State
  const [liveTrends, setLiveTrends] = useState(null)
  const [isLoadingTrends, setIsLoadingTrends] = useState(false)

  // Auth State
  const [user, setUser] = useState(null)
  const [authModal, setAuthModal] = useState(null) // 'login' | 'signup' | null
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' })

  // Search State
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)
  const [imageResearchData, setImageResearchData] = useState(null)
  const fileInputRef = useRef(null)

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const loadData = useCallback(async () => {
    const d = await api('/digest')
    if (d && !d.error) setDigest(d)
    const s = await api('/status')
    if (s && !s.error) setStatus(s)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Polling for pipeline status
  useEffect(() => {
    const interval = setInterval(async () => {
      const s = await api('/status')
      if (s && !s.error) {
        setStatus(s)
        if (!s.isRunning && isRunning) {
          setIsRunning(false)
          loadData()
          notify('✅ Pipeline complete! Digest updated.')
        } else if (s.isRunning && !isRunning) {
          setIsRunning(true)
        }
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [isRunning, loadData])

  // Load trends if tab is active
  useEffect(() => {
    if (tab === 'trends' && !liveTrends && !isLoadingTrends && digest?.papers?.length > 0) {
      setIsLoadingTrends(true)
      api('/trends').then(r => {
        if (r && !r.error) setLiveTrends(r)
        setIsLoadingTrends(false)
      })
    }
  }, [tab, digest, liveTrends, isLoadingTrends])

  const triggerPipeline = async () => {
    if (isRunning) return
    setIsRunning(true)
    notify('🚀 Pipeline started! Scouting papers & repos...', 'info')
    await api('/pipeline/run', { method: 'POST', body: JSON.stringify({ skipEmail: true }) })
  }

  const handleGlobalSearch = async () => {
    if (!search.trim() || isSearching) return
    setIsSearching(true)
    setTab('search')
    notify(`🔍 Searching for "${search}"...`, 'info')
    
    const r = await api('/papers/search', { 
      method: 'POST', 
      body: JSON.stringify({ query: search }) 
    })
    
    if (r && !r.error) {
      setSearchResults(r)
      notify(`✅ Found ${r.papers?.length || 0} results ${r.source === 'web' ? 'from ArXiv' : 'in dashboard'}`)
    } else {
      notify(`❌ Search failed: ${r?.error}`, 'error')
    }
    setIsSearching(false)
  }

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
      setChatMessages(prev => [...prev, { role: 'assistant', content: r.error || 'Sorry, I encountered an error.', sources: [] }])
    }
    setIsChatting(false)
  }

  const handleValidateIdea = async () => {
    if (!validateInput.trim() || isValidating) return
    setIsValidating(true)
    setValidateResult(null)
    const r = await api('/validate', { method: 'POST', body: JSON.stringify({ idea: validateInput }) })
    if (r && !r.error) setValidateResult(r)
    else notify(`❌ Error: ${r?.error || 'Validation failed'}`, 'error')
    setIsValidating(false)
  }

  const handleGeneratePitch = async (index) => {
    setLoadingPitch(index)
    const r = await api(`/ideas/${index}/pitch`, { method: 'POST' })
    if (r?.pitch) {
      setPitchModal({ index, pitch: r.pitch, ideaName: (digest?.buildIdeas || [])[index]?.name })
    } else {
      notify('❌ Failed to generate pitch. Try again.', 'error')
    }
    setLoadingPitch(null)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setSelectedImage(URL.createObjectURL(file))
    setIsAnalyzingImage(true)
    setImageResearchData(null)
    setTab('snap') // Switch to Snap tab

    const formData = new FormData()
    formData.append('image', file)

    try {
      const r = await fetch(`${API_URL}/image-research`, {
        method: 'POST',
        body: formData
      })
      const data = await r.json()
      if (data.success) {
        setImageResearchData(data)
        notify('✅ Image analyzed! Research nodes found.')
      } else {
        notify(`❌ ${data.error || 'Analysis failed'}`, 'error')
      }
    } catch (err) {
      notify('❌ Network error during analysis', 'error')
    } finally {
      setIsAnalyzingImage(false)
    }
  }

  const sendTestEmail = async () => {
    if (!emailInput) return
    setEmailStatus('sending')
    const r = await api('/email/test', { method: 'POST', body: JSON.stringify({ email: emailInput }) })
    setEmailStatus(r?.success ? 'sent' : 'error')
    notify(r?.success ? '✅ Test email sent!' : `❌ Error: ${r?.error}`, r?.success ? 'success' : 'error')
  }

  const handleAuth = (e) => {
    e.preventDefault()
    if (authModal === 'signup') {
      if (!authForm.username || !authForm.email || !authForm.password) {
        notify('Please fill all fields', 'error')
        return
      }
      setUser({ username: authForm.username, email: authForm.email })
      notify('✅ Account created successfully!')
    } else {
      if (!authForm.email || !authForm.password) {
        notify('Please fill all fields', 'error')
        return
      }
      setUser({ username: authForm.email.split('@')[0], email: authForm.email })
      notify('✅ Logged in successfully!')
    }
    setAuthModal(null)
    setAuthForm({ username: '', email: '', password: '' })
  }

  const handleLogout = () => {
    setUser(null)
    setShowProfileDropdown(false)
    notify('Logged out')
  }

  const handleSocialLogin = (provider) => {
    notify(`Connecting to ${provider}...`, 'info')
    
    setTimeout(() => {
      setUser({ 
        username: provider === 'Google' ? 'G_Researcher' : 'Git_Dev', 
        email: provider === 'Google' ? 'researcher@gmail.com' : 'dev@github.com',
        avatar: provider === 'Google' ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Google' : 'https://api.dicebear.com/7.x/avataaars/svg?seed=GitHub'
      })
      notify(`✅ Successfully logged in with ${provider}!`)
      setAuthModal(null)
    }, 1000)
  }

  const filteredPapers = (digest?.papers || []).filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.actionLabel === filter
    return matchSearch && matchFilter
  })

  const filteredRepos = (digest?.repos || []).filter(r => {
    const matchSearch = !search || r.name?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || r.usabilityLabel === filter
    return matchSearch && matchFilter
  })

  const TABS = [
    { id: 'overview', label: 'Dashboard', icon: 'dashboard' },
    { id: 'papers', label: 'Research Library', icon: 'menu_book' },
    { id: 'repos', label: 'Codebase Audit', icon: 'biotech' },
    { id: 'trends', label: 'Trend Radar', icon: 'radar' },
    { id: 'chat', label: 'Research Console', icon: 'terminal' },
    { id: 'ideas', label: 'Hypothesis Module', icon: 'psychology' },
    { id: 'settings', label: 'System Settings', icon: 'settings' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--background)' }}>

      {/* Side Nav */}
      <aside style={{
        width: 'var(--sidebar-width)', background: 'white', borderRight: '1px solid var(--outline-variant)',
        position: 'fixed', top: 0, bottom: 0, left: 0, display: 'flex', flexDirection: 'column', padding: '24px 16px', zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, padding: '0 8px' }}>
          <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <span className="material-symbols-outlined">science</span>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>OpenScholar <span style={{color: 'var(--primary)'}}>AI</span></div>
            <div style={{ fontSize: 10, color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>v4.2 Stable</div>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`sidebar-link ${tab === t.id ? 'active' : ''}`} style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{t.icon}</span>
              <span style={{ fontSize: 14 }}>{t.label}</span>
            </button>
          ))}
          {imageResearchData && (
            <button onClick={() => setTab('snap')} className={`sidebar-link ${tab === 'snap' ? 'active' : ''}`} style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', marginTop: 20 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>camera</span>
              <span style={{ fontSize: 14 }}>Snap Result</span>
            </button>
          )}
        </nav>

        <div style={{ marginTop: 'auto', padding: '16px 8px' }}>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current.click()} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>photo_camera</span>
            Snap2Research
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, marginLeft: 'var(--sidebar-width)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Header */}
        <header style={{
          height: 'var(--header-height)', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--outline-variant)', position: 'sticky', top: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px'
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface-variant)' }}>
            System Status: <span style={{ color: isRunning ? 'var(--info)' : 'var(--success)' }}>{isRunning ? 'PIPELINE_EXECUTING' : 'IDLE_READY'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--outline)' }}>search</span>
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGlobalSearch()}
                placeholder="Global search..." 
                style={{
                  background: '#f1f5f9', border: '1px solid var(--outline-variant)', borderRadius: '100px', padding: '8px 16px 8px 40px',
                  fontSize: 13, width: 240, outline: 'none'
                }} 
              />
            </div>
            
            {user ? (
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0
                  }}
                >
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>{user.username}</div>
                    <div style={{ fontSize: 10, color: 'var(--outline)', fontWeight: 600 }}>{user.email}</div>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', border: '2px solid white', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: 'var(--shadow-sm)' }}>
                    {user.avatar ? <img src={user.avatar} alt="User" style={{ width: '100%', height: '100%' }} /> : <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>}
                  </div>
                </button>

                {showProfileDropdown && (
                  <div className="animate-fade" style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 12, width: 200,
                    background: 'white', borderRadius: '12px', border: '1px solid var(--outline-variant)',
                    boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 100
                  }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--outline-variant)', background: '#f8fafc' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: 4 }}>Account</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>{user.username}</div>
                    </div>
                    <button onClick={handleLogout} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 13, fontWeight: 600
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setAuthModal('login')} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>Login</button>
                <button onClick={() => setAuthModal('signup')} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>Sign Up</button>
              </div>
            )}
          </div>
        </header>

        {notification && (
          <div className="animate-fade" style={{
            position: 'fixed', top: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 10000,
            background: notification.type === 'error' ? '#fee2e2' : notification.type === 'info' ? '#eff6ff' : '#ecfdf5',
            color: notification.type === 'error' ? '#b91c1c' : notification.type === 'info' ? '#2563eb' : '#047857',
            border: `1px solid ${notification.type === 'error' ? '#f87171' : notification.type === 'info' ? '#60a5fa' : '#34d399'}`,
            padding: '12px 24px', borderRadius: '12px', fontWeight: 600, fontSize: 14,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span className="material-symbols-outlined" style={{fontSize: 20}}>{notification.type === 'error' ? 'error' : notification.type === 'info' ? 'info' : 'check_circle'}</span>
            {notification.msg}
          </div>
        )}

        <main style={{ flex: 1, padding: 32, maxWidth: 1200, width: '100%', margin: '0 auto' }}>

          {/* ── Overview Tab ── */}
          {tab === 'overview' && (
            <div className="animate-fade">
              <section className="premium-card" style={{
                background: 'linear-gradient(135deg, white, #f8faff)', padding: '48px', display: 'flex', alignItems: 'center', gap: 48, marginBottom: 32, position: 'relative'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: '#eff6ff', color: 'var(--primary)', borderRadius: '20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 24 }}>
                    <span style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
                    Research Pipeline Ready
                  </div>
                  <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--on-surface)', lineHeight: 1.2, marginBottom: 20 }}>
                    Synthesize the cutting edge of <span style={{ color: 'var(--primary)' }}>AI Research</span>.
                  </h1>
                  <p style={{ fontSize: 16, color: 'var(--on-surface-variant)', marginBottom: 32, lineHeight: 1.6, maxWidth: 600 }}>
                    Automated discovery, analysis, and build-plan generation for GenAI practitioners. Scout ArXiv and GitHub in one click.
                  </p>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <button onClick={triggerPipeline} disabled={isRunning} className="btn-primary" style={{ padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isRunning ? 'Executing Pipeline...' : 'Initialize Pipeline'}
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>rocket_launch</span>
                    </button>
                    <button onClick={() => setTab('chat')} className="btn-secondary" style={{ padding: '14px 28px' }}>Open Research Console</button>
                  </div>
                </div>
              </section>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
                <StatCard label="Papers Analyzed" value={digest?.stats?.papersAnalyzed || 0} trend="+12%" color="#3b82f6" icon="library_books" />
                <StatCard label="Repos Audited" value={digest?.stats?.reposAnalyzed || 0} trend="+8%" color="#6366f1" icon="code" />
                <StatCard label="Hypothesis Validated" value={digest?.stats?.ideasGenerated || 0} color="#10b981" icon="psychology" />
                <StatCard label="System Health" value="OPTIMAL" color="#f59e0b" icon="verified" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
                <section>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)' }}>Top Research Signals</h2>
                    <button onClick={() => setTab('papers')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>View Library</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {filteredPapers.slice(0, 3).map((p, i) => <PaperCard key={i} paper={p} index={i} />)}
                  </div>
                </section>

                <section>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)' }}>Codebase Trends</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {filteredRepos.slice(0, 4).map((r, i) => (
                      <div key={i} className="premium-card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>{r.name?.split('/')[1]}</span>
                          <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>{r.language}</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.4, marginBottom: 12 }}>{r.description?.slice(0, 80)}...</p>
                        <div style={{ fontSize: 11, color: 'var(--outline)', fontWeight: 600 }}>★ {r.stars}</div>
                      </div>
                    ))}
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
                    placeholder="Search titles, abstracts, or areas..."
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
                    }}>{f === 'all' ? 'All Signals' : f.replace('Should ', '')}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 24 }}>
                {filteredPapers.map((p, i) => <PaperCard key={i} paper={p} index={i} />)}
              </div>
              {filteredPapers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--outline)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16 }}>search_off</span>
                  <p>No research matches your filters.</p>
                </div>
              )}
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
                    placeholder="Audit repositories..."
                    style={{
                      width: '100%', background: 'white', border: '1px solid var(--outline-variant)',
                      borderRadius: '12px', padding: '14px 16px 14px 48px', color: 'var(--on-surface)', fontSize: 14, outline: 'none'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
                {filteredRepos.map((r, i) => <RepoCard key={i} repo={r} index={i} />)}
              </div>
            </div>
          )}

          {/* ── Chat Tab ── */}
          {tab === 'chat' && (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)' }}>
              <div className="premium-card" style={{ flex: 1, marginBottom: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, padding: 32, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, background: '#f8fafc' }}>
                  {chatMessages.length === 0 && (
                    <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--outline)', maxWidth: 400 }}>
                      <div style={{ padding: 20, background: 'white', borderRadius: '50%', width: 80, height: 80, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--outline-variant)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--primary)' }}>forum</span>
                      </div>
                      <h3 style={{ color: 'var(--on-surface)', marginBottom: 8 }}>Research Assistant</h3>
                      <p style={{ fontSize: 14 }}>Ask questions about the latest GenAI breakthroughs or your custom library.</p>
                    </div>
                  )}
                  {chatMessages.map((m, i) => (
                    <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                      <div style={{
                        background: m.role === 'user' ? 'var(--primary)' : 'white',
                        color: m.role === 'user' ? 'white' : 'var(--on-surface)',
                        padding: '16px 20px', borderRadius: '16px',
                        boxShadow: 'var(--shadow-sm)', fontSize: 14, lineHeight: 1.6,
                        border: m.role === 'user' ? 'none' : '1px solid var(--outline-variant)'
                      }}>
                        {m.content}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--outline)', marginTop: 4, textAlign: m.role === 'user' ? 'right' : 'left', textTransform: 'uppercase' }}>
                        {m.role === 'user' ? 'Inquiry' : 'Neural Response'}
                      </div>
                    </div>
                  ))}
                  {isChatting && (
                    <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 8, alignItems: 'center', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>
                      <span className="material-symbols-outlined" style={{ animation: 'spin 2s linear infinite' }}>autorenew</span>
                      Synthesizing...
                    </div>
                  )}
                </div>

                <div style={{ padding: 24, background: 'white', borderTop: '1px solid var(--outline-variant)' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleChat()}
                      placeholder="e.g. What are the latest trends in RAG optimization?"
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

          {/* ── Ideas / Hypothesis Tab ── */}
          {tab === 'ideas' && (
            <div className="animate-fade">
              <div className="premium-card" style={{ background: 'linear-gradient(135deg, white, #eff6ff)', padding: 32, marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>psychology</span>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--on-surface)' }}>Hypothesis Validator</h2>
                </div>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 15, marginBottom: 24 }}>
                  Input a project idea to receive a feasibility verdict based on the current research landscape.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    value={validateInput}
                    onChange={e => setValidateInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleValidateIdea()}
                    placeholder="Describe your AI project or hypothesis..."
                    style={{
                      flex: 1, background: 'white', border: '1px solid var(--outline-variant)',
                      borderRadius: '12px', padding: '14px 18px', color: 'var(--on-surface)', fontSize: 14, outline: 'none'
                    }}
                  />
                  <button onClick={handleValidateIdea} disabled={isValidating || !validateInput.trim()} className="btn-primary" style={{ padding: '0 32px' }}>
                    {isValidating ? 'Analyzing...' : 'Validate'}
                  </button>
                </div>

                {validateResult && (
                  <div className="animate-fade" style={{ marginTop: 32, background: 'white', borderRadius: '12px', border: '1px solid var(--outline-variant)', padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      <span style={{
                        background: validateResult.verdict === 'BUILD' ? '#ecfdf5' : '#fef3c7',
                        color: validateResult.verdict === 'BUILD' ? '#10b981' : '#d97706',
                        padding: '4px 16px', borderRadius: '20px', fontSize: 12, fontWeight: 800
                      }}>{validateResult.verdict}</span>
                      <span style={{ fontSize: 12, color: 'var(--outline)', fontWeight: 600 }}>Estimated Time: {validateResult.mvpTime}</span>
                    </div>
                    <p style={{ color: 'var(--on-surface)', fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>{validateResult.verdictReason}</p>
                    <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 12 }}>PIVOT SUGGESTION: </span>
                      <span style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>{validateResult.suggestedTwist}</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
                {(digest?.buildIdeas || []).map((idea, idx) => (
                  <div key={idx} className="premium-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--on-surface)' }}>{idea.name}</h3>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{idea.impactScore}</div>
                        <div style={{ fontSize: 9, color: 'var(--outline)', fontWeight: 800 }}>IMPACT</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', lineHeight: 1.5, marginBottom: 20 }}>{idea.solution}</p>
                    <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--outline)', fontWeight: 700 }}>{idea.difficulty?.toUpperCase()} LEVEL</span>
                      <button onClick={() => handleGeneratePitch(idx)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                        {loadingPitch === idx ? 'Generating...' : 'Pitch Plan'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Trends Tab ── */}
          {tab === 'trends' && (
            <div className="animate-fade">
              <div className="premium-card" style={{ padding: 40, marginBottom: 40, borderLeft: '5px solid var(--primary)' }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--on-surface)', marginBottom: 16 }}>Intelligence Summary</h2>
                <p style={{ fontSize: 16, color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
                  {liveTrends?.weeklySummary || "Loading latest intelligence synthesis..."}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
                {(liveTrends?.trends || []).map((t, i) => (
                  <div key={i} className="premium-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>{t.topic}</h3>
                      <span style={{ fontSize: 10, fontWeight: 800, color: t.direction === 'up' ? '#10b981' : '#64748b', background: t.direction === 'up' ? '#ecfdf5' : '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                        {t.direction?.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: 16 }}>{t.explanation}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {t.relatedPapers?.map((p, idx) => (
                        <span key={idx} style={{ fontSize: 10, background: '#f8fafc', border: '1px solid var(--outline-variant)', padding: '2px 6px', borderRadius: '4px' }}>{p}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Snap Result Tab ── */}
          {tab === 'snap' && (
            <div className="animate-fade">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>
                <div className="premium-card" style={{ padding: 24, height: 'fit-content' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Visual Input</h3>
                  {selectedImage && (
                    <img src={selectedImage} alt="Input" style={{ width: '100%', borderRadius: '12px', marginBottom: 20, border: '1px solid var(--outline-variant)' }} />
                  )}
                  {imageResearchData?.imageAnalysis && (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: 4 }}>Main Problem</div>
                        <p style={{ fontSize: 14, color: 'var(--on-surface)', fontWeight: 600 }}>{imageResearchData.imageAnalysis.mainProblem}</p>
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: 8 }}>Detected Domains</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {imageResearchData.imageAnalysis.possibleDomains?.map((d, i) => (
                            <span key={i} style={{ padding: '2px 8px', background: '#eff6ff', color: 'var(--primary)', borderRadius: '4px', fontSize: 11, fontWeight: 600 }}>{d}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Correlated Research Nodes</h2>
                  {isAnalyzingImage ? (
                    <div className="premium-card" style={{ padding: 64, textAlign: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 48, animation: 'spin 2s linear infinite', color: 'var(--primary)', marginBottom: 16 }}>autorenew</span>
                      <h3>Synthesizing Visual Knowledge...</h3>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {imageResearchData?.papers?.map((p, i) => <PaperCard key={i} paper={p} index={i} />)}
                      {!imageResearchData?.papers?.length && <p>No specific papers found for this visual query.</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Search Tab ── */}
          {tab === 'search' && (
            <div className="animate-fade">
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 28 }}>travel_explore</span>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--on-surface)' }}>Global Discovery</h2>
                </div>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 15 }}>
                  Synthesized results for <span style={{ fontWeight: 700, color: 'var(--primary)' }}>"{search}"</span> 
                  {searchResults?.source === 'web' ? ' fetched from ArXiv Live' : ' from local dashboard'}.
                </p>
              </div>

              {isSearching ? (
                <div className="premium-card" style={{ padding: 80, textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, animation: 'spin 2s linear infinite', color: 'var(--primary)', marginBottom: 20 }}>query_stats</span>
                  <h3>Synthesizing Deep Research...</h3>
                  <p style={{ color: 'var(--outline)', marginTop: 8 }}>Polling ArXiv API and cross-referencing local data.</p>
                </div>
              ) : (
                <div>
                  {searchResults?.papers?.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 24 }}>
                      {searchResults.papers.map((p, i) => <PaperCard key={i} paper={p} index={i} />)}
                    </div>
                  ) : (
                    <div className="premium-card" style={{ padding: 80, textAlign: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline)', marginBottom: 20 }}>search_off</span>
                      <h3>No results found for "{search}"</h3>
                      <p style={{ color: 'var(--outline)', marginTop: 8 }}>Try adjusting your query or broadening your keywords.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Settings Tab ── */}
          {tab === 'settings' && (
            <div className="animate-fade" style={{ maxWidth: 800 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 32 }}>System Configuration</h2>
              
              <div className="premium-card" style={{ padding: 32, marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Communication Test</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input 
                    value={emailInput} onChange={e => setEmailInput(e.target.value)}
                    placeholder="Enter email to test SMTP..." 
                    style={{ flex: 1, padding: '12px 16px', border: '1px solid var(--outline-variant)', borderRadius: '8px', outline: 'none' }}
                  />
                  <button onClick={sendTestEmail} className="btn-secondary" style={{ padding: '0 24px' }}>
                    {emailStatus === 'sending' ? 'Sending...' : 'Test Sync'}
                  </button>
                </div>
              </div>

              <div className="premium-card" style={{ padding: 32 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Pipeline History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {status?.runHistory?.map((h, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{new Date(h.runAt).toLocaleString()}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: h.success ? 'var(--success)' : 'var(--error)' }}>
                        {h.success ? `SUCCESS // ${h.papers}P` : `FAILED // ${h.error?.slice(0, 20)}`}
                      </div>
                    </div>
                  ))}
                  {!status?.runHistory?.length && <p style={{ fontSize: 13, color: 'var(--outline)' }}>No execution records found.</p>}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Auth Modal */}
      {authModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setAuthModal(null)}>
          <div className="premium-card animate-scale" style={{ background: 'white', maxWidth: 900, width: '100%', display: 'flex', overflow: 'hidden', borderRadius: '24px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setAuthModal(null)} style={{ position: 'absolute', top: 24, right: 24, background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--on-surface)', zIndex: 10, transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
            
            {/* Left Branding Side */}
            <div style={{ flex: 1, background: 'linear-gradient(135deg, var(--primary), #312e81)', padding: 48, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
              <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
                  <div style={{ width: 40, height: 40, background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24 }}>science</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>OpenScholar <span style={{ opacity: 0.8 }}>AI</span></div>
                </div>

                <h2 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.2, marginBottom: 24, letterSpacing: '-0.02em' }}>
                  {authModal === 'signup' ? 'Accelerate your research pipeline.' : 'Welcome back to the cutting edge.'}
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.8, fontWeight: 400 }}>
                  Synthesize millions of ArXiv papers, uncover codebase trends, and validate hypotheses in seconds.
                </p>
              </div>

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', gap: -8 }}>
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="User" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--primary)', background: 'white' }} />
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sam" alt="User" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--primary)', background: 'white', marginLeft: -12 }} />
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan" alt="User" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--primary)', background: 'white', marginLeft: -12 }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>Join 10,000+ top researchers.</div>
              </div>
            </div>

            {/* Right Form Side */}
            <div style={{ flex: 1, padding: '48px 64px', background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--on-surface)', marginBottom: 8, letterSpacing: '-0.02em' }}>{authModal === 'signup' ? 'Create an account' : 'Sign in'}</h2>
                <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
                  {authModal === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button onClick={() => setAuthModal(authModal === 'signup' ? 'login' : 'signup')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: 14, padding: 0 }}>
                    {authModal === 'signup' ? 'Log in' : 'Sign up'}
                  </button>
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                <button type="button" onClick={() => handleSocialLogin('Google')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', padding: '12px', background: 'white', border: '1px solid var(--outline-variant)', borderRadius: '12px', fontSize: 14, fontWeight: 600, color: 'var(--on-surface)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: 20, height: 20 }} />
                  Continue with Google
                </button>
                <button type="button" onClick={() => handleSocialLogin('GitHub')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', padding: '12px', background: '#24292e', border: '1px solid #24292e', borderRadius: '12px', fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }} onMouseOver={e => e.currentTarget.style.background = '#1b1f23'} onMouseOut={e => e.currentTarget.style.background = '#24292e'}>
                  <svg height="20" viewBox="0 0 16 16" width="20" fill="white"><path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
                  Continue with GitHub
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--outline-variant)' }}></div>
                <div style={{ fontSize: 12, color: 'var(--outline)', fontWeight: 600, textTransform: 'uppercase' }}>Or continue with email</div>
                <div style={{ flex: 1, height: 1, background: 'var(--outline-variant)' }}></div>
              </div>

              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {authModal === 'signup' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>Username</label>
                    <input 
                      value={authForm.username}
                      onChange={e => setAuthForm({...authForm, username: e.target.value})}
                      placeholder="e.g. researcher42"
                      style={{ padding: '12px 16px', border: '1px solid var(--outline-variant)', borderRadius: '10px', fontSize: 14, outline: 'none', background: '#f8fafc', transition: 'border-color 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} 
                      onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'white'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--outline-variant)'; e.target.style.background = '#f8fafc'; }}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>Email Address</label>
                  <input 
                    type="email"
                    value={authForm.email}
                    onChange={e => setAuthForm({...authForm, email: e.target.value})}
                    placeholder="name@institution.edu"
                    style={{ padding: '12px 16px', border: '1px solid var(--outline-variant)', borderRadius: '10px', fontSize: 14, outline: 'none', background: '#f8fafc', transition: 'border-color 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} 
                    onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'white'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--outline-variant)'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>Password</label>
                    {authModal === 'login' && (
                      <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Forgot password?</button>
                    )}
                  </div>
                  <input 
                    type="password"
                    value={authForm.password}
                    onChange={e => setAuthForm({...authForm, password: e.target.value})}
                    placeholder="••••••••"
                    style={{ padding: '12px 16px', border: '1px solid var(--outline-variant)', borderRadius: '10px', fontSize: 14, outline: 'none', background: '#f8fafc', transition: 'border-color 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} 
                    onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'white'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--outline-variant)'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>
                
                {authModal === 'login' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
                    <input type="checkbox" style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }} />
                    <span style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Remember me for 30 days</span>
                  </label>
                )}
                
                <button type="submit" className="btn-primary" style={{ marginTop: 16, padding: '14px', fontSize: 15, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {authModal === 'signup' ? 'Create Account' : 'Sign In'}
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </button>
              </form>
              
              {authModal === 'signup' && (
                <p style={{ fontSize: 12, color: 'var(--outline)', textAlign: 'center', marginTop: 24, lineHeight: 1.5 }}>
                  By signing up, you agree to our <a href="#" style={{ color: 'var(--on-surface-variant)', fontWeight: 600, textDecoration: 'underline' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--on-surface-variant)', fontWeight: 600, textDecoration: 'underline' }}>Privacy Policy</a>.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pitch Modal */}
      {pitchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setPitchModal(null)}>
          <div className="premium-card animate-fade" style={{ background: 'white', maxWidth: 800, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 40 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>{pitchModal.ideaName}</h2>
              <button onClick={() => setPitchModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ background: '#f0f7ff', padding: 24, borderRadius: '12px', marginBottom: 32, border: '1px solid #cce3ff' }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--primary)', lineHeight: 1.6 }}>{pitchModal.pitch.elevatorPitch}</p>
            </div>

            <div style={{ marginBottom: 32 }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--outline)', textTransform: 'uppercase', marginBottom: 16 }}>Demo Script</h4>
              {pitchModal.pitch.demoScript?.map((s, i) => (
                <div key={i} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', marginBottom: 8, fontSize: 14 }}>
                  <span style={{ fontWeight: 800, marginRight: 12 }}>{i + 1}</span> {s}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ padding: 20, background: '#fffbeb', borderRadius: '12px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#d97706', marginBottom: 8 }}>JUDGES HOOK</div>
                <p style={{ fontSize: 14, color: '#92400e' }}>{pitchModal.pitch.judgesHook}</p>
              </div>
              <div style={{ padding: 20, background: '#f0fdf4', borderRadius: '12px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', marginBottom: 8 }}>WHY NOW</div>
                <p style={{ fontSize: 14, color: '#166534' }}>{pitchModal.pitch.whyNow}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Animations & Icons */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .sidebar-link.active .material-symbols-outlined { font-variation-settings: 'FILL' 1; }
      `}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    </div>
  )
}
