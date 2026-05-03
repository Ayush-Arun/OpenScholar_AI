import { useState } from 'react';
import PaperCard from './PaperCard';
import RepoCard from './RepoCard';
import { mockPapers, mockRepos } from '../data/mockData';

export default function MainFeed({ activeTopics }) {
  const [tab, setTab] = useState('papers');

  const filteredPapers = activeTopics.length === 0
    ? mockPapers
    : mockPapers.filter(p => p.topics.some(t => activeTopics.includes(t)));

  const filteredRepos = activeTopics.length === 0
    ? mockRepos
    : mockRepos.filter(r => r.topics.some(t => activeTopics.includes(t)));

  const s = {
    wrapper: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #1a2240',
    },
    tabBar: {
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      padding: '10px 16px 0',
      borderBottom: '1px solid #1a2240',
      flexShrink: 0,
      background: '#060a14',
    },
    tab: (active) => ({
      fontFamily: "'Space Mono', monospace",
      fontSize: 9,
      letterSpacing: 2,
      padding: '7px 16px',
      border: 'none',
      borderBottom: active ? '2px solid #00F5FF' : '2px solid transparent',
      background: 'transparent',
      color: active ? '#00F5FF' : '#3a4a6a',
      cursor: 'none',
      textShadow: active ? '0 0 8px #00F5FF' : 'none',
      transition: 'color 0.2s, text-shadow 0.2s',
      position: 'relative',
      top: 1,
      userSelect: 'none',
    }),
    filterNote: {
      fontFamily: "'Space Mono', monospace",
      fontSize: 8,
      color: '#3a4a6a',
      letterSpacing: 1,
      marginLeft: 'auto',
      paddingBottom: 6,
      alignSelf: 'flex-end',
    },
    feed: {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '14px 16px 20px',
    },
    empty: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60%',
      gap: 10,
      color: '#2a3a5a',
      fontFamily: "'Space Mono', monospace",
      fontSize: 11,
      letterSpacing: 2,
    },
  };

  return (
    <div style={s.wrapper}>
      {/* Tab bar */}
      <div style={s.tabBar}>
        <button style={s.tab(tab === 'papers')} onClick={() => setTab('papers')}>
          ◈ PAPERS{filteredPapers.length > 0 ? ` (${filteredPapers.length})` : ''}
        </button>
        <button style={s.tab(tab === 'repos')} onClick={() => setTab('repos')}>
          ⬡ REPOS{filteredRepos.length > 0 ? ` (${filteredRepos.length})` : ''}
        </button>
        <div style={s.filterNote}>
          {activeTopics.length > 0
            ? `FILTER: ${activeTopics.join(' · ')}`
            : 'ALL TOPICS'
          }
        </div>
      </div>

      {/* Feed */}
      <div style={s.feed}>
        {tab === 'papers' && (
          filteredPapers.length > 0
            ? filteredPapers.map((p, i) => (
                <PaperCard key={p.id} paper={p} delay={0.05 + i * 0.08} />
              ))
            : <div style={s.empty}>
                <div style={{ fontSize: 28, opacity: 0.3 }}>◈</div>
                <div>NO PAPERS MATCH FILTER</div>
              </div>
        )}
        {tab === 'repos' && (
          filteredRepos.length > 0
            ? filteredRepos.map((r, i) => (
                <RepoCard key={r.id} repo={r} delay={0.05 + i * 0.08} />
              ))
            : <div style={s.empty}>
                <div style={{ fontSize: 28, opacity: 0.3 }}>⬡</div>
                <div>NO REPOS MATCH FILTER</div>
              </div>
        )}
      </div>
    </div>
  );
}
