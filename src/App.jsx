import { useState, useRef, useEffect } from 'react';
import './index.css';
import { ProfileProvider } from './context/ProfileContext';
import LiveStatusBar from './components/LiveStatusBar';
import Sidebar from './components/Sidebar';
import MainFeed from './components/MainFeed';
import RightPanel from './components/RightPanel';

function CustomCursor() {
  const crossRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      if (crossRef.current) {
        crossRef.current.style.left = e.clientX + 'px';
        crossRef.current.style.top  = e.clientY + 'px';
      }
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + 'px';
        dotRef.current.style.top  = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <>
      <div ref={crossRef} className="cursor" />
      <div ref={dotRef}   className="cursor-dot" />
    </>
  );
}

export default function App() {
  const [activeTopics, setActiveTopics] = useState([]);

  function toggleTopic(topic) {
    setActiveTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  }

  function handleRadarClick(label) {
    // Radar bubbles use slightly different label names — map them
    const map = {
      'RAG':          'RAG',
      'Agents':       'Agents',
      'Multimodal':   'Multimodal',
      'FineTuning':   'FineTuning',
      'OnDevice':     'OnDevice',
      'Safety':       'LLM',
      'LLM':          'LLM',
      'Code Gen':     'LLM',
    };
    const topic = map[label] || label;
    toggleTopic(topic);
  }

  return (
    <ProfileProvider>
      {/* Background layers */}
      <div className="bg-grid" />
      <div className="scanlines" />

      {/* Custom cursor */}
      <CustomCursor />

      {/* App shell */}
      <div className="app-shell">
        {/* Zone 1 — Top bar */}
        <LiveStatusBar
          activeTopics={activeTopics}
          onTopicToggle={toggleTopic}
        />

        {/* Zones 2, 3, 4 */}
        <div className="main-content">
          {/* Zone 2 — Left Sidebar */}
          <Sidebar />

          {/* Zone 3 — Main Feed */}
          <MainFeed activeTopics={activeTopics} />

          {/* Zone 4 — Right Panel */}
          <RightPanel onTopicClick={handleRadarClick} />
        </div>
      </div>
    </ProfileProvider>
  );
}
