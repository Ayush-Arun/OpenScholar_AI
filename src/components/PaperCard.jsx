import { useState, useEffect, useRef } from 'react';
import ScoreBadge from './ScoreBadge';
import { useProfile } from '../context/ProfileContext';
import { tagLabels } from '../data/mockData';

function ComplexityDots({ value }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <span style={{ fontFamily: "'DM Sans'", fontSize: 9, color: '#5a6a8a', letterSpacing: 1, marginRight: 2 }}>COMPLEXITY</span>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: i <= value ? '#FFB800' : '#1a2240',
          boxShadow: i <= value ? '0 0 5px #FFB800' : 'none',
          transition: 'background 0.2s',
        }} />
      ))}
    </div>
  );
}

function AnimatedScoreBar({ score, delay = 0 }) {
  const color =
    score >= 8 ? '#39FF14' :
    score >= 5 ? '#FFB800' :
    '#FF2D55';

  const barRef = useRef(null);
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const timeout = setTimeout(() => {
      el.style.width = `${score * 10}%`;
    }, 200 + delay);
    return () => clearTimeout(timeout);
  }, [score, delay]);

  return (
    <div style={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      height: 3,
      background: '#0d1225',
    }}>
      <div
        ref={barRef}
        style={{
          height: '100%',
          width: '0%',
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 8px ${color}`,
          transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1)',
          borderRadius: '0 2px 2px 0',
        }}
      />
    </div>
  );
}

export default function PaperCard({ paper, delay = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const { descriptions } = useProfile();
  const tagInfo = tagLabels[paper.tag];
  const avgScore = Object.values(paper.scores).reduce((a, b) => a + b, 0) / Object.values(paper.scores).length;

  const s = {
    card: {
      background: 'linear-gradient(135deg, #090d1a 0%, #0d1225 100%)',
      border: '1px solid #1a2240',
      borderRadius: 6,
      padding: '12px 14px',
      paddingBottom: 15,
      position: 'relative',
      overflow: 'hidden',
      cursor: 'none',
      opacity: 0,
      transform: 'translateY(22px)',
      animation: `revealUp 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards`,
      transition: 'border-color 0.2s, box-shadow 0.2s',
      marginBottom: 10,
    },
    title: {
      fontFamily: "'Syne', sans-serif",
      fontSize: 13,
      fontWeight: 700,
      color: '#e8f0ff',
      lineHeight: 1.4,
      display: '-webkit-box',
      WebkitLineClamp: expanded ? 'unset' : 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      marginBottom: 5,
    },
    meta: {
      fontFamily: "'Space Mono', monospace",
      fontSize: 9,
      color: '#3a4a6a',
      letterSpacing: 1,
      marginBottom: 10,
    },
    scores: {
      display: 'flex',
      gap: 6,
      marginBottom: 10,
    },
    tag: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 8px',
      borderRadius: 3,
      background: tagInfo.bg,
      border: `1px solid ${tagInfo.color}44`,
      color: tagInfo.color,
      fontFamily: "'Space Mono', monospace",
      fontSize: 9,
      letterSpacing: 1,
      textShadow: `0 0 6px ${tagInfo.color}`,
      boxShadow: `0 0 8px ${tagInfo.color}22`,
    },
    expandBtn: {
      fontFamily: "'Space Mono', monospace",
      fontSize: 8,
      color: '#00F5FF88',
      background: 'transparent',
      border: 'none',
      cursor: 'none',
      letterSpacing: 1,
      padding: 0,
      marginLeft: 'auto',
      transition: 'color 0.2s',
    },
    expandArea: {
      marginTop: 10,
      paddingTop: 10,
      borderTop: '1px solid #1a2240',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    expandLabel: {
      fontFamily: "'Space Mono', monospace",
      fontSize: 8,
      color: '#00F5FF',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    expandText: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 11,
      color: '#8a9abf',
      lineHeight: 1.6,
    },
    repoChip: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      padding: '2px 7px',
      borderRadius: 3,
      background: '#00F5FF18',
      border: '1px solid #00F5FF33',
      color: '#00F5FF',
      fontFamily: "'Space Mono', monospace",
      fontSize: 8,
      letterSpacing: 1,
    },
  };

  return (
    <div
      style={s.card}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#00F5FF44';
        e.currentTarget.style.boxShadow = '0 0 18px #00F5FF18, 0 0 1px #00F5FF22 inset';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#1a2240';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Noise texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      <div style={s.title}>{paper.title}</div>
      <div style={s.meta}>{paper.authors} · {paper.date}{paper.repoLinked && <span style={{ color: '#00F5FF88', marginLeft: 8 }}>⬡ REPO</span>}</div>

      {/* Scores */}
      <div style={s.scores}>
        <ScoreBadge score={paper.scores.novelty}   label="Novelty" />
        <ScoreBadge score={paper.scores.relevance} label="Relevance" />
        <ScoreBadge score={paper.scores.adoption}  label="Adoption" />
        <ScoreBadge score={paper.scores.clarity}   label="Clarity" />
      </div>

      {/* Summary */}
      <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: '#6a7a9a', lineHeight: 1.55, marginBottom: 10 }}>
        {paper.summary}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={s.tag}>{tagInfo.label}</div>
        <div style={{ fontFamily: "'DM Sans'", fontSize: 9, color: '#3a4a5a', marginLeft: 4 }}>
          {descriptions[paper.tag]}
        </div>
        <button
          style={s.expandBtn}
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? '▲ COLLAPSE' : '▼ DETAILS'}
        </button>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={s.expandArea}>
          <div>
            <div style={s.expandLabel}>Methodology</div>
            <div style={s.expandText}>{paper.methodology}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <ComplexityDots value={paper.complexity} />
            {paper.repoLinked && <div style={s.repoChip}>⬡ LINKED REPO</div>}
          </div>
        </div>
      )}

      {/* Animated bottom score bar */}
      <AnimatedScoreBar score={avgScore} delay={parseFloat(delay) * 1000} />
    </div>
  );
}
