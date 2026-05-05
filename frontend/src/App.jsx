import { useState, useEffect, useCallback } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

// ── API Helper ────────────────────────────────────────────────────────────────
const API = 'http://localhost:5000/api'
const api = async (path, opts = {}) => {
  try {
    const r = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opts
    })
    return await r.json()
  } catch { return null }
}

// ── Label Config ──────────────────────────────────────────────────────────────
const LABELS = {
  'Should Build': { color: '#22c55e', bg: '#22c55e18', border: '#22c55e33', icon: '🔨' },
  'Should Learn': { color: '#3b82f6', bg: '#3b82f618', border: '#3b82f633', icon: '📚' },
  'Should Watch': { color: '#f59e0b', bg: '#f59e0b18', border: '#f59e0b33', icon: '👁️' },
  'Should Ignore': { color: '#475569', bg: '#47556918', border: '#47556933', icon: '🚫' },
}

// ── Components ────────────────────────────────────────────────────────────────

function ScoreBar({ value = 0, color = '#7c3aed' }) {
  return (
    <div style={{ background: '#0d0d1a', borderRadius: 99, height: 5, width: '100%', overflow: 'hidden' }}>
      <div style={{
        background: `linear-gradient(90deg, ${color}99, ${color})`,
        height: '100%',
        width: `${Math.min(100, value)}%`,
        borderRadius: 99,
        transition: 'width 1s ease'
      }} />
    </div>
  )
}

function LabelBadge({ label }) {
  const cfg = LABELS[label] || LABELS['Should Watch']
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
      letterSpacing: '0.5px', fontFamily: 'var(--mono)', whiteSpace: 'nowrap'
    }}>
      {cfg.icon} {label}
    </span>
  )
}

function StatCard({ label, value, sub, color = '#7c3aed' }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px 24px',
      borderTop: `2px solid ${color}`, flex: 1, minWidth: 120
    }}>
      <div style={{ color, fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>{value}</div>
      <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ color: 'var(--text3)', fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function PaperCard({ paper, index }) {
  const [expanded, setExpanded] = useState(false)
  const [explainMode, setExplainMode] = useState('beginner')
  const [explanation, setExplanation] = useState(null)
  const [isExplaining, setIsExplaining] = useState(false)

  const handleExplain = async () => {
    setExpanded(true); // ensure it's open
    if (!explanation || explanation.mode !== explainMode) {
      setIsExplaining(true);
      const r = await api(`/papers/${index}/explain`, { method: 'POST', body: JSON.stringify({ mode: explainMode }) });
      if (r?.explanation) {
        setExplanation({ mode: explainMode, text: r.explanation });
      }
      setIsExplaining(false);
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
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: 20, marginBottom: 12,
      animation: `fadeUp 0.4s ease ${index * 0.05}s both`,
      transition: 'border-color 0.2s'
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#7c3aed55'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: '#7c3aed22', color: '#a855f7', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, fontFamily: 'var(--mono)' }}>
              #{index + 1} {paper.researchArea || 'AI'}
            </span>
            <span style={{ background: '#1e1e35', color: 'var(--text3)', fontSize: 11, padding: '2px 8px', borderRadius: 99 }}>
              {paper.complexity || 'Intermediate'}
            </span>
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: 'var(--text)', marginBottom: 4 }}>
            {paper.title}
          </h3>
          <p style={{ color: 'var(--text3)', fontSize: 12 }}>
            {(paper.authors || []).slice(0, 3).join(', ')}{paper.authors?.length > 3 ? ' et al.' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <LabelBadge label={paper.actionLabel} />
          <span style={{ color: '#7c3aed', fontSize: 20, fontWeight: 900, fontFamily: 'var(--mono)' }}>
            {paper.overallScore || 50}
          </span>
        </div>
      </div>

      <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
        {paper.tldr || paper.abstract?.slice(0, 200) + '...'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Novelty', val: paper.noveltyScore, color: '#a855f7' },
          { label: 'Practical', val: paper.practicalityScore, color: '#22c55e' },
          { label: 'Overall', val: paper.overallScore, color: '#f59e0b' },
        ].map(({ label, val, color }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: 'var(--text3)', fontSize: 11 }}>{label}</span>
              <span style={{ color, fontSize: 11, fontWeight: 700 }}>{val || 50}</span>
            </div>
            <ScoreBar value={val} color={color} />
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
          {paper.keyContributions?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>KEY CONTRIBUTIONS</div>
              {paper.keyContributions.map((k, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: '#7c3aed' }}>→</span>
                  <span style={{ color: 'var(--text2)', fontSize: 12 }}>{k}</span>
                </div>
              ))}
            </div>
          )}
          {paper.methodology && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>METHODOLOGY</div>
              <p style={{ color: 'var(--text2)', fontSize: 12, lineHeight: 1.6 }}>{paper.methodology}</p>
            </div>
          )}
          {paper.keyTakeaway && (
            <div style={{ background: '#7c3aed11', border: '1px solid #7c3aed33', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
              <div style={{ color: '#a855f7', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>💡 KEY TAKEAWAY</div>
              <p style={{ color: 'var(--text2)', fontSize: 12 }}>{paper.keyTakeaway}</p>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={scoreData}>
                <PolarGrid stroke="#1e1e35" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Radar name="Score" dataKey="A" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <a href={paper.arxivUrl} target="_blank" rel="noreferrer" style={{
          background: '#7c3aed22', color: '#a855f7', border: '1px solid #7c3aed44',
          fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
          textDecoration: 'none', display: 'inline-block'
        }}>Read Paper →</a>
        <button onClick={handleExplain} disabled={isExplaining} style={{
          background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#000', border: 'none',
          fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, cursor: isExplaining ? 'not-allowed' : 'pointer',
        }}>
          {isExplaining ? '⏳ Explaining...' : '✨ Explain'}
        </button>
        <button onClick={() => setExpanded(!expanded)} style={{
          background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border)',
          fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
          marginLeft: 'auto'
        }}>
          {expanded ? 'Less ↑' : 'More ↓'}
        </button>
      </div>

      {expanded && explanation && (
        <div style={{ marginTop: 16, background: '#1e1e35', border: '1px solid #7c3aed44', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ color: '#a855f7', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>✨ AI EXPLANATION</div>
            <select value={explainMode} onChange={(e) => setExplainMode(e.target.value)} style={{
              background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, padding: '4px 8px', outline: 'none'
            }}>
              <option value="beginner">Beginner</option>
              <option value="developer">Developer</option>
              <option value="researcher">Researcher</option>
            </select>
          </div>
          {isExplaining && <div style={{ color: 'var(--text3)', fontSize: 12, fontStyle: 'italic' }}>Generating new explanation...</div>}
          {!isExplaining && (
            <div style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {explanation.text}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RepoCard({ repo, index }) {
  const scoreData = [
    { name: 'Complete', val: repo.completenessScore || 60 },
    { name: 'Fresh', val: repo.freshnessScore || 60 },
    { name: 'Build', val: repo.buildFeasibilityScore || 60 },
    { name: 'Docs', val: repo.documentationScore || 60 },
    { name: 'Repro', val: repo.reproducibilityScore || 60 },
  ]
  const colors = ['#7c3aed', '#22c55e', '#f59e0b', '#3b82f6', '#a855f7']

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: 18, marginBottom: 12,
      animation: `fadeUp 0.4s ease ${index * 0.05}s both`,
      transition: 'border-color 0.2s'
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#22c55e44'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)' }}>
              {repo.name?.split('/')[1] || repo.name}
            </span>
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>{repo.language}</span>
          </div>
          <p style={{ color: 'var(--text3)', fontSize: 12 }}>{repo.name?.split('/')[0]}</p>
        </div>
        <LabelBadge label={repo.usabilityLabel} />
      </div>

      <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
        {repo.quickSummary || repo.description}
      </p>

      <div style={{ marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={scoreData} barSize={20}>
            <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#111120', border: '1px solid #1e1e35', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="val" radius={[4, 4, 0, 0]}>
              {scoreData.map((_, i) => <Cell key={i} fill={colors[i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ color: '#f59e0b', fontSize: 12 }}>⭐ {(repo.stars || 0).toLocaleString()}</span>
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>🍴 {(repo.forks || 0).toLocaleString()}</span>
        <span style={{ color: '#a855f7', fontSize: 12 }}>🔧 {repo.buildDifficulty || 'Medium'}</span>
        <span style={{ color: '#3b82f6', fontSize: 12 }}>👥 {repo.targetAudience || 'Developers'}</span>
      </div>

      <a href={repo.url} target="_blank" rel="noreferrer" style={{
        background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e33',
        fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
        textDecoration: 'none', display: 'inline-block'
      }}>View on GitHub →</a>
    </div>
  )
}

function TrendCard({ trend, index }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '14px 16px', marginBottom: 10,
      display: 'flex', alignItems: 'center', gap: 14,
      animation: `fadeUp 0.4s ease ${index * 0.08}s both`
    }}>
      <span style={{ fontSize: 28 }}>{trend.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700 }}>{trend.trend}</span>
          <span style={{ color: '#7c3aed', fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)' }}>
            {trend.momentum}%
          </span>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 6 }}>{trend.description}</p>
        <ScoreBar value={trend.momentum} color="#7c3aed" />
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [digest, setDigest] = useState(null)
  const [status, setStatus] = useState(null)
  const [tab, setTab] = useState('overview')
  const [isRunning, setIsRunning] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [notification, setNotification] = useState(null)
  const [emailInput, setEmailInput] = useState('')
  const [emailStatus, setEmailStatus] = useState(null)
  const [validateInput, setValidateInput] = useState('')
  const [validateResult, setValidateResult] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [pitchModal, setPitchModal] = useState(null)
  const [loadingPitch, setLoadingPitch] = useState(null)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isChatting, setIsChatting] = useState(false)

  const [liveTrends, setLiveTrends] = useState(null)
  const [isLoadingTrends, setIsLoadingTrends] = useState(false)

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Snap2Research state
  const [snapImage, setSnapImage] = useState(null)       // { file, previewUrl }
  const [snapLoading, setSnapLoading] = useState(false)
  const [snapResult, setSnapResult] = useState(null)     // { imageAnalysis, papers }
  const [snapError, setSnapError] = useState(null)
  const [buildPlan, setBuildPlan] = useState(null)       // generated project blueprint
  const [buildPlanLoading, setBuildPlanLoading] = useState(false)
  const [buildPlanModal, setBuildPlanModal] = useState(false)

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const loadData = useCallback(async () => {
    const [d, s] = await Promise.all([api('/digest'), api('/status')])
    if (d) setDigest(d)
    if (s) setStatus(s)
  }, [])

  useEffect(() => { loadData() }, [loadData])

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
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: r.answer,
        sources: r.sources || [],
        source: r.source || 'local',          // "local" | "web"
        fetchedPapers: r.fetchedPapers || []  // arXiv papers from web fallback
      }])
    } else {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error answering your question.', sources: [], source: 'local', fetchedPapers: [] }])
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
    { id: 'overview', label: '⚡ Overview' },
    { id: 'chat', label: '💬 Research Chat' },
    { id: 'papers', label: `📄 Papers ${papers.length ? `(${papers.length})` : ''}` },
    { id: 'repos', label: `💻 Repos ${repos.length ? `(${repos.length})` : ''}` },
    { id: 'trends', label: '📡 Trends' },
    { id: 'ideas', label: `🚀 Build Ideas ${ideas.length ? `(${ideas.length})` : ''}` },
    { id: 'snap2research', label: '📸 Snap2Research' },
    { id: 'settings', label: '⚙️ Settings' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          background: notification.type === 'error' ? '#ef444422' : notification.type === 'info' ? '#3b82f622' : '#22c55e22',
          border: `1px solid ${notification.type === 'error' ? '#ef444444' : notification.type === 'info' ? '#3b82f644' : '#22c55e44'}`,
          color: notification.type === 'error' ? '#ef4444' : notification.type === 'info' ? '#3b82f6' : '#22c55e',
          padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          animation: 'fadeUp 0.3s ease', maxWidth: 360
        }}>
          {notification.msg}
        </div>
      )}

      {/* Drawer Menu */}
      {isDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setIsDrawerOpen(false)} />
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 280,
            background: 'var(--surface)', borderRight: '1px solid var(--border)',
            padding: 24, display: 'flex', flexDirection: 'column',
            animation: 'fadeUp 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Menu</div>
              <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setIsDrawerOpen(false); }} style={{
                background: tab === t.id ? '#7c3aed22' : 'transparent',
                border: 'none', color: tab === t.id ? '#a855f7' : 'var(--text2)',
                padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                textAlign: 'left', cursor: 'pointer', marginBottom: 8, transition: 'all 0.2s'
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60, position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setIsDrawerOpen(true)} style={{
            background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div style={{
            width: 32, height: 32, background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, boxShadow: '0 0 12px #7c3aed44'
          }}>⚙</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px' }}>
              Open<span style={{ color: '#a855f7' }}>Scholar</span> AI
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 1, fontFamily: 'var(--mono)' }}>
              TEAM SCAM*€₹$
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isRunning ? '#f59e0b' : '#22c55e',
              boxShadow: `0 0 8px ${isRunning ? '#f59e0b' : '#22c55e'}`,
              animation: isRunning ? 'pulse 1s infinite' : 'none'
            }} />
            <span style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--mono)' }}>
              {isRunning ? 'RUNNING' : 'READY'}
            </span>
          </div>

          <button onClick={sendDigestEmail} disabled={isSendingEmail || !digest?.papers?.length} style={{
            background: 'var(--surface2)', color: 'var(--text)',
            border: '1px solid var(--border)', borderRadius: 8, padding: '8px 18px',
            fontSize: 13, fontWeight: 700, cursor: (isSendingEmail || !digest?.papers?.length) ? 'not-allowed' : 'pointer',
            opacity: (isSendingEmail || !digest?.papers?.length) ? 0.6 : 1,
            transition: 'all 0.2s'
          }}>
            {isSendingEmail ? 'Sending...' : '📧 Send Email'}
          </button>

          <button onClick={triggerPipeline} disabled={isRunning} style={{
            background: isRunning ? '#1e1e35' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
            color: isRunning ? 'var(--text3)' : '#fff',
            border: 'none', borderRadius: 8, padding: '8px 18px',
            fontSize: 13, fontWeight: 700, cursor: isRunning ? 'not-allowed' : 'pointer',
            boxShadow: isRunning ? 'none' : '0 0 16px #7c3aed44',
            transition: 'all 0.2s'
          }}>
            {isRunning ? '⟳ Running...' : '▶ Run Pipeline'}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        padding: '0 24px', display: 'flex', gap: 0, overflowX: 'auto'
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'none', border: 'none', color: tab === t.id ? '#a855f7' : 'var(--text3)',
            padding: '14px 18px', fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
            cursor: 'pointer', borderBottom: `2px solid ${tab === t.id ? '#7c3aed' : 'transparent'}`,
            whiteSpace: 'nowrap', transition: 'all 0.2s'
          }}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        {/* ── Overview Tab ── */}
        {tab === 'overview' && (
          <div>
            {!digest?.papers?.length && (
              <div style={{
                background: 'var(--surface)', border: '1px dashed var(--border2)',
                borderRadius: 16, padding: 48, textAlign: 'center', marginBottom: 24
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔭</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No digest yet</h2>
                <p style={{ color: 'var(--text2)', marginBottom: 20 }}>
                  Click "Run Pipeline" to scout ArXiv & GitHub for the latest GenAI research
                </p>
                <button onClick={triggerPipeline} style={{
                  background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer'
                }}>
                  🚀 Start First Run
                </button>
              </div>
            )}

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <StatCard label="Papers Analyzed" value={stats.papersAnalyzed || 0} sub={`of ${stats.papersScanned || 0} scanned`} color="#7c3aed" />
              <StatCard label="Repos Audited" value={stats.reposAnalyzed || 0} sub={`of ${stats.reposScanned || 0} scanned`} color="#22c55e" />
              <StatCard label="Build Ideas" value={stats.ideasGenerated || ideas.length || 0} sub="generated" color="#f59e0b" onClick={() => setTab('ideas')} />
              <StatCard label="Trends Detected" value={trends.topTrends?.length || 0} sub="this week" color="#f97316" />
              <StatCard label="Process Time" value={stats.processingTimeMs ? `${(stats.processingTimeMs / 1000).toFixed(0)}s` : '--'} sub="last run" color="#3b82f6" />
            </div>

            {/* Executive Summary */}
            {trends.weekSummary && (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderLeft: '3px solid #7c3aed', borderRadius: 10, padding: 20, marginBottom: 20
              }}>
                <div style={{ color: '#7c3aed', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
                  📋 EXECUTIVE SUMMARY
                </div>
                <p style={{ color: 'var(--text2)', lineHeight: 1.7, fontSize: 14 }}>{trends.weekSummary}</p>
              </div>
            )}

            {/* Hot Keywords */}
            {trends.hotKeywords?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>
                  🔥 TRENDING KEYWORDS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {trends.hotKeywords.map((k, i) => (
                    <span key={i} style={{
                      background: '#7c3aed18', color: '#a855f7', border: '1px solid #7c3aed33',
                      fontSize: 12, padding: '4px 12px', borderRadius: 99
                    }}>{k}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Top Papers */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800 }}>📄 Top Papers</h2>
                  <button onClick={() => setTab('papers')} style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: 12, cursor: 'pointer' }}>View all →</button>
                </div>
                {papers.slice(0, 3).map((p, i) => <PaperCard key={i} paper={p} index={i} />)}
              </div>

              {/* Top Repos + Trends */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800 }}>💻 Top Repos</h2>
                  <button onClick={() => setTab('repos')} style={{ background: 'none', border: 'none', color: '#22c55e', fontSize: 12, cursor: 'pointer' }}>View all →</button>
                </div>
                {repos.slice(0, 3).map((r, i) => <RepoCard key={i} repo={r} index={i} />)}

                {trends.topTrends?.length > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 14px' }}>
                      <h2 style={{ fontSize: 15, fontWeight: 800 }}>📡 Trend Radar</h2>
                      <button onClick={() => setTab('trends')} style={{ background: 'none', border: 'none', color: '#f59e0b', fontSize: 12, cursor: 'pointer' }}>View all →</button>
                    </div>
                    {trends.topTrends.slice(0, 3).map((t, i) => <TrendCard key={i} trend={t} index={i} />)}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Papers Tab ── */}
        {tab === 'papers' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search papers..."
                style={{
                  flex: 1, minWidth: 200, background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none'
                }}
              />
              {['all', 'Should Build', 'Should Learn', 'Should Watch', 'Should Ignore'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  background: filter === f ? '#7c3aed22' : 'var(--surface)',
                  border: `1px solid ${filter === f ? '#7c3aed' : 'var(--border)'}`,
                  color: filter === f ? '#a855f7' : 'var(--text3)',
                  borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                }}>{f === 'all' ? 'All' : f}</button>
              ))}
            </div>
            <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 16 }}>{filteredPapers.length} papers</p>
            {filteredPapers.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
                {papers.length === 0 ? 'Run the pipeline to fetch papers' : 'No papers match your filter'}
              </div>
            )}
            {filteredPapers.map((p, i) => <PaperCard key={i} paper={p} index={i} />)}
          </div>
        )}

        {/* ── Repos Tab ── */}
        {tab === 'repos' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search repositories..."
                style={{
                  flex: 1, minWidth: 200, background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none'
                }}
              />
              {['all', 'Should Build', 'Should Learn', 'Should Watch'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  background: filter === f ? '#22c55e22' : 'var(--surface)',
                  border: `1px solid ${filter === f ? '#22c55e' : 'var(--border)'}`,
                  color: filter === f ? '#22c55e' : 'var(--text3)',
                  borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                }}>{f === 'all' ? 'All' : f}</button>
              ))}
            </div>
            <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 16 }}>{filteredRepos.length} repositories</p>
            {filteredRepos.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
                {repos.length === 0 ? 'Run the pipeline to fetch repositories' : 'No repos match your filter'}
              </div>
            )}
            {filteredRepos.map((r, i) => <RepoCard key={i} repo={r} index={i} />)}
          </div>
        )}

        {/* ── Chat Tab ── */}
        {tab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <div style={{ background: 'linear-gradient(135deg, #7c3aed11, #3b82f611)', border: '1px solid #7c3aed33', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>💬 Research Chat (RAG + Web)</h2>
                  <p style={{ color: 'var(--text2)', fontSize: 13 }}>Ask anything — uses your digest first, then fetches live from arXiv if needed.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ background: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f633', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>🔵 From Digest</span>
                  <span style={{ background: '#a855f722', color: '#a855f7', border: '1px solid #a855f733', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>🟣 From Web</span>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text3)', margin: 'auto' }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>🔬</div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Ask me anything about AI research</div>
                  <div style={{ fontSize: 12 }}>e.g. "What is RAG?", "AI in healthcare papers", "Explain diffusion models"</div>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>

                  {/* Source badge for assistant messages */}
                  {m.role === 'assistant' && m.source && (
                    <div style={{ marginBottom: 4 }}>
                      {m.source === 'web' ? (
                        <span style={{ background: '#a855f722', color: '#a855f7', border: '1px solid #a855f733', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                          🟣 Fetched latest papers from the web for your query
                        </span>
                      ) : (
                        <span style={{ background: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f633', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                          🔵 Answering from your research digest
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{
                    background: m.role === 'user' ? '#7c3aed' : '#1e1e35',
                    color: m.role === 'user' ? '#fff' : 'var(--text)',
                    padding: '10px 14px', borderRadius: 12, maxWidth: '85%',
                    borderBottomRightRadius: m.role === 'user' ? 2 : 12,
                    borderBottomLeftRadius: m.role === 'assistant' ? 2 : 12,
                    fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap'
                  }}>
                    {m.content}
                  </div>

                  {/* Sources used panel */}
                  {m.sources?.length > 0 && (
                    <div style={{ marginTop: 8, maxWidth: '85%', background: '#111120', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
                      <div style={{ color: 'var(--text3)', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>SOURCES USED</div>
                      {m.sources.map((s, idx) => (
                        <div key={idx} style={{ marginBottom: 4 }}>
                          <a href={s.url} target="_blank" rel="noreferrer" style={{ color: '#a855f7', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>{s.title}</a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fetched papers grid (web source only) */}
                  {m.role === 'assistant' && m.source === 'web' && m.fetchedPapers?.length > 0 && (
                    <div style={{ marginTop: 12, maxWidth: '95%', width: '100%' }}>
                      <div style={{ color: 'var(--text3)', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                        📄 {m.fetchedPapers.length} PAPERS FETCHED FROM arXiv
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {m.fetchedPapers.slice(0, 6).map((p, pi) => (
                          <div key={pi} style={{
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            borderLeft: '3px solid #a855f7', borderRadius: 10, padding: '12px 14px',
                            transition: 'border-color 0.2s'
                          }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#a855f7'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                              <h4 style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.4, color: 'var(--text)', flex: 1 }}>{p.title}</h4>
                              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                {p.categories?.slice(0, 1).map((cat, ci) => (
                                  <span key={ci} style={{ background: '#7c3aed18', color: '#a855f7', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, fontFamily: 'var(--mono)' }}>{cat}</span>
                                ))}
                              </div>
                            </div>
                            <p style={{ color: 'var(--text3)', fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>
                              {p.abstract?.slice(0, 180)}{p.abstract?.length > 180 ? '...' : ''}
                            </p>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ color: 'var(--text3)', fontSize: 10 }}>{p.publishedDate?.slice(0, 10)}</span>
                              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                                <a href={p.arxivUrl} target="_blank" rel="noreferrer" style={{ background: '#7c3aed22', color: '#a855f7', border: '1px solid #7c3aed44', fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 6, textDecoration: 'none' }}>Read →</a>
                                <a href={p.pdfUrl} target="_blank" rel="noreferrer" style={{ background: '#ef444418', color: '#ef4444', border: '1px solid #ef444433', fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 6, textDecoration: 'none' }}>PDF ↓</a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ))}
              {isChatting && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ background: '#1e1e35', padding: '10px 14px', borderRadius: 12, fontSize: 13, color: 'var(--text3)' }}>
                    ⏳ Searching papers &amp; generating answer...
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChat()}
                placeholder="Ask about a paper or topic... e.g. 'AI in healthcare'"
                style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', color: 'var(--text)', fontSize: 14, outline: 'none' }}
              />
              <button onClick={handleChat} disabled={isChatting || !chatInput.trim()} style={{
                background: isChatting ? '#1e1e35' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                color: isChatting ? 'var(--text3)' : '#fff', border: 'none', borderRadius: 8, padding: '0 24px', fontWeight: 700, cursor: isChatting ? 'not-allowed' : 'pointer'
              }}>
                Send
              </button>
            </div>
          </div>
        )}


        {/* ── Trends Tab ── */}
        {tab === 'trends' && (
          <div>
            {isLoadingTrends ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
                ⏳ Analyzing trends with Claude...
              </div>
            ) : liveTrends ? (
              <>
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderLeft: '3px solid #f59e0b', borderRadius: 10, padding: 20, marginBottom: 24
                }}>
                  <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>WEEKLY SUMMARY</div>
                  <p style={{ color: 'var(--text2)', lineHeight: 1.7 }}>{liveTrends.weeklySummary}</p>
                </div>
                <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>📡 Top Trends</h2>
                {liveTrends.trends?.map((t, i) => (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{t.topic}</span>
                      <span style={{ color: t.direction === 'up' ? '#22c55e' : t.direction === 'down' ? '#ef4444' : '#f59e0b', fontSize: 12, fontWeight: 700 }}>
                        {t.direction?.toUpperCase()} ({t.count} papers)
                      </span>
                    </div>
                    <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 8 }}>{t.explanation}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(t.relatedPapers || []).map((rp, idx) => (
                        <span key={idx} style={{ background: '#1e1e35', color: 'var(--text3)', fontSize: 11, padding: '2px 8px', borderRadius: 6 }}>{rp.slice(0, 40)}...</span>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
                Run the pipeline to fetch papers before analyzing trends.
              </div>
            )}
          </div>
        )}

        {/* ── Ideas Tab ── */}
        {tab === 'ideas' && (
          <div>
            {/* Should I Build This? */}
            <div style={{
              background: 'linear-gradient(135deg, #7c3aed11, #22c55e11)',
              border: '1px solid #7c3aed33', borderRadius: 'var(--radius)', padding: 20, marginBottom: 24
            }}>
              <div style={{ color: '#a855f7', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
                🤔 SHOULD I BUILD THIS?
              </div>
              <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 12 }}>
                Type your idea and get an instant AI verdict: BUILD, LEARN, EXPLORE, or SKIP.
              </p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <input
                  value={validateInput}
                  onChange={e => setValidateInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleValidateIdea()}
                  placeholder='e.g. "AI resume analyzer for students"'
                  style={{
                    flex: 1, background: 'var(--bg)', border: '1px solid var(--border2)',
                    borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none'
                  }}
                />
                <button onClick={handleValidateIdea} disabled={isValidating || !validateInput.trim()} style={{
                  background: isValidating ? '#1e1e35' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: isValidating ? 'var(--text3)' : '#fff',
                  border: 'none', borderRadius: 8, padding: '10px 20px',
                  fontSize: 13, fontWeight: 700, cursor: isValidating ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap'
                }}>
                  {isValidating ? '⏳ Analyzing...' : '⚡ Validate'}
                </button>
              </div>
              {validateResult && (() => {
                const vColors = { BUILD: '#22c55e', LEARN: '#3b82f6', EXPLORE: '#f59e0b', SKIP: '#6b7280' }
                const vc = vColors[validateResult.verdict] || '#a855f7'
                return (
                  <div style={{ background: 'var(--surface)', border: `1px solid ${vc}33`, borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{
                        background: `${vc}22`, color: vc, border: `1px solid ${vc}44`,
                        fontSize: 13, fontWeight: 800, padding: '4px 14px', borderRadius: 99, letterSpacing: 1
                      }}>{validateResult.verdict}</span>
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}>⏱ MVP: {validateResult.mvpTime}</span>
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}>Competition: {validateResult.competition}</span>
                    </div>
                    <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{validateResult.verdictReason}</p>
                    {validateResult.suggestedTwist && (
                      <div style={{ background: '#7c3aed11', border: '1px solid #7c3aed33', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                        <span style={{ color: '#a855f7', fontSize: 11, fontWeight: 700 }}>💡 UNIQUE ANGLE: </span>
                        <span style={{ color: 'var(--text2)', fontSize: 12 }}>{validateResult.suggestedTwist}</span>
                      </div>
                    )}
                    {validateResult.nextStep && (
                      <p style={{ color: 'var(--text3)', fontSize: 12 }}>▶ Next step: {validateResult.nextStep}</p>
                    )}
                    {validateResult.winningFeature && (
                      <p style={{ color: '#22c55e', fontSize: 12, marginTop: 4 }}>⭐ Winning feature: {validateResult.winningFeature}</p>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Ideas List */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800 }}>🚀 Build Ideas from Latest Digest</h2>
              <span style={{ color: 'var(--text3)', fontSize: 12 }}>{ideas.length} ideas generated</span>
            </div>

            {ideas.length === 0 && (
              <div style={{ background: 'var(--surface)', border: '1px dashed var(--border2)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💡</div>
                <h3 style={{ marginBottom: 8 }}>No ideas yet</h3>
                <p style={{ color: 'var(--text2)', marginBottom: 20 }}>Run the pipeline to generate project ideas from the latest AI research.</p>
                <button onClick={triggerPipeline} style={{
                  background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer'
                }}>⚡ Run Pipeline</button>
              </div>
            )}

            {ideas.map((idea, idx) => {
              const diffColors = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' }
              const actionColors = { BUILD: '#22c55e', LEARN: '#3b82f6', EXPLORE: '#f59e0b' }
              const dc = diffColors[idea.difficulty] || '#f59e0b'
              const ac = actionColors[idea.actionLabel] || '#a855f7'
              return (
                <div key={idx} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: 20, marginBottom: 16,
                  animation: `fadeUp 0.4s ease ${idx * 0.06}s both`,
                  transition: 'border-color 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#7c3aed44'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ background: `${ac}22`, color: ac, border: `1px solid ${ac}44`, fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, letterSpacing: 1 }}>
                          {idea.actionLabel || 'BUILD'}
                        </span>
                        <span style={{ background: `${dc}22`, color: dc, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                          {idea.difficulty}
                        </span>
                        <span style={{ background: '#1e1e35', color: 'var(--text3)', fontSize: 11, padding: '3px 10px', borderRadius: 99 }}>
                          ⏱ {idea.estimatedTime}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{idea.name}</h3>
                      <p style={{ color: '#a855f7', fontSize: 12, fontStyle: 'italic' }}>"{idea.pitchLine}"</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{ color: '#f59e0b', fontSize: 24, fontWeight: 900, fontFamily: 'var(--mono)' }}>{idea.impactScore}</span>
                      <span style={{ color: 'var(--text3)', fontSize: 10 }}>IMPACT</span>
                    </div>
                  </div>

                  {/* Problem / Solution */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div style={{ background: '#ef444411', border: '1px solid #ef444422', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>PROBLEM</div>
                      <p style={{ color: 'var(--text2)', fontSize: 12, lineHeight: 1.5 }}>{idea.problem}</p>
                    </div>
                    <div style={{ background: '#22c55e11', border: '1px solid #22c55e22', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ color: '#22c55e', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>SOLUTION</div>
                      <p style={{ color: 'var(--text2)', fontSize: 12, lineHeight: 1.5 }}>{idea.solution}</p>
                    </div>
                  </div>

                  {/* MVP Features */}
                  {idea.mvpFeatures?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: 'var(--text3)', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>MVP FEATURES</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {idea.mvpFeatures.map((f, i) => (
                          <span key={i} style={{ background: '#3b82f618', color: '#3b82f6', border: '1px solid #3b82f633', fontSize: 11, padding: '3px 10px', borderRadius: 99 }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tech Stack */}
                  {idea.techStack?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: 'var(--text3)', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>TECH STACK</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {idea.techStack.map((t, i) => (
                          <span key={i} style={{ background: '#7c3aed18', color: '#a855f7', border: '1px solid #7c3aed33', fontSize: 11, padding: '3px 10px', borderRadius: 99, fontFamily: 'var(--mono)' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learning Roadmap */}
                  {idea.learningRoadmap?.length > 0 && (
                    <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                      <div style={{ color: 'var(--text3)', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>LEARNING ROADMAP</div>
                      {idea.learningRoadmap.map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                          <span style={{ color: '#7c3aed', fontWeight: 700, fontSize: 12, minWidth: 16 }}>{i + 1}.</span>
                          <span style={{ color: 'var(--text2)', fontSize: 12 }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer: target users + inspiration + pitch button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {idea.targetUsers && (
                        <span style={{ color: 'var(--text3)', fontSize: 12 }}>👥 {idea.targetUsers}</span>
                      )}
                      {idea.inspirationSource && (
                        <span style={{ color: 'var(--text3)', fontSize: 12 }}>💡 {idea.inspirationSource.slice(0, 40)}{idea.inspirationSource.length > 40 ? '...' : ''}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleGeneratePitch(idx)}
                      disabled={loadingPitch === idx}
                      style={{
                        background: loadingPitch === idx ? '#1e1e35' : 'linear-gradient(135deg,#f59e0b,#f97316)',
                        color: loadingPitch === idx ? 'var(--text3)' : '#000',
                        border: 'none', borderRadius: 8, padding: '8px 16px',
                        fontSize: 12, fontWeight: 700, cursor: loadingPitch === idx ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {loadingPitch === idx ? '⏳ Generating...' : '🎤 Generate Pitch'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Snap2Research Tab ── */}
        {tab === 'snap2research' && (
          <div style={{ maxWidth: 900, margin: '0 auto' }}>

            {/* Hero Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #7c3aed22, #06b6d422)',
              border: '1px solid #7c3aed44',
              borderRadius: 16, padding: '28px 32px', marginBottom: 28,
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: -30, right: -30, width: 120, height: 120,
                background: 'radial-gradient(circle, #7c3aed33, transparent)',
                borderRadius: '50%'
              }} />
              <div style={{ fontSize: 36, marginBottom: 10 }}>📸</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>
                Snap<span style={{ color: '#a855f7' }}>2</span>Research
              </h2>
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, maxWidth: 540 }}>
                Upload or capture any photo — our AI analyzes it, extracts research topics,
                and finds related AI/GenAI papers from arXiv instantly.
              </p>
            </div>

            {/* Upload Section */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: 24, marginBottom: 20
            }}>
              <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>UPLOAD IMAGE</div>

              {/* Drop area */}
              <label htmlFor="snap-upload" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed #7c3aed55', borderRadius: 12, padding: 32, cursor: 'pointer',
                background: snapImage ? '#7c3aed08' : 'transparent',
                transition: 'all 0.2s', marginBottom: 16,
                minHeight: 120
              }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file && file.type.startsWith('image/')) {
                    setSnapImage({ file, previewUrl: URL.createObjectURL(file) })
                    setSnapResult(null); setSnapError(null)
                  }
                }}
              >
                {snapImage ? (
                  <span style={{ color: '#a855f7', fontSize: 13, fontWeight: 600 }}>✅ {snapImage.file.name} — click to change</span>
                ) : (
                  <>
                    <span style={{ fontSize: 32, marginBottom: 8 }}>🖼️</span>
                    <span style={{ color: 'var(--text2)', fontSize: 13 }}>Drag & drop or click to upload</span>
                    <span style={{ color: 'var(--text3)', fontSize: 11, marginTop: 4 }}>JPG, PNG, WEBP — max 10 MB</span>
                  </>
                )}
              </label>
              <input
                id="snap-upload"
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setSnapImage({ file, previewUrl: URL.createObjectURL(file) })
                    setSnapResult(null); setSnapError(null)
                  }
                }}
              />

              {/* Preview */}
              {snapImage && (
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
                  <img
                    src={snapImage.previewUrl}
                    alt="Preview"
                    style={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 10, border: '1px solid #7c3aed44' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{snapImage.file.name}</div>
                    <div style={{ color: 'var(--text3)', fontSize: 12 }}>{(snapImage.file.size / 1024).toFixed(0)} KB · {snapImage.file.type}</div>
                    <button
                      onClick={() => { setSnapImage(null); setSnapResult(null); setSnapError(null) }}
                      style={{
                        marginTop: 10, background: '#ef444418', color: '#ef4444',
                        border: '1px solid #ef444433', borderRadius: 6,
                        fontSize: 11, fontWeight: 700, padding: '4px 12px', cursor: 'pointer'
                      }}
                    >Remove ×</button>
                  </div>
                </div>
              )}

              {/* Analyze Button */}
              <button
                id="snap-analyze-btn"
                onClick={async () => {
                  if (!snapImage || snapLoading) return
                  setSnapLoading(true)
                  setSnapError(null)
                  setSnapResult(null)
                  try {
                    const formData = new FormData()
                    formData.append('image', snapImage.file)
                    const resp = await fetch(`${API}/image-research`, { method: 'POST', body: formData })
                    const data = await resp.json()
                    if (data.success) {
                      setSnapResult(data)
                    } else {
                      setSnapError(data.error || 'Analysis failed. Please try again.')
                    }
                  } catch (e) {
                    setSnapError('Network error. Is the backend running?')
                  }
                  setSnapLoading(false)
                }}
                disabled={!snapImage || snapLoading}
                style={{
                  width: '100%',
                  background: (!snapImage || snapLoading) ? '#1e1e35' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: (!snapImage || snapLoading) ? 'var(--text3)' : '#fff',
                  border: 'none', borderRadius: 10, padding: '14px 0',
                  fontSize: 15, fontWeight: 800, cursor: (!snapImage || snapLoading) ? 'not-allowed' : 'pointer',
                  boxShadow: snapImage && !snapLoading ? '0 0 20px #7c3aed44' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {snapLoading ? '⏳ Analyzing image & fetching papers...' : '🔬 Analyze Image'}
              </button>
            </div>

            {/* Loading Pulse */}
            {snapLoading && (
              <div style={{
                background: 'var(--surface)', border: '1px solid #7c3aed33',
                borderRadius: 12, padding: 32, textAlign: 'center', marginBottom: 20
              }}>
                <div style={{ fontSize: 36, marginBottom: 12, animation: 'pulse 1.5s ease infinite' }}>🔭</div>
                <div style={{ color: '#a855f7', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>AI is analyzing your image...</div>
                <div style={{ color: 'var(--text3)', fontSize: 12 }}>Extracting research topics → Searching arXiv → Compiling results</div>
              </div>
            )}

            {/* Error */}
            {snapError && (
              <div style={{
                background: '#ef444411', border: '1px solid #ef444433',
                borderRadius: 12, padding: 20, marginBottom: 20, color: '#ef4444', fontSize: 14
              }}>
                ❌ {snapError}
              </div>
            )}

            {/* Results */}
            {snapResult && (
              <div style={{ animation: 'fadeUp 0.5s ease' }}>

                {/* ── Generate Build Plan CTA ── */}
                <div style={{
                  background: 'linear-gradient(135deg, #f59e0b11, #f9731611)',
                  border: '1px solid #f59e0b44', borderRadius: 14, padding: '18px 22px',
                  marginBottom: 20, display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
                }}>
                  <div>
                    <div style={{ color: '#f59e0b', fontSize: 13, fontWeight: 800, marginBottom: 3 }}>🏗️ Ready to build?</div>
                    <div style={{ color: 'var(--text3)', fontSize: 12 }}>Generate a full project blueprint — roadmap, tech stack &amp; architecture</div>
                  </div>
                  <button
                    id="snap-build-plan-btn"
                    onClick={async () => {
                      if (buildPlanLoading) return
                      setBuildPlanLoading(true)
                      setBuildPlan(null)
                      try {
                        const resp = await api('/snap2research/build-plan', {
                          method: 'POST',
                          body: JSON.stringify({ imageAnalysis: snapResult.imageAnalysis, papers: snapResult.papers })
                        })
                        if (resp?.success) {
                          setBuildPlan(resp.buildPlan)
                          setBuildPlanModal(true)
                        } else {
                          notify(`❌ ${resp?.error || 'Build plan failed'}`, 'error')
                        }
                      } catch (e) {
                        notify('❌ Network error generating build plan', 'error')
                      }
                      setBuildPlanLoading(false)
                    }}
                    disabled={buildPlanLoading}
                    style={{
                      background: buildPlanLoading ? '#1e1e35' : 'linear-gradient(135deg,#f59e0b,#f97316)',
                      color: buildPlanLoading ? 'var(--text3)' : '#000',
                      border: 'none', borderRadius: 10, padding: '11px 22px',
                      fontSize: 13, fontWeight: 800, cursor: buildPlanLoading ? 'not-allowed' : 'pointer',
                      boxShadow: buildPlanLoading ? 'none' : '0 0 18px #f59e0b55',
                      whiteSpace: 'nowrap', transition: 'all 0.2s'
                    }}
                  >
                    {buildPlanLoading ? '⏳ Generating Blueprint...' : '🏗️ Generate Project Blueprint'}
                  </button>
                </div>

                {/* Analysis Summary */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}>📊 IMAGE ANALYSIS RESULTS</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

                    {/* Detected Objects */}
                    {snapResult.imageAnalysis.detectedObjects?.length > 0 && (
                      <div style={{
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: 16
                      }}>
                        <div style={{ color: '#06b6d4', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>👁️ DETECTED OBJECTS</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {snapResult.imageAnalysis.detectedObjects.map((obj, i) => (
                            <span key={i} style={{
                              background: '#06b6d418', color: '#06b6d4',
                              border: '1px solid #06b6d433', fontSize: 11,
                              padding: '3px 10px', borderRadius: 99
                            }}>{obj}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Possible Domains */}
                    {snapResult.imageAnalysis.possibleDomains?.length > 0 && (
                      <div style={{
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: 16
                      }}>
                        <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>🌐 RESEARCH DOMAINS</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {snapResult.imageAnalysis.possibleDomains.map((d, i) => (
                            <span key={i} style={{
                              background: '#f59e0b18', color: '#f59e0b',
                              border: '1px solid #f59e0b33', fontSize: 11,
                              padding: '3px 10px', borderRadius: 99
                            }}>{d}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Main Problem */}
                  {snapResult.imageAnalysis.mainProblem && (
                    <div style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderLeft: '3px solid #7c3aed', borderRadius: 10, padding: 16, marginBottom: 12
                    }}>
                      <div style={{ color: '#a855f7', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>🎯 MAIN RESEARCH PROBLEM</div>
                      <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>{snapResult.imageAnalysis.mainProblem}</p>
                    </div>
                  )}

                  {/* Keywords Row */}
                  {snapResult.imageAnalysis.researchKeywords?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>🔑 RESEARCH KEYWORDS</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {snapResult.imageAnalysis.researchKeywords.map((kw, i) => (
                          <span key={i} style={{
                            background: '#7c3aed18', color: '#a855f7',
                            border: '1px solid #7c3aed33', fontSize: 12,
                            padding: '4px 12px', borderRadius: 99
                          }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Project Ideas */}
                  {snapResult.imageAnalysis.projectIdeas?.length > 0 && (
                    <div style={{
                      background: 'linear-gradient(135deg,#22c55e0d,#7c3aed0d)',
                      border: '1px solid #22c55e33', borderRadius: 10, padding: 16, marginBottom: 12
                    }}>
                      <div style={{ color: '#22c55e', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>💡 BUILDABLE PROJECT IDEAS</div>
                      {snapResult.imageAnalysis.projectIdeas.map((idea, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                          <span style={{ color: '#a855f7', fontWeight: 800, minWidth: 18 }}>{i + 1}.</span>
                          <span style={{ color: 'var(--text2)', fontSize: 13 }}>{idea}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Related Papers */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>📄 RELATED RESEARCH PAPERS</div>
                    <span style={{ background: '#7c3aed22', color: '#a855f7', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                      {snapResult.papers.length} found
                    </span>
                  </div>

                  {snapResult.papers.length === 0 ? (
                    <div style={{
                      background: 'var(--surface)', border: '1px dashed var(--border)',
                      borderRadius: 12, padding: 36, textAlign: 'center', color: 'var(--text3)', fontSize: 14
                    }}>
                      No related papers found. Try another image.
                    </div>
                  ) : (
                    snapResult.papers.map((paper, i) => (
                      <div key={i} style={{
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)', padding: 18, marginBottom: 12,
                        animation: `fadeUp 0.4s ease ${i * 0.05}s both`,
                        transition: 'border-color 0.2s'
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#7c3aed55'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: 'var(--text)', marginBottom: 4 }}>
                              {paper.title}
                            </h3>
                            <p style={{ color: 'var(--text3)', fontSize: 12 }}>
                              {(paper.authors || []).slice(0, 3).join(', ')}{paper.authors?.length > 3 ? ' et al.' : ''}
                            </p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, alignItems: 'flex-end' }}>
                            {paper.categories?.slice(0, 2).map((cat, ci) => (
                              <span key={ci} style={{
                                background: '#7c3aed18', color: '#a855f7',
                                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                                borderRadius: 99, fontFamily: 'var(--mono)', whiteSpace: 'nowrap'
                              }}>{cat}</span>
                            ))}
                          </div>
                        </div>

                        <p style={{ color: 'var(--text2)', fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
                          {paper.abstract?.slice(0, 240)}{paper.abstract?.length > 240 ? '...' : ''}
                        </p>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {paper.publishedDate && (
                            <span style={{ color: 'var(--text3)', fontSize: 11 }}>
                              📅 {paper.publishedDate?.slice(0, 10)}
                            </span>
                          )}
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                            <a href={paper.arxivUrl} target="_blank" rel="noreferrer" style={{
                              background: '#7c3aed22', color: '#a855f7',
                              border: '1px solid #7c3aed44', fontSize: 11, fontWeight: 600,
                              padding: '5px 12px', borderRadius: 6, textDecoration: 'none'
                            }}>Read Paper →</a>
                            <a href={paper.pdfUrl} target="_blank" rel="noreferrer" style={{
                              background: '#ef444418', color: '#ef4444',
                              border: '1px solid #ef444433', fontSize: 11, fontWeight: 600,
                              padding: '5px 12px', borderRadius: 6, textDecoration: 'none'
                            }}>PDF ↓</a>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* ── Build Plan Modal ── */}
        {buildPlanModal && buildPlan && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            backdropFilter: 'blur(6px)'
          }} onClick={() => setBuildPlanModal(false)}>
            <div style={{
              background: 'var(--bg)', border: '1px solid var(--border2)',
              borderRadius: 18, padding: 32, maxWidth: 840, width: '100%', maxHeight: '92vh',
              overflowY: 'auto', position: 'relative', animation: 'fadeUp 0.4s ease'
            }} onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>🏗️ PROJECT BLUEPRINT</div>
                  <h2 style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, marginBottom: 6 }}>{buildPlan.projectTitle}</h2>
                  <p style={{ color: '#a855f7', fontSize: 13, fontStyle: 'italic' }}>"{buildPlan.tagline}"</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 16 }}>
                  <span style={{
                    background: buildPlan.difficultyLevel === 'Advanced' ? '#ef444422' : buildPlan.difficultyLevel === 'Beginner' ? '#22c55e22' : '#f59e0b22',
                    color: buildPlan.difficultyLevel === 'Advanced' ? '#ef4444' : buildPlan.difficultyLevel === 'Beginner' ? '#22c55e' : '#f59e0b',
                    border: `1px solid ${buildPlan.difficultyLevel === 'Advanced' ? '#ef444433' : buildPlan.difficultyLevel === 'Beginner' ? '#22c55e33' : '#f59e0b33'}`,
                    fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99
                  }}>{buildPlan.difficultyLevel}</span>
                  <span style={{ background: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f633', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99 }}>⏱ {buildPlan.estimatedTime}</span>
                  <button onClick={() => setBuildPlanModal(false)} style={{
                    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text3)',
                    borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16, fontWeight: 700
                  }}>✕</button>
                </div>
              </div>

              {/* Problem Statement */}
              <div style={{ background: '#7c3aed11', border: '1px solid #7c3aed33', borderLeft: '4px solid #7c3aed', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <div style={{ color: '#a855f7', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>🎯 PROBLEM STATEMENT</div>
                <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7 }}>{buildPlan.problemStatement}</p>
              </div>

              {/* Unique Angle */}
              {buildPlan.uniqueAngle && (
                <div style={{ background: '#22c55e11', border: '1px solid #22c55e33', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18 }}>⭐</span>
                  <div>
                    <div style={{ color: '#22c55e', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>UNIQUE ANGLE</div>
                    <p style={{ color: 'var(--text2)', fontSize: 13 }}>{buildPlan.uniqueAngle}</p>
                  </div>
                </div>
              )}

              {/* Core Features */}
              {buildPlan.coreFeatures?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>⚡ CORE FEATURES</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {buildPlan.coreFeatures.map((f, i) => (
                      <div key={i} style={{
                        background: 'var(--surface)', border: `1px solid ${f.priority === 'Must-have' ? '#7c3aed44' : 'var(--border)'}`,
                        borderRadius: 10, padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 700 }}>{f.feature}</span>
                          <span style={{
                            background: f.priority === 'Must-have' ? '#7c3aed22' : '#47556922',
                            color: f.priority === 'Must-have' ? '#a855f7' : 'var(--text3)',
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99
                          }}>{f.priority}</span>
                        </div>
                        <p style={{ color: 'var(--text3)', fontSize: 12, lineHeight: 1.5 }}>{f.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tech Stack */}
              {buildPlan.techStack && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>🛠️ TECH STACK</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {Object.entries(buildPlan.techStack).map(([layer, items]) => (
                      <div key={layer} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ color: 'var(--text3)', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>{layer}</div>
                        {(items || []).map((tech, i) => (
                          <span key={i} style={{
                            display: 'inline-block', background: '#7c3aed18', color: '#a855f7',
                            border: '1px solid #7c3aed33', fontSize: 11, fontWeight: 600,
                            padding: '2px 8px', borderRadius: 6, margin: '2px 2px 2px 0',
                            fontFamily: 'var(--mono)'
                          }}>{tech}</span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Datasets & APIs */}
              {buildPlan.datasetsAndAPIs?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>📦 DATASETS & APIs</div>
                  {buildPlan.datasetsAndAPIs.map((d, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 14, alignItems: 'flex-start', background: 'var(--surface)',
                      border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 8
                    }}>
                      <span style={{ color: '#06b6d4', fontWeight: 800, fontSize: 12, minWidth: 20 }}>{i + 1}.</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 700 }}>{d.name}</div>
                        <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>{d.purpose}</div>
                        {d.url && <div style={{ color: '#06b6d4', fontSize: 11, marginTop: 2 }}>{d.url}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Architecture */}
              {buildPlan.architecture && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>🏛️ SYSTEM ARCHITECTURE</div>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
                    <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>{buildPlan.architecture.overview}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      {(buildPlan.architecture.components || []).map((comp, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#0f172a', borderRadius: 8, padding: '8px 12px' }}>
                          <span style={{ color: '#a855f7', fontWeight: 800, fontSize: 12 }}>→</span>
                          <div>
                            <div style={{ color: 'var(--text)', fontSize: 12, fontWeight: 700 }}>{comp.name}</div>
                            <div style={{ color: 'var(--text3)', fontSize: 11 }}>{comp.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2-Week Roadmap */}
              {buildPlan.roadmap?.length > 0 && (
                <div>
                  <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}>🗓️ 2-WEEK BUILD ROADMAP</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {buildPlan.roadmap.map((phase, i) => {
                      const phaseColors = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b']
                      const pc = phaseColors[i % phaseColors.length]
                      return (
                        <div key={i} style={{
                          background: 'var(--surface)', border: `1px solid ${pc}33`,
                          borderTop: `3px solid ${pc}`, borderRadius: 10, padding: 14
                        }}>
                          <div style={{ color: pc, fontSize: 11, fontWeight: 800, marginBottom: 6 }}>WEEK {phase.week} · {phase.days}</div>
                          <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{phase.phase}</div>
                          {(phase.tasks || []).map((task, ti) => (
                            <div key={ti} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                              <span style={{ color: pc, fontSize: 11, fontWeight: 700, minWidth: 14 }}>✓</span>
                              <span style={{ color: 'var(--text2)', fontSize: 12 }}>{task}</span>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Pitch Modal */}
        {pitchModal && (
          <div style={{
            position: 'fixed', inset: 0, background: '#0008', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
          }} onClick={() => setPitchModal(null)}>
            <div style={{
              background: 'var(--bg)', border: '1px solid var(--border2)',
              borderRadius: 16, padding: 28, maxWidth: 680, width: '100%', maxHeight: '90vh',
              overflowY: 'auto', position: 'relative'
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>🎤 PITCH PACKAGE</div>
                  <h2 style={{ fontSize: 18, fontWeight: 900 }}>{pitchModal.ideaName}</h2>
                </div>
                <button onClick={() => setPitchModal(null)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>

              {/* Elevator Pitch */}
              <div style={{ background: 'linear-gradient(135deg,#7c3aed22,#a855f722)', border: '1px solid #7c3aed33', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ color: '#a855f7', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>ELEVATOR PITCH</div>
                <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.7, fontWeight: 500 }}>{pitchModal.pitch.elevatorPitch}</p>
              </div>

              <div style={{ background: '#22c55e11', border: '1px solid #22c55e33', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 12 }}>One-liner: </span>
                <span style={{ color: 'var(--text2)', fontSize: 13, fontStyle: 'italic' }}>"{pitchModal.pitch.oneLiner}"</span>
              </div>

              {/* Demo Script */}
              {pitchModal.pitch.demoScript?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>DEMO SCRIPT</div>
                  {pitchModal.pitch.demoScript.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, background: 'var(--surface)', borderRadius: 8, padding: '8px 12px' }}>
                      <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: 13, minWidth: 20 }}>{i + 1}.</span>
                      <span style={{ color: 'var(--text2)', fontSize: 13 }}>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* PPT Outline */}
              {pitchModal.pitch.pptOutline?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>PPT OUTLINE</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {pitchModal.pitch.pptOutline.map((s, i) => (
                      <div key={i} style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                        <div style={{ color: '#a855f7', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>SLIDE {s.slide}: {s.title?.toUpperCase()}</div>
                        <p style={{ color: 'var(--text2)', fontSize: 12 }}>{s.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pitchModal.pitch.judgesHook && (
                <div style={{ background: '#f59e0b11', border: '1px solid #f59e0b33', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                  <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 12 }}>⭐ Judges Hook: </span>
                  <span style={{ color: 'var(--text2)', fontSize: 13 }}>{pitchModal.pitch.judgesHook}</span>
                </div>
              )}
              {pitchModal.pitch.whyNow && (
                <div style={{ background: '#3b82f611', border: '1px solid #3b82f633', borderRadius: 8, padding: '10px 14px' }}>
                  <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: 12 }}>🕒 Why Now: </span>
                  <span style={{ color: 'var(--text2)', fontSize: 13 }}>{pitchModal.pitch.whyNow}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Settings Tab ── */}
        {tab === 'settings' && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>⚙️ Settings & Configuration</h2>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>📧 Email Test</h3>
              <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 12 }}>Send a test email to verify your Gmail SMTP config</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={emailInput} onChange={e => setEmailInput(e.target.value)}
                  placeholder="your@email.com"
                  type="email"
                  style={{
                    flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none'
                  }}
                />
                <button onClick={sendEmail} style={{
                  background: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f644',
                  borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}>
                  {emailStatus === 'sending' ? '...' : 'Send Test'}
                </button>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>🗓️ Schedule</h3>
              <p style={{ color: 'var(--text2)', fontSize: 13 }}>Weekly digest: Every <strong>Monday at 8:00 AM IST</strong></p>
              <p style={{ color: 'var(--text2)', fontSize: 13 }}>Daily scan: Every day at <strong>2:00 AM IST</strong></p>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📊 Run History</h3>
              {(status?.runHistory || []).map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                  <span style={{ color: r.success ? '#22c55e' : '#ef4444' }}>{r.success ? '✅' : '❌'} {new Date(r.runAt).toLocaleString()}</span>
                  <span style={{ color: 'var(--text3)' }}>{r.success ? `${r.papers}p, ${r.repos}r` : r.error?.slice(0, 30)}</span>
                </div>
              ))}
              {!status?.runHistory?.length && <p style={{ color: 'var(--text3)', fontSize: 12 }}>No runs yet</p>}
            </div>

            <div style={{ background: '#7c3aed11', border: '1px solid #7c3aed33', borderRadius: 'var(--radius)', padding: 16 }}>
              <div style={{ color: '#a855f7', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>⚙️ .ENV CONFIGURATION</div>
              <pre style={{ color: 'var(--text2)', fontSize: 11, fontFamily: 'var(--mono)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{`ANTHROPIC_API_KEY=your_key_here
GITHUB_TOKEN=your_github_token
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
RECIPIENT_EMAILS=email1@x.com,email2@x.com
RESEARCH_TOPICS=LLM,RAG,agents`}</pre>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{ color: 'var(--text3)', fontSize: 11, fontFamily: 'var(--mono)' }}>
          OPENSCHOLAR AI · TEAM SCAM*€₹$ · MS RIT
        </span>
        {digest?.generatedAt && (
          <span style={{ color: 'var(--text3)', fontSize: 11 }}>
            Last updated: {new Date(digest.generatedAt).toLocaleString()}
          </span>
        )}
      </footer>
    </div>
  )
}
