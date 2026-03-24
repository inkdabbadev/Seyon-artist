"use client"

import { useState, useCallback } from "react"
import Loader from "@/app/Loader"

interface Props {
  isGenerating: boolean
  outputs:      string[]
  onRegenerate?: () => void
}

export default function CanvasPanel({ isGenerating, outputs, onRegenerate }: Props) {
  const hasOutput  = outputs.length > 0
  const isCarousel = outputs.length > 1

  const [lightbox, setLightbox] = useState<number | null>(null)

  // ── Download single ───────────────────────────────────────────────────────
  const download = useCallback((src: string, i: number) => {
    const a = document.createElement("a")
    a.href = src
    a.download = `seyon-${Date.now()}-slide${i + 1}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  // ── Download all ──────────────────────────────────────────────────────────
  const downloadAll = useCallback(() => {
    outputs.forEach((src, i) => {
      setTimeout(() => download(src, i), i * 300)
    })
  }, [outputs, download])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

        /* ══ ROOT ══════════════════════════════════════════════════════════ */
        .cv {
          height: 100%; display: flex; flex-direction: column;
          background: transparent; position: relative; overflow: hidden;
        }

        /* ══ EMPTY STATE ═══════════════════════════════════════════════════ */
        .cv-empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          position: relative; overflow: hidden; padding: 48px 28px;
        }

        /* Perspective grid */
        .cv-grid-bg {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.020) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.020) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 70% 68% at 50% 50%, black 10%, transparent 100%);
          animation: cvGridBreathe 12s ease-in-out infinite;
        }
        @keyframes cvGridBreathe {
          0%,100% { opacity: 0.85 } 50% { opacity: 0.22 }
        }

        /* Ambient orb */
        .cv-orb {
          position: absolute; border-radius: 50%; pointer-events: none;
          filter: blur(72px); opacity: 0.06;
          background: radial-gradient(circle, #E8FF00, transparent 70%);
          width: 400px; height: 400px;
          top: 50%; left: 50%; transform: translate(-50%, -50%);
          animation: cvOrbPulse 8s ease-in-out infinite;
        }
        @keyframes cvOrbPulse {
          0%,100% { transform: translate(-50%,-50%) scale(1)   }
          50%     { transform: translate(-50%,-50%) scale(1.12) }
        }

        /* Icon container */
        .cv-empty-icon {
          width: 64px; height: 64px; border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.025);
          display: grid; place-items: center;
          margin-bottom: 22px; position: relative; z-index: 1;
          box-shadow: 0 0 0 8px rgba(255,255,255,0.018),
                      0 0 0 16px rgba(255,255,255,0.008);
        }

        .cv-empty-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px; letter-spacing: 0.20em; line-height: 1;
          color: rgba(255,255,255,0.55); margin-bottom: 12px;
          position: relative; z-index: 1;
        }
        .cv-empty-sub {
          font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 300;
          color: rgba(255,255,255,0.28); line-height: 1.80;
          max-width: 240px; text-align: center;
          position: relative; z-index: 1;
        }

        /* Style tags */
        .cv-tags {
          display: flex; flex-wrap: wrap; gap: 7px;
          justify-content: center; max-width: 320px; margin-top: 26px;
          position: relative; z-index: 1;
        }
        .cv-tag {
          padding: 5px 13px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.065);
          background: rgba(255,255,255,0.018);
          font-family: 'JetBrains Mono', monospace; font-size: 9px;
          color: rgba(255,255,255,0.22); letter-spacing: 0.14em; text-transform: uppercase;
          transition: border-color 0.20s, color 0.20s, background 0.20s;
          cursor: default;
        }
        .cv-tag:hover {
          border-color: rgba(232,255,0,0.22);
          background: rgba(232,255,0,0.04);
          color: rgba(232,255,0,0.60);
        }

        /* ══ OUTPUT AREA ═══════════════════════════════════════════════════ */
        .cv-output {
          flex: 1; overflow-y: auto;
          padding: 20px 22px 28px;
          scrollbar-width: thin;
          scrollbar-color: rgba(232,255,0,0.18) transparent;
        }
        .cv-output::-webkit-scrollbar { width: 2px }
        .cv-output::-webkit-scrollbar-track { background: transparent }
        .cv-output::-webkit-scrollbar-thumb {
          background: rgba(232,255,0,0.18); border-radius: 99px;
        }
        .cv-output::-webkit-scrollbar-thumb:hover {
          background: rgba(232,255,0,0.35);
        }

        /* ══ TOOLBAR ═══════════════════════════════════════════════════════ */
        .cv-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 18px; gap: 10px; flex-wrap: wrap;
        }
        .cv-toolbar-left { display: flex; align-items: center; gap: 9px }

        .cv-toolbar-label {
          font-family: 'JetBrains Mono', monospace; font-size: 9.5px;
          letter-spacing: 0.20em; text-transform: uppercase;
          color: rgba(255,255,255,0.28);
        }
        .cv-carousel-badge {
          padding: 3px 10px; border-radius: 999px;
          background: rgba(232,255,0,0.07);
          border: 1px solid rgba(232,255,0,0.20);
          font-family: 'JetBrains Mono', monospace; font-size: 9px;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(232,255,0,0.72);
        }
        .cv-toolbar-actions { display: flex; gap: 7px; flex-wrap: wrap }

        /* ══ BUTTONS ════════════════════════════════════════════════════════ */
        .cv-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 13px; border-radius: 8px; cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase;
          border: 1px solid; white-space: nowrap;
          transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        .cv-btn-ghost {
          border-color: rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.025);
          color: rgba(255,255,255,0.42);
        }
        .cv-btn-ghost:hover {
          border-color: rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.055);
          color: rgba(255,255,255,0.78);
          transform: translateY(-0.5px);
        }
        .cv-btn-yellow {
          border-color: rgba(232,255,0,0.26);
          background: rgba(232,255,0,0.07);
          color: rgba(232,255,0,0.85);
        }
        .cv-btn-yellow:hover {
          border-color: rgba(232,255,0,0.42);
          background: rgba(232,255,0,0.13);
          color: #E8FF00;
          box-shadow: 0 0 20px rgba(232,255,0,0.12);
          transform: translateY(-0.5px);
        }

        /* ══ IMAGE GRID ═════════════════════════════════════════════════════ */
        .cv-grid-1 {
          display: grid; gap: 16px; grid-template-columns: 1fr;
          max-width: 620px; margin: 0 auto;
        }
        .cv-grid-2 { display: grid; gap: 12px; grid-template-columns: 1fr 1fr }
        .cv-grid-3 { display: grid; gap: 10px; grid-template-columns: 1fr 1fr 1fr }

        /* Image card */
        .cv-card {
          position: relative; border-radius: 14px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.065);
          background: rgba(255,255,255,0.018);
          cursor: zoom-in;
          transition: border-color 0.22s, box-shadow 0.22s, transform 0.22s cubic-bezier(0.16,1,0.3,1);
        }
        .cv-card:hover {
          border-color: rgba(255,255,255,0.13);
          box-shadow: 0 10px 48px rgba(0,0,0,0.55);
          transform: translateY(-3px);
        }
        .cv-card img { width: 100%; height: auto; display: block }

        /* Hover overlay — gradient + buttons */
        .cv-overlay {
          position: absolute; inset: 0; opacity: 0;
          display: flex; align-items: flex-end; justify-content: center;
          padding-bottom: 16px; gap: 8px;
          background: linear-gradient(to top,
            rgba(0,0,0,0.82) 0%,
            rgba(0,0,0,0.22) 45%,
            transparent 100%);
          transition: opacity 0.22s;
        }
        .cv-card:hover .cv-overlay { opacity: 1 }

        .cv-ov-btn {
          padding: 8px 15px; border-radius: 8px; border: none;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase;
          transition: all 0.15s;
        }
        .cv-ov-view {
          background: rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.82);
          border: 1px solid rgba(255,255,255,0.14) !important;
        }
        .cv-ov-view:hover { background: rgba(255,255,255,0.18) }
        .cv-ov-save {
          background: #E8FF00; color: #060609; font-weight: 600;
        }
        .cv-ov-save:hover {
          filter: brightness(1.06);
          box-shadow: 0 0 22px rgba(232,255,0,0.40);
        }

        /* Slide badge */
        .cv-slide-badge {
          position: absolute; top: 9px; left: 9px;
          padding: 3px 8px; border-radius: 6px;
          background: rgba(0,0,0,0.72); backdrop-filter: blur(6px);
          font-family: 'JetBrains Mono', monospace; font-size: 8px;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(255,255,255,0.40);
        }

        /* ══ LIGHTBOX ═══════════════════════════════════════════════════════ */
        .cv-lb {
          position: fixed; inset: 0; z-index: 9990;
          background: rgba(0,0,0,0.94);
          backdrop-filter: blur(24px) saturate(120%);
          -webkit-backdrop-filter: blur(24px) saturate(120%);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .cv-lb-inner {
          position: relative; display: flex; flex-direction: column;
          align-items: center; gap: 16px;
          max-width: min(88vw, 920px); max-height: 92vh;
        }
        .cv-lb-frame {
          border-radius: 16px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.09);
          box-shadow: 0 48px 140px rgba(0,0,0,0.90);
        }
        .cv-lb-frame img {
          max-height: 78vh; max-width: 100%; display: block; object-fit: contain;
        }
        .cv-lb-actions { display: flex; gap: 8px }

        /* Close button */
        .cv-lb-close {
          position: fixed; top: 18px; right: 20px;
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.65); cursor: pointer;
          display: grid; place-items: center;
          transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        .cv-lb-close:hover {
          background: rgba(255,255,255,0.10);
          border-color: rgba(255,255,255,0.20);
          color: rgba(255,255,255,0.92);
          transform: rotate(90deg);
        }

        /* Carousel nav */
        .cv-lb-nav {
          position: fixed; top: 50%; transform: translateY(-50%);
          width: 40px; height: 40px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.65); cursor: pointer;
          display: grid; place-items: center;
          transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        .cv-lb-nav:hover {
          background: rgba(255,255,255,0.10);
          border-color: rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.92);
        }
        .cv-lb-nav:disabled { opacity: 0.22; cursor: not-allowed }
        .cv-lb-prev { left: 16px }
        .cv-lb-next { right: 16px }

        /* Lightbox counter */
        .cv-lb-counter {
          font-family: 'JetBrains Mono', monospace; font-size: 9.5px;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.28);
        }
      `}</style>

      <div className="cv">

        {/* Loader overlay */}
        <Loader
          lod={isGenerating}
          message="Seyon is composing your vision..."
          mode="scoped"
          minMs={700}
          graceMs={650}
          zIndex={40}
        />

        {/* ══ EMPTY STATE ══ */}
        {!isGenerating && !hasOutput && (
          <div className="cv-empty">
            <div className="cv-grid-bg" />
            <div className="cv-orb" />

            <div className="cv-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.20)" strokeWidth="1.2" strokeLinecap="round">
                <rect x="3"  y="3"  width="7" height="7" rx="1.5"/>
                <rect x="14" y="3"  width="7" height="7" rx="1.5"/>
                <rect x="3"  y="14" width="7" height="7" rx="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5"/>
              </svg>
            </div>

            <div className="cv-empty-title">Studio Canvas</div>

            <p className="cv-empty-sub">
              Configure your setup and hit{" "}
              <span style={{ color:"rgba(232,255,0,0.70)" }}>Generate</span>{" "}
              to create your first image.
            </p>

            <div className="cv-tags">
              {["Art Director", "Netflix Thumbnail", "Devotional Art", "Caricature", "Brand Identity", "Social Post"].map(s => (
                <span key={s} className="cv-tag">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* ══ OUTPUT ══ */}
        {!isGenerating && hasOutput && (
          <div className="cv-output">

            {/* Toolbar */}
            <div className="cv-toolbar">
              <div className="cv-toolbar-left">
                <span className="cv-toolbar-label">
                  {isCarousel ? `${outputs.length} Slides` : "Generated Output"}
                </span>
                {isCarousel && <span className="cv-carousel-badge">Carousel</span>}
              </div>

              <div className="cv-toolbar-actions">
                {onRegenerate && (
                  <button className="cv-btn cv-btn-ghost" onClick={onRegenerate}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M23 4v6h-6M1 20v-6h6"/>
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                    Regenerate
                  </button>
                )}

                {isCarousel ? (
                  <button className="cv-btn cv-btn-yellow" onClick={downloadAll}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download All
                  </button>
                ) : (
                  <button className="cv-btn cv-btn-yellow" onClick={() => download(outputs[0], 0)}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download
                  </button>
                )}
              </div>
            </div>

            {/* Image grid */}
            <div className={
              outputs.length === 1 ? "cv-grid-1" :
              outputs.length <= 4 ? "cv-grid-2" :
              "cv-grid-3"
            }>
              {outputs.map((src, i) => (
                <div key={i} className="cv-card" onClick={() => setLightbox(i)}>
                  <img src={src} alt={`Seyon output slide ${i + 1}`} loading="lazy" />

                  <div className="cv-overlay" onClick={e => e.stopPropagation()}>
                    <button className="cv-ov-btn cv-ov-view" onClick={() => setLightbox(i)}>
                      View
                    </button>
                    <button className="cv-ov-btn cv-ov-save" onClick={() => download(src, i)}>
                      ↓ Save
                    </button>
                  </div>

                  {isCarousel && (
                    <div className="cv-slide-badge">Slide {i + 1}</div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* ══ LIGHTBOX ══ */}
      {lightbox !== null && (
        <div className="cv-lb" onClick={() => setLightbox(null)}>
          <div className="cv-lb-inner" onClick={e => e.stopPropagation()}>

            <div className="cv-lb-frame">
              <img src={outputs[lightbox]} alt={`Slide ${lightbox + 1} fullscreen`} />
            </div>

            {isCarousel && (
              <div className="cv-lb-counter">
                {lightbox + 1} / {outputs.length}
              </div>
            )}

            <div className="cv-lb-actions">
              <button
                className="cv-btn cv-btn-ghost"
                style={{ borderRadius:999 }}
                onClick={() => setLightbox(null)}
              >
                Close
              </button>
              <button
                className="cv-btn cv-btn-yellow"
                style={{ borderRadius:999 }}
                onClick={() => download(outputs[lightbox], lightbox)}
              >
                ↓ Download{isCarousel ? ` Slide ${lightbox + 1}` : ""}
              </button>
            </div>
          </div>

          {/* Close X */}
          <button className="cv-lb-close" onClick={() => setLightbox(null)} aria-label="Close lightbox">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          {/* Carousel arrows */}
          {isCarousel && (
            <>
              <button
                className="cv-lb-nav cv-lb-prev"
                onClick={e => { e.stopPropagation(); setLightbox(l => l! > 0 ? l! - 1 : l) }}
                disabled={lightbox === 0}
                aria-label="Previous slide"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button
                className="cv-lb-nav cv-lb-next"
                onClick={e => { e.stopPropagation(); setLightbox(l => l! < outputs.length - 1 ? l! + 1 : l) }}
                disabled={lightbox === outputs.length - 1}
                aria-label="Next slide"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}