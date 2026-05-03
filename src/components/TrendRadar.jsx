import { useEffect, useRef, useState } from 'react';

const TOPICS = [
  { label: 'RAG',        score: 94, x: 0.52, y: 0.30, color: '#00F5FF' },
  { label: 'Agents',     score: 87, x: 0.72, y: 0.48, color: '#39FF14' },
  { label: 'Multimodal', score: 81, x: 0.28, y: 0.55, color: '#FFB800' },
  { label: 'FineTuning', score: 73, x: 0.60, y: 0.68, color: '#00F5FF' },
  { label: 'OnDevice',   score: 68, x: 0.35, y: 0.25, color: '#FFB800' },
  { label: 'Safety',     score: 55, x: 0.78, y: 0.22, color: '#FF2D55' },
  { label: 'LLM',        score: 49, x: 0.20, y: 0.75, color: '#39FF14' },
  { label: 'Code Gen',   score: 61, x: 0.65, y: 0.82, color: '#00F5FF' },
];

export default function TrendRadar({ onTopicClick }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const tickRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    function draw(timestamp) {
      tickRef.current = timestamp;
      ctx.clearRect(0, 0, W, H);

      // ── Radar rings ───────────────────────────────────────
      [0.85, 0.65, 0.45, 0.25].forEach((r, i) => {
        const radius = r * Math.min(W, H) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,245,255,${0.06 + i * 0.02})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // ── Sweep line ────────────────────────────────────────
      const sweepAngle = (timestamp / 3000) * Math.PI * 2;
      const sweepGrad = ctx.createConicalGradient
        ? null
        : null;
      // Fallback sweep arc
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(sweepAngle);
      const grad = ctx.createLinearGradient(0, 0, Math.min(W, H) * 0.45, 0);
      grad.addColorStop(0, 'rgba(0,245,255,0.18)');
      grad.addColorStop(1, 'rgba(0,245,255,0)');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, Math.min(W, H) * 0.44, -0.4, 0);
      ctx.lineTo(0, 0);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // ── Crosshair lines ───────────────────────────────────
      ctx.strokeStyle = 'rgba(0,245,255,0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      [[cx, 0, cx, H], [0, cy, W, cy]].forEach(([x1,y1,x2,y2]) => {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      });
      ctx.setLineDash([]);

      // ── Topic bubbles ─────────────────────────────────────
      TOPICS.forEach((t, idx) => {
        const bx = t.x * W;
        const by = t.y * H;
        const baseR = 6 + (t.score / 94) * 18;
        const pulse = Math.sin(timestamp / 900 + idx * 1.1) * 2;
        const r = baseR + pulse;
        const isHov = hovered === idx;

        // Outer glow
        const glowR = isHov ? r + 12 : r + 6;
        const grd = ctx.createRadialGradient(bx, by, 0, bx, by, glowR);
        grd.addColorStop(0, t.color + '55');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(bx, by, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core circle
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fillStyle = t.color + '22';
        ctx.fill();
        ctx.strokeStyle = t.color + (isHov ? 'ee' : '88');
        ctx.lineWidth = isHov ? 2 : 1.5;
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fillStyle = t.color;
        ctx.fill();

        // Label
        ctx.font = `bold ${isHov ? 10 : 9}px 'Space Mono', monospace`;
        ctx.fillStyle = isHov ? t.color : t.color + 'cc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = t.color;
        ctx.shadowBlur = isHov ? 10 : 4;
        ctx.fillText(t.label, bx, by + r + 4);
        ctx.shadowBlur = 0;
      });

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [hovered]);

  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    let found = null;
    TOPICS.forEach((t, i) => {
      const bx = t.x * canvas.width;
      const by = t.y * canvas.height;
      const r = 10 + (t.score / 94) * 18 + 8;
      const dist = Math.hypot(mx - bx, my - by);
      if (dist < r) found = i;
    });
    setHovered(found);
  }

  function handleClick(e) {
    if (hovered !== null) {
      onTopicClick && onTopicClick(TOPICS[hovered].label);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={260}
        height={220}
        style={{
          width: '100%',
          borderRadius: 6,
          cursor: 'none',
          display: 'block',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
        onClick={handleClick}
      />
      {hovered !== null && (
        <div style={{
          position: 'absolute',
          bottom: 6,
          right: 8,
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          color: TOPICS[hovered].color,
          letterSpacing: 1,
          textShadow: `0 0 8px ${TOPICS[hovered].color}`,
        }}>
          {TOPICS[hovered].label.toUpperCase()} · VELOCITY {TOPICS[hovered].score}
        </div>
      )}
    </div>
  );
}
