"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

type LoaderMode = "scoped" | "fullscreen"

export default function Loader({
  lod,
  message  = "Composing your vision...",
  mode     = "scoped",
  minMs    = 650,
  graceMs  = 450,
  zIndex   = 30,
}: {
  lod:      boolean
  message?: string
  mode?:    LoaderMode
  minMs?:   number
  graceMs?: number
  zIndex?:  number
}) {
  const [show,       setShow]       = useState(false)
  const startAtRef   = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (hideTimerRef.current) { window.clearTimeout(hideTimerRef.current); hideTimerRef.current = null }
    if (lod) { startAtRef.current = Date.now(); setShow(true); return }
    const elapsed   = Date.now() - (startAtRef.current ?? Date.now())
    const remaining = Math.max(0, minMs - elapsed)
    hideTimerRef.current = window.setTimeout(() => {
      setShow(false); startAtRef.current = null; hideTimerRef.current = null
    }, remaining + graceMs)
    return () => { if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current) }
  }, [lod, minMs, graceMs])

  const BARS = [
    { h: 12, delay: 0,    op: 0.35 },
    { h: 20, delay: 0.14, op: 0.65 },
    { h: 16, delay: 0.05, op: 0.55 },
    { h: 26, delay: 0.24, op: 1.00 },
    { h: 16, delay: 0.09, op: 0.55 },
    { h: 20, delay: 0.19, op: 0.65 },
    { h: 12, delay: 0,    op: 0.35 },
  ]

  return (
    <AnimatePresence>
      {show && (
        <>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500&display=swap');

            /* ══ ROOT ══════════════════════════════════════════════════════ */
            .ld {
              inset: 0; display: flex; flex-direction: column;
              align-items: center; justify-content: center;
              overflow: hidden; border-radius: inherit;
            }
            .ld.scoped     { position: absolute }
            .ld.fullscreen { position: fixed }

            /* ══ LAYERS ════════════════════════════════════════════════════ */
            /* Deep blur glass */
            .ld-glass {
              position: absolute; inset: 0;
              background: rgba(5,5,12,0.78);
              backdrop-filter: blur(32px) saturate(140%);
              -webkit-backdrop-filter: blur(32px) saturate(140%);
            }

            /* Ambient glow blob */
            .ld-glow {
              position: absolute; border-radius: 50%;
              width: 320px; height: 320px;
              background: radial-gradient(circle, rgba(232,255,0,0.08) 0%, transparent 70%);
              filter: blur(40px);
              animation: ldGlowPulse 3s ease-in-out infinite;
              pointer-events: none;
            }
            @keyframes ldGlowPulse {
              0%,100% { transform: scale(1);    opacity: 0.85 }
              50%     { transform: scale(1.18); opacity: 0.40 }
            }

            /* Vignette */
            .ld-vig {
              position: absolute; inset: 0; pointer-events: none;
              background: radial-gradient(ellipse 60% 60% at 50% 50%,
                transparent 30%, rgba(5,5,12,0.88) 100%);
            }

            /* Perspective grid */
            .ld-grid {
              position: absolute; inset: 0; pointer-events: none;
              background-image:
                linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
              background-size: 52px 52px;
              mask-image: radial-gradient(ellipse 65% 65% at 50% 50%, black 0%, transparent 100%);
              animation: ldGridFade 3s ease-in-out infinite;
            }
            @keyframes ldGridFade {
              0%,100% { opacity: 0.60 } 50% { opacity: 0.20 }
            }

            /* ══ BODY ═══════════════════════════════════════════════════════ */
            .ld-body {
              position: relative; z-index: 1;
              display: flex; flex-direction: column;
              align-items: center; gap: 0;
            }

            /* ══ LOGO MARK ══════════════════════════════════════════════════ */
            .ld-logo {
              position: relative; width: 72px; height: 72px;
              display: grid; place-items: center;
            }

            /* Outer ring — slow spin */
            .ld-ring-outer {
              position: absolute; inset: 0;
              animation: ldSpinSlow 4s linear infinite;
            }
            /* Inner ring — counter spin */
            .ld-ring-inner {
              position: absolute; inset: 8px;
              animation: ldSpinFast 2.2s linear infinite reverse;
            }
            @keyframes ldSpinSlow { to { transform: rotate(360deg) } }
            @keyframes ldSpinFast { to { transform: rotate(360deg) } }

            /* Center dot — breathes */
            .ld-core {
              position: relative; z-index: 1;
              width: 14px; height: 14px; border-radius: 50%;
              background: #E8FF00;
              box-shadow:
                0 0 0 3px rgba(232,255,0,0.12),
                0 0 0 7px rgba(232,255,0,0.06),
                0 0 20px rgba(232,255,0,0.55),
                0 0 48px rgba(232,255,0,0.22);
              animation: ldCorePulse 1.8s ease-in-out infinite;
            }
            @keyframes ldCorePulse {
              0%,100% { transform: scale(0.85); box-shadow: 0 0 0 3px rgba(232,255,0,0.10), 0 0 16px rgba(232,255,0,0.40) }
              50%     { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(232,255,0,0.08), 0 0 36px rgba(232,255,0,0.70), 0 0 72px rgba(232,255,0,0.18) }
            }

            /* ══ PROGRESS BAR ═══════════════════════════════════════════════ */
            .ld-progress-wrap {
              margin-top: 32px; width: 180px;
            }
            .ld-progress-track {
              height: 2px; border-radius: 99px;
              background: rgba(255,255,255,0.07); overflow: hidden;
            }
            .ld-progress-fill {
              height: 100%; border-radius: 99px;
              background: linear-gradient(90deg, rgba(232,255,0,0.30), #E8FF00, rgba(232,255,0,0.30));
              background-size: 200% 100%;
              animation: ldProgressShimmer 1.8s ease-in-out infinite;
              width: 60%;
            }
            @keyframes ldProgressShimmer {
              0%   { background-position: -100% 0; width: 20% }
              50%  { background-position:  100% 0; width: 70% }
              100% { background-position:  200% 0; width: 20% }
            }

            /* ══ BARS (equalizer) ═══════════════════════════════════════════ */
            .ld-bars {
              display: flex; align-items: flex-end;
              gap: 4px; margin-top: 20px; height: 28px;
            }
            .ld-bar {
              width: 3px; border-radius: 99px;
              background: linear-gradient(to top, rgba(232,255,0,0.90), rgba(232,255,0,0.30));
              transform-origin: bottom;
              animation: ldBarBounce 1.1s ease-in-out infinite;
            }
            @keyframes ldBarBounce {
              0%,100% { transform: scaleY(0.20); opacity: 0.40 }
              50%     { transform: scaleY(1.00); opacity: 1 }
            }

            /* ══ TEXT ═══════════════════════════════════════════════════════ */
            .ld-msg {
              margin-top: 20px;
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
              color: rgba(255,255,255,0.45);
              text-align: center; padding: 0 28px; line-height: 1.70;
              /* Subtle typing shimmer */
              background: linear-gradient(90deg,
                rgba(255,255,255,0.45) 0%,
                rgba(255,255,255,0.80) 40%,
                rgba(255,255,255,0.45) 80%
              );
              background-size: 200% auto;
              -webkit-background-clip: text; -webkit-text-fill-color: transparent;
              background-clip: text;
              animation: ldTextShimmer 2.8s ease-in-out infinite;
            }
            @keyframes ldTextShimmer {
              0%   { background-position: 0%   center }
              100% { background-position: 200% center }
            }

            .ld-brand {
              margin-top: 10px;
              font-family: 'Bebas Neue', sans-serif;
              font-size: 14px; letter-spacing: 0.32em;
              color: rgba(232,255,0,0.38);
              text-align: center;
              animation: ldBrandPulse 2.4s ease-in-out infinite;
            }
            @keyframes ldBrandPulse {
              0%,100% { opacity: 0.38 } 50% { opacity: 0.65 }
            }
          `}</style>

          <motion.div
            className={`ld ${mode}`}
            style={{ zIndex }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            {/* Background layers */}
            <div className="ld-glass" />
            <div className="ld-grid" />
            <div className="ld-glow" />
            <div className="ld-vig" />

            <div className="ld-body">

              {/* ── Logo ring system ── */}
              <div className="ld-logo">

                {/* Outer ring — dashed arc */}
                <svg className="ld-ring-outer" width="72" height="72" viewBox="0 0 72 72" fill="none">
                  <circle cx="36" cy="36" r="32" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                  <circle cx="36" cy="36" r="32"
                    stroke="#E8FF00"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="50 150"
                    opacity="0.75"/>
                  <circle cx="36" cy="36" r="32"
                    stroke="rgba(167,139,250,0.40)"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeDasharray="20 180"
                    opacity="0.60"/>
                </svg>

                {/* Inner ring — solid small arc */}
                <svg className="ld-ring-inner" width="56" height="56" viewBox="0 0 56 56" fill="none">
                  <circle cx="28" cy="28" r="22" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
                  <circle cx="28" cy="28" r="22"
                    stroke="rgba(232,255,0,0.55)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="28 110"/>
                </svg>

                {/* Core dot */}
                <div className="ld-core" />
              </div>

              {/* ── Progress bar ── */}
              <div className="ld-progress-wrap">
                <div className="ld-progress-track">
                  <div className="ld-progress-fill" />
                </div>
              </div>

              {/* ── Equalizer bars ── */}
              <div className="ld-bars">
                {BARS.map((b, i) => (
                  <div key={i} className="ld-bar" style={{
                    height:         b.h,
                    opacity:        b.op,
                    animationDelay: `${b.delay}s`,
                  }} />
                ))}
              </div>

              {/* ── Message ── */}
              <p className="ld-msg">{message}</p>
              <p className="ld-brand">SEYON AI</p>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}