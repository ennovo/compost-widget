import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import RemoteComponentWrapper from 'customer_site/RemoteComponentWrapper';
import { useRemoteParams } from 'customer_site/useRemoteParams';
import { useAgent, useAgentState } from 'customer_site/hooks';

import composterDiagramSrc from './assets/composterDiagram';
import innerFanSrc from './assets/innerFan';

// ── Keyframe animations (prefixed to avoid collisions with host) ──
const KEYFRAMES = `
@keyframes ecw-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes ecw-air-flow {
  from { stroke-dashoffset: 9; }
  to { stroke-dashoffset: 0; }
}
@keyframes ecw-air-fade {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
`;

// Aeration air lines — 9 equidistant arcs rising from the pad into the pile
// Arcs are half the previous height (about 10.5 units)
const AIR_PATHS = (() => {
  const padLeft = 48.1;     // narrowed by half-spacing on each side
  const padRight = 93.1;
  const padY = 89.15;          // shifted up by half arc height (97 - 7.85)
  const arcHeight = 15.7;
  const endY = padY - arcHeight; // ~73.45
  const count = 9;
  const spacing = (padRight - padLeft) / (count - 1);
  const paths = [];
  for (let i = 0; i < count; i++) {
    const x = padLeft + i * spacing;
    const endX = x + 2;
    const ctrlX = x + 3.5;
    const ctrlY = (padY + endY) / 2;
    paths.push(`M ${x} ${padY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`);
  }
  return paths;
})();

// ── Water particle system (canvas-based) ────────────────────────
// Teardrop-shaped particles erupt from above the pile and fall onto it.
function WaterParticles({ active }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const frameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const spawnAccRef = useRef(0);

  // Teardrop drawing helper — rotated so the pointed end faces the
  // direction of travel (angle in radians, 0 = right, PI/2 = down).
  const drawTeardrop = useCallback((ctx, x, y, size, angle) => {
    ctx.save();
    ctx.translate(x, y);
    // The base shape points upward (-Y). Rotate so the pointed tip
    // leads in the direction of movement (angle + PI to flip it).
    ctx.rotate(angle - Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.4);
    ctx.bezierCurveTo(size * 0.7, -size * 0.3, size * 0.5, size * 0.6, 0, size * 0.7);
    ctx.bezierCurveTo(-size * 0.5, size * 0.6, -size * 0.7, -size * 0.3, 0, -size * 1.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!active) {
      particlesRef.current = [];
      spawnAccRef.current = 0;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      return;
    }

    const animate = (timestamp) => {
      const dt = lastTimeRef.current ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.05) : 0.016;
      lastTimeRef.current = timestamp;

      // Use CSS dimensions (not physical pixels) since the context is scaled by DPR
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      if (w === 0 || h === 0) { frameRef.current = requestAnimationFrame(animate); return; }

      // Spawn points: three sprinkler heads aligned under the readout tiles
      const spawnPoints = [
        { x: w * 0.60, y: h * 0.38 },
        { x: w * 0.75, y: h * 0.38 },
        { x: w * 0.90, y: h * 0.38 },
      ];
      // Pile surface: particles disappear around this Y
      const groundY = h * 0.65;

      // Spawn new particles (~15 per second per sprinkler head)
      spawnAccRef.current += dt * 15;
      while (spawnAccRef.current >= 1) {
        spawnAccRef.current -= 1;
        for (const sp of spawnPoints) {
          const angle = Math.PI / 2 + (Math.random() - 0.5) * 1.8; // spray downward in a cone
          const speed = 60 + Math.random() * 80; // pixels/sec
          particlesRef.current.push({
            x: sp.x + (Math.random() - 0.5) * 6,
            y: sp.y + (Math.random() - 0.5) * 4,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2.5 + Math.random() * 2,
            opacity: 0.7 + Math.random() * 0.3,
            life: 0,
          });
        }
      }

      // Update particles
      const gravity = 180; // pixels/sec^2
      particlesRef.current = particlesRef.current.filter(p => {
        p.life += dt;
        p.vy += gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        // Fade out as they approach the ground
        if (p.y > groundY * 0.85) {
          p.opacity -= dt * 3;
        }
        return p.y < groundY && p.opacity > 0;
      });

      // Draw
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = '#4a9eed';
        const moveAngle = Math.atan2(p.vy, p.vx);
        drawTeardrop(ctx, p.x, p.y, p.size, moveAngle);
      }
      ctx.globalAlpha = 1;

      frameRef.current = requestAnimationFrame(animate);
    };

    // Match canvas resolution to its display size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();

    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(canvas);

    lastTimeRef.current = 0;
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      ro.disconnect();
    };
  }, [active, drawTeardrop]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}

// ── Layer 3: Inner component ────────────────────────────────────
function EnnovoCompostWidgetInner() {
  const { agentId } = useParams();
  const { state } = useAgentState(agentId);

  // Channel payload is { doover_legacy_bridge_at, state: { children: { ... } } }
  const children = state?.state?.children;

  const temperature = children?.lastTemp?.currentValue;
  const oxygen = children?.lastOxygen?.currentValue;
  const moisture = children?.lastMoisture?.currentValue;
  const fanRunningLive = children?.fanRunning?.currentValue;
  const waterRunningLive = children?.waterRunning?.currentValue;

  // Temporary toggles for testing animations
  const [fanOverride, setFanOverride] = useState(false);
  const [waterOverride, setWaterOverride] = useState(false);
  const fanRunning = fanOverride;
  const waterRunning = waterOverride;

  // Responsive: compact mode for narrow containers (phones)
  const containerRef = useRef(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.width < 500);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Format a numeric value for display, or show N/A
  const fmt = (val, unit) => {
    if (val == null) return 'N/A';
    const num = Number(val);
    if (Number.isNaN(num)) return String(val);
    return `${num.toFixed(1)} ${unit}`;
  };

  return (
    <div>
      <style>{KEYFRAMES}</style>

      {/* Main container — sized by background image */}
      <div ref={containerRef} style={{
        position: 'relative',
        width: '100%',
        lineHeight: 0,
        overflow: 'hidden',
        borderRadius: 8,
        backgroundColor: '#f8f8f8',
      }}>

        {/* Background: composter diagram */}
        <img
          src={composterDiagramSrc}
          alt="Composter diagram"
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
          }}
          draggable={false}
        />

        {/* Fan image overlay — positioned over the blower circle */}
        <img
          src={innerFanSrc}
          alt="Inner fan"
          style={{
            position: 'absolute',
            top: '54.9%',
            left: '15.25%',
            width: '12.25%',
            height: 'auto',
            animation: 'ecw-spin 1.5s linear infinite',
            animationPlayState: fanRunning ? 'running' : 'paused',
            pointerEvents: 'none',
          }}
          draggable={false}
        />

        {/* Aeration indicators — cartoon air flow lines */}
        {fanRunning && (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {AIR_PATHS.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#b8e8e8"
                strokeWidth="0.45"
                strokeLinecap="round"
                strokeDasharray="5 4"
                style={{
                  animation: 'ecw-air-flow 2.4s linear infinite, ecw-air-fade 4s ease-in-out infinite',
                }}
              />
            ))}
          </svg>
        )}

        {/* Water particles — teardrops erupting and falling onto the pile */}
        <WaterParticles active={waterRunning} />

        {/* Sensor badges — absolute on desktop, flex row on mobile */}
        {compact ? (
          <div style={{
            position: 'absolute',
            top: '33%',
            left: 0,
            right: 0,
            transform: 'translateY(-50%)',
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            padding: '0 4px',
            pointerEvents: 'none',
          }}>
            {[
              { label: 'Temperature', value: fmt(temperature, '\u00B0C') },
              { label: 'Oxygen', value: fmt(oxygen, '%') },
              { label: 'Moisture', value: fmt(moisture, '%') },
            ].map(({ label, value }) => (
              <div key={label} style={{
                flex: '1 1 0',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                color: '#fff',
                borderRadius: 8,
                padding: '6px 8px',
                textAlign: 'center',
                lineHeight: 1.4,
              }}>
                <div style={{ fontSize: 10, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        ) : (
          [
            { label: 'Temperature', value: fmt(temperature, '\u00B0C'), left: '60%' },
            { label: 'Oxygen', value: fmt(oxygen, '%'), left: '75%' },
            { label: 'Moisture', value: fmt(moisture, '%'), left: '90%' },
          ].map(({ label, value, left }) => (
            <div key={label} style={{
              position: 'absolute',
              top: '33%',
              left,
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              color: '#fff',
              borderRadius: 8,
              padding: '6px 14px',
              width: 110,
              textAlign: 'center',
              lineHeight: 1.4,
              pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 10, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>
                {label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {value}
              </div>
            </div>
          ))
        )}

        {/* TEMP: Toggle buttons for testing animations */}
        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6, zIndex: 10 }}>
          <button
            onClick={() => setWaterOverride(prev => !prev)}
            style={{
              backgroundColor: waterRunning ? '#3b82f6' : '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              lineHeight: 1.4,
            }}
          >
            Water: {waterRunning ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setFanOverride(prev => !prev)}
            style={{
              backgroundColor: fanRunning ? '#22c55e' : '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              lineHeight: 1.4,
            }}
          >
            Fan: {fanRunning ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Layer 2: Hooks wrapper ──────────────────────────────────────
function EnnovoCompostWidgetWithAgent(props) {
  const { agentId } = useRemoteParams();
  const { agent } = useAgent(agentId);

  if (!agent) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-slate-400 text-sm">
        Loading...
      </div>
    );
  }

  return <EnnovoCompostWidgetInner {...props} />;
}

// ── Layer 1: RemoteComponentWrapper (outermost) ─────────────────
export default function EnnovoCompostWidget(props) {
  return (
    <RemoteComponentWrapper>
      <EnnovoCompostWidgetWithAgent {...props} />
    </RemoteComponentWrapper>
  );
}
