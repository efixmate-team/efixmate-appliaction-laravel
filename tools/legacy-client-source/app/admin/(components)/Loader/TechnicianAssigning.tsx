"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  { label: "Finding the best technician…", sub: "Checking availability near you" },
  { label: "Assigning your request…", sub: "Matching your issue type" },
  { label: "Technician confirmed!", sub: "He's on the way to you" },
  { label: "Estimated arrival: 12 min", sub: "Live tracking enabled" },
];

export default function TechnicianLoader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [stepIdx, setStepIdx] = useState(0);
  const progressRef = useRef(0);

  // Cycle microcopy every 2.4s
  useEffect(() => {
    const id = setInterval(() => {
      setStepIdx((i) => (i + 1) % STEPS.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = 520, H = 140;
    canvas.width = W;
    canvas.height = H;

    // Road geometry
    const ROAD_Y = 88;        // top of road band
    const ROAD_H = 28;
    const GROUND_Y = ROAD_Y + ROAD_H;
    const STRIPE_Y = ROAD_Y + ROAD_H / 2;

    // Tech figure parameters
    const TECH_W = 26;
    const TECH_H = 46;

    // Animation state
    let techX = 0;            // 0..W+80 (wraps)
    const SPEED = 1.4;        // px per frame
    let dashOffset = 0;

    // Pulsing dots ahead of technician
    let pulseT = 0;

    function drawScene() {
      ctx.clearRect(0, 0, W, H);

      // ── Sky / ground ──
      ctx.fillStyle = "#F7F8FA";
      ctx.fillRect(0, 0, W, ROAD_Y);

      // Buildings silhouette (static)
      const buildings = [
        { x: 30,  w: 40, h: 38 },
        { x: 80,  w: 28, h: 52 },
        { x: 118, w: 36, h: 30 },
        { x: 165, w: 22, h: 44 },
        { x: 200, w: 44, h: 34 },
        { x: 255, w: 30, h: 50 },
        { x: 295, w: 38, h: 28 },
        { x: 345, w: 26, h: 42 },
        { x: 382, w: 40, h: 36 },
        { x: 434, w: 28, h: 46 },
        { x: 472, w: 36, h: 32 },
      ];
      ctx.fillStyle = "#E4E7EF";
      buildings.forEach(({ x, w, h }) => {
        ctx.fillRect(x, ROAD_Y - h, w, h);
        // windows
        ctx.fillStyle = "#CDD2E0";
        for (let wy = ROAD_Y - h + 6; wy < ROAD_Y - 8; wy += 10) {
          for (let wx = x + 5; wx < x + w - 4; wx += 9) {
            ctx.fillRect(wx, wy, 5, 5);
          }
        }
        ctx.fillStyle = "#E4E7EF";
      });

      // ── Road ──
      ctx.fillStyle = "#D8DCE6";
      ctx.fillRect(0, ROAD_Y, W, ROAD_H);

      // Road edge lines
      ctx.strokeStyle = "#BFC4D2";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, ROAD_Y); ctx.lineTo(W, ROAD_Y); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();

      // Dashed center stripe
      dashOffset -= SPEED * 0.6;
      ctx.setLineDash([18, 12]);
      ctx.lineDashOffset = dashOffset;
      ctx.strokeStyle = "#F7F8FA";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, STRIPE_Y); ctx.lineTo(W, STRIPE_Y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;

      // ── Destination pin (right side) ──
      const pinX = W - 55;
      const pinY = ROAD_Y - 36;
      ctx.fillStyle = "#1A6EF5";
      ctx.beginPath();
      ctx.arc(pinX, pinY, 10, 0, Math.PI * 2);
      ctx.fill();
      // pin tail
      ctx.beginPath();
      ctx.moveTo(pinX - 5, pinY + 8);
      ctx.lineTo(pinX + 5, pinY + 8);
      ctx.lineTo(pinX, pinY + 18);
      ctx.closePath();
      ctx.fill();
      // white dot inside pin
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(pinX, pinY, 4, 0, Math.PI * 2);
      ctx.fill();

      // ── Pulsing radius rings from pin ──
      pulseT += 0.03;
      for (let r = 0; r < 3; r++) {
        const phase = (pulseT + r * 0.5) % 1.5;
        const radius = 14 + phase * 18;
        const alpha = Math.max(0, 0.4 - phase * 0.27);
        ctx.beginPath();
        ctx.arc(pinX, pinY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(26,110,245,${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // ── Dotted path (from tech to destination) ──
      const pathStartX = techX + TECH_W + 6;
      const pathEndX = pinX - 12;
      if (pathStartX < pathEndX) {
        for (let dx = pathStartX; dx < pathEndX; dx += 10) {
          const t = (dx - pathStartX) / (pathEndX - pathStartX);
          const alpha = 0.15 + t * 0.35;
          ctx.fillStyle = `rgba(26,110,245,${alpha})`;
          ctx.beginPath();
          ctx.arc(dx, ROAD_Y + ROAD_H * 0.38, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Technician figure ──
      const tx = techX;
      const ty = ROAD_Y - TECH_H + 6; // feet on road

      // Shadow
      ctx.fillStyle = "rgba(100,110,140,0.12)";
      ctx.beginPath();
      ctx.ellipse(tx + TECH_W / 2, GROUND_Y - 1, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Walk cycle: subtle vertical bob
      const bob = Math.sin(techX * 0.18) * 1.5;

      // Toolbox / bag (carried in right hand)
      const bagX = tx + TECH_W - 2;
      const bagY = ty + 28 + bob;
      ctx.fillStyle = "#EF9F27";
      ctx.fillRect(bagX, bagY, 9, 7);
      ctx.fillStyle = "#BA7517";
      ctx.fillRect(bagX, bagY, 9, 2);
      // handle
      ctx.strokeStyle = "#BA7517";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bagX + 2, bagY);
      ctx.lineTo(bagX + 2, bagY - 3);
      ctx.lineTo(bagX + 7, bagY - 3);
      ctx.lineTo(bagX + 7, bagY);
      ctx.stroke();

      // Body (torso)
      ctx.fillStyle = "#1A6EF5";
      ctx.beginPath();
      ctx.roundRect(tx + 5, ty + 14 + bob, TECH_W - 8, 18, 3);
      ctx.fill();

      // Hi-vis vest stripe
      ctx.fillStyle = "#FAC775";
      ctx.fillRect(tx + 5, ty + 20 + bob, TECH_W - 8, 3);

      // Head
      ctx.fillStyle = "#F5C4B3";
      ctx.beginPath();
      ctx.arc(tx + TECH_W / 2, ty + 10 + bob, 7, 0, Math.PI * 2);
      ctx.fill();

      // Hard hat
      ctx.fillStyle = "#FAC775";
      ctx.beginPath();
      ctx.ellipse(tx + TECH_W / 2, ty + 5 + bob, 9, 6, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(tx + TECH_W / 2 - 9, ty + 4 + bob, 18, 2);

      // Left arm (swinging)
      const armSwing = Math.sin(techX * 0.18) * 6;
      ctx.strokeStyle = "#1A6EF5";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tx + 7, ty + 18 + bob);
      ctx.lineTo(tx + 3, ty + 28 + bob + armSwing);
      ctx.stroke();

      // Right arm (holding bag — less swing)
      ctx.beginPath();
      ctx.moveTo(tx + TECH_W - 6, ty + 18 + bob);
      ctx.lineTo(bagX + 2, bagY);
      ctx.stroke();

      // Legs
      const legSwing = Math.sin(techX * 0.18) * 7;
      ctx.strokeStyle = "#2C2C2A";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(tx + 9, ty + 32 + bob);
      ctx.lineTo(tx + 7, ty + 44 + bob - legSwing);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tx + TECH_W - 8, ty + 32 + bob);
      ctx.lineTo(tx + TECH_W - 6, ty + 44 + bob + legSwing);
      ctx.stroke();

      // Advance
      techX += SPEED;
      if (techX > W + 60) techX = -60;

      // Progress fill
      progressRef.current = Math.min(1, progressRef.current + 0.002);

      rafRef.current = requestAnimationFrame(drawScene);
    }

    drawScene();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const step = STEPS[stepIdx];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');

        .tl-wrap {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #ffffff;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
        }

        .tl-card {
          background: #ffffff;
          border: 1px solid #E8EBF2;
          border-radius: 20px;
          width: 100%;
          max-width: 560px;
          overflow: hidden;
          box-shadow: 0 2px 24px rgba(30,50,100,0.07);
        }

        .tl-canvas-wrap {
          background: #F7F8FA;
          border-bottom: 1px solid #E8EBF2;
          padding: 0;
          line-height: 0;
        }

        .tl-canvas-wrap canvas {
          width: 100%;
          height: auto;
          display: block;
        }

        .tl-body {
          padding: 24px 28px 28px;
        }

        .tl-label {
          font-size: 17px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px;
          transition: opacity 0.3s ease;
          letter-spacing: -0.01em;
        }

        .tl-sub {
          font-size: 13px;
          color: #8A93A8;
          margin: 0 0 20px;
          font-weight: 400;
        }

        .tl-progress-track {
          background: #EEF0F6;
          border-radius: 99px;
          height: 4px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .tl-progress-fill {
          height: 100%;
          background: #1A6EF5;
          border-radius: 99px;
          animation: fill-progress 9.6s linear forwards;
          transform-origin: left;
        }

        @keyframes fill-progress {
          0%   { width: 0%; }
          25%  { width: 22%; }
          50%  { width: 51%; }
          75%  { width: 78%; }
          100% { width: 96%; }
        }

        .tl-steps {
          display: flex;
          gap: 0;
        }

        .tl-step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          position: relative;
        }

        .tl-step:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 9px;
          left: calc(50% + 9px);
          width: calc(100% - 18px);
          height: 1px;
          background: #E8EBF2;
        }

        .tl-step.done:not(:last-child)::after {
          background: #1A6EF5;
        }

        .tl-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid #E8EBF2;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          color: transparent;
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
        }

        .tl-step.done .tl-dot {
          background: #1A6EF5;
          border-color: #1A6EF5;
          color: #fff;
        }

        .tl-step.active .tl-dot {
          border-color: #1A6EF5;
          background: #E6F1FB;
          animation: pulse-dot 1.2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(26,110,245,0.35); }
          50%       { box-shadow: 0 0 0 5px rgba(26,110,245,0); }
        }

        .tl-step-name {
          font-size: 10px;
          color: #B0B8CC;
          font-weight: 500;
          letter-spacing: 0.02em;
          text-align: center;
        }

        .tl-step.done .tl-step-name,
        .tl-step.active .tl-step-name {
          color: #1A6EF5;
        }

        .tl-eta {
          margin-top: 20px;
          padding: 12px 16px;
          background: #F0F5FF;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tl-eta-icon {
          width: 32px;
          height: 32px;
          background: #1A6EF5;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tl-eta-text {
          font-size: 13px;
          color: #0C447C;
          font-weight: 500;
        }

        .tl-eta-sub {
          font-size: 11px;
          color: #378ADD;
          font-weight: 400;
        }

        /* Fade swap for microcopy */
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tl-label, .tl-sub {
          animation: fade-up 0.35s ease both;
        }
      `}</style>

      <div className="tl-wrap">
        <div className="tl-card">
          {/* Animated canvas */}
          <div className="tl-canvas-wrap">
            <canvas ref={canvasRef} />
          </div>

          <div className="tl-body">
            {/* Microcopy */}
            <p className="tl-label" key={step.label + "l"}>{step.label}</p>
            <p className="tl-sub"   key={step.label + "s"}>{step.sub}</p>

            {/* Progress bar */}
            <div className="tl-progress-track">
              <div className="tl-progress-fill" />
            </div>

            {/* Step indicators */}
            <div className="tl-steps">
              {["Searching", "Matching", "Confirmed", "En route"].map((name, i) => {
                const state =
                  stepIdx > i ? "done" :
                  stepIdx === i ? "active" : "";
                return (
                  <div className={`tl-step ${state}`} key={name}>
                    <div className="tl-dot">
                      {stepIdx > i && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="tl-step-name">{name}</span>
                  </div>
                );
              })}
            </div>

            {/* ETA card */}
            <div className="tl-eta">
              <div className="tl-eta-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1.5"/>
                  <path d="M8 4.5V8L10.5 9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div className="tl-eta-text">Estimated arrival: 12 min</div>
                <div className="tl-eta-sub">Technician is heading your way</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}