"use client"
import { useState } from "react"
import type { UserProfile } from "@/types"
import CreditsModal from "@/components/auth/CreditsModal"

export default function ProfilePanel({ profile, onRegenerate }: { profile: UserProfile; onRegenerate?: () => void }) {
  const [creditsOpen, setCreditsOpen] = useState(false)
  const [lightbox, setLightbox]       = useState<null | { src: string; style: string; createdAt: string }>(null)
  const [view, setView]               = useState<"grid" | "list">("grid")
  const [filter, setFilter]           = useState<string>("all")

  // ── Safe field access ─────────────────────────────────────────────────────
  const isOrg         = profile?.isOrgMember        ?? false
  const credits       = profile?.credits             ?? 0
  const name          = profile?.displayName         ?? profile?.email?.split("@")[0] ?? "User"
  const email         = profile?.email               ?? ""
  const since         = profile?.memberSince         ?? ""
  const styleUsage    = profile?.styleUsage          ?? {}
  const creations     = profile?.creations           ?? []
  const totalGen      = profile?.totalGenerations    ?? 0
  const singleGen     = profile?.singleGenerations   ?? 0
  const carouselGen   = profile?.carouselGenerations ?? 0
  const totalCreations = profile?.totalCreations     ?? creations.length  // fallback to array length for existing users
  const lastGen       = profile?.lastGenerationAt    ?? ""
  // ─────────────────────────────────────────────────────────────────────────

  const isLow    = !isOrg && credits < 5
  const initial  = name.charAt(0).toUpperCase()
  const maxStyle = Math.max(...Object.values(styleUsage), 1)

  const allStyles = ["all", ...Array.from(new Set(creations.map(c => c.style).filter(Boolean)))]
  const filtered  = filter === "all"
    ? [...creations].reverse()
    : [...creations].reverse().filter(c => c.style === filter)

  const download = (src: string, i: number) => {
    const a = document.createElement("a"); a.href = src
    a.download = `creation-${i}.png`; a.click()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@200;300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

        /* ══ SCROLL ROOT ════════════════════════════════════════════════════ */
        .pp {
          height: 100%; overflow-y: auto;
          display: flex; flex-direction: column; gap: 7px;
          padding: 14px 15px 32px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.055) transparent;
        }
        .pp::-webkit-scrollbar       { width: 2px }
        .pp::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px }

        /* ══ PROFILE CARD ═══════════════════════════════════════════════════ */
        .pp-card {
          border-radius: 13px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
          background: linear-gradient(135deg,rgba(8,18,8,0.85),rgba(10,10,22,0.90),rgba(18,8,22,0.85));
          position: relative;
        }
        .pp-card-line {
          position: absolute; top: 0; left: 0; right: 0; height: 1px; pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(232,255,0,0.50) 35%, rgba(167,139,250,0.32) 65%, transparent);
        }
        .pp-card-body {
          padding: 15px; display: flex; align-items: center; gap: 12px;
        }

        /* Avatar */
        .pp-avatar {
          width: 46px; height: 46px; border-radius: 13px; flex-shrink: 0;
          background: linear-gradient(135deg, #E8FF00 0%, rgba(167,139,250,0.85) 100%);
          display: grid; place-items: center;
          font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: #060609;
        }
        .pp-meta { min-width: 0; flex: 1 }
        .pp-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 17px; letter-spacing: 0.12em; line-height: 1;
          color: rgba(255,255,255,0.92);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pp-email {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; letter-spacing: 0.05em; color: rgba(255,255,255,0.35);
          margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pp-since {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(255,255,255,0.18); margin-top: 5px;
        }
        .pp-org-pill {
          margin-left: auto; padding: 3px 10px; border-radius: 999px; flex-shrink: 0;
          border: 1px solid rgba(167,139,250,0.28);
          background: rgba(167,139,250,0.08);
          font-family: 'JetBrains Mono', monospace; font-size: 8px;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(196,181,253,0.85);
        }

        /* ══ CREATION COUNTER CARD ══════════════════════════════════════════ */
        .pp-counter {
          border-radius: 13px; overflow: hidden;
          border: 1px solid rgba(232,255,0,0.13);
          background: linear-gradient(135deg, rgba(232,255,0,0.042) 0%, rgba(10,10,22,0.70) 100%);
          padding: 14px 16px;
          display: flex; align-items: center; justify-content: space-between;
          position: relative;
        }
        .pp-counter::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(232,255,0,0.45) 50%, transparent);
          pointer-events: none;
        }
        .pp-counter-left {}
        .pp-counter-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(232,255,0,0.50); margin-bottom: 4px;
        }
        .pp-counter-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 48px; letter-spacing: 0.03em; line-height: 1;
          color: rgba(232,255,0,0.92);
        }
        .pp-counter-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8.5px; letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(255,255,255,0.28); margin-top: 4px;
        }
        .pp-counter-icon {
          width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
          display: grid; place-items: center;
          border: 1px solid rgba(232,255,0,0.14);
          background: rgba(232,255,0,0.05);
        }

        /* ══ STAT ROW ════════════════════════════════════════════════════════ */
        .pp-stats {
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;
        }
        .pp-stat {
          padding: 12px 8px; border-radius: 10px; text-align: center;
          border: 1px solid rgba(255,255,255,0.062);
          background: rgba(255,255,255,0.016);
        }
        .pp-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 30px; letter-spacing: 0.03em; line-height: 1;
        }
        .pp-stat-lbl {
          font-family: 'JetBrains Mono', monospace;
          font-size: 7.5px; letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(255,255,255,0.26); margin-top: 4px;
        }

        /* ══ CREDITS BUTTON ══════════════════════════════════════════════════ */
        .pp-credits {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          padding: 14px 14px; border-radius: 12px; border: 1px solid; text-align: left;
          cursor: pointer; transition: filter 0.20s, transform 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        .pp-credits:hover:not(.pp-credits-static) {
          filter: brightness(1.10); transform: translateY(-0.5px);
        }
        .pp-credits.pp-credits-static { cursor: default }
        .pp-cred-sup {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8.5px; letter-spacing: 0.18em; text-transform: uppercase;
          margin-bottom: 5px;
        }
        .pp-cred-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 36px; letter-spacing: 0.03em; line-height: 1;
          color: rgba(255,255,255,0.90);
        }
        .pp-cred-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8.5px; letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.28); margin-top: 5px;
        }
        .pp-cred-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          display: grid; place-items: center;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.09);
        }

        /* ══ LAST GEN ════════════════════════════════════════════════════════ */
        .pp-lastgen {
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 12px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.052);
          background: rgba(255,255,255,0.010);
        }
        .pp-lastgen-lbl {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.24);
        }
        .pp-lastgen-val {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px; color: rgba(255,255,255,0.48);
        }

        /* ══ STYLE USAGE ═════════════════════════════════════════════════════ */
        .pp-usage {
          padding: 13px 13px; border-radius: 11px;
          border: 1px solid rgba(255,255,255,0.062);
          background: rgba(255,255,255,0.010);
        }
        .pp-usage-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8.5px; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(255,255,255,0.26); margin-bottom: 13px;
        }
        .pp-usage-row { margin-bottom: 10px }
        .pp-usage-row:last-child { margin-bottom: 0 }
        .pp-usage-meta {
          display: flex; justify-content: space-between; margin-bottom: 5px;
        }
        .pp-usage-name {
          font-family: 'DM Sans', sans-serif; font-size: 11.5px; font-weight: 400;
          color: rgba(232,255,0,0.72);
        }
        .pp-usage-count {
          font-family: 'JetBrains Mono', monospace; font-size: 9px;
          color: rgba(255,255,255,0.26);
        }
        .pp-track {
          height: 2px; border-radius: 99px;
          background: rgba(255,255,255,0.055);
        }
        .pp-track-fill {
          height: 100%; border-radius: 99px;
          background: linear-gradient(90deg, rgba(232,255,0,0.72), rgba(232,255,0,0.28));
          transition: width 0.70s cubic-bezier(0.16,1,0.3,1);
        }

        /* ══ CREATIONS SECTION ═══════════════════════════════════════════════ */
        .pp-cr {
          border-radius: 12px; border: 1px solid rgba(255,255,255,0.062);
          overflow: hidden; background: rgba(255,255,255,0.008);
        }
        .pp-cr-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 11px 13px; border-bottom: 1px solid rgba(255,255,255,0.052);
        }
        .pp-cr-head-left { display: flex; align-items: center; gap: 8px }
        .pp-cr-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8.5px; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(255,255,255,0.28);
        }
        .pp-cr-badge {
          padding: 2px 8px; border-radius: 999px;
          background: rgba(232,255,0,0.07);
          border: 1px solid rgba(232,255,0,0.18);
          font-family: 'JetBrains Mono', monospace; font-size: 8px;
          letter-spacing: 0.08em; color: rgba(232,255,0,0.68);
        }

        /* View toggle buttons */
        .pp-vtoggle {
          width: 26px; height: 26px; border-radius: 6px; cursor: pointer;
          display: grid; place-items: center; border: 1px solid;
          transition: all 0.15s;
        }

        /* Filter tabs */
        .pp-filters {
          display: flex; gap: 5px; padding: 8px 12px;
          overflow-x: auto; border-bottom: 1px solid rgba(255,255,255,0.048);
          scrollbar-width: none;
        }
        .pp-filters::-webkit-scrollbar { display: none }
        .pp-ftab {
          padding: 4px 11px; border-radius: 999px; cursor: pointer; flex-shrink: 0;
          font-family: 'JetBrains Mono', monospace; font-size: 8.5px;
          letter-spacing: 0.12em; text-transform: capitalize;
          white-space: nowrap; border: 1px solid;
          transition: all 0.15s;
        }

        /* Grid */
        .pp-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 7px;
          padding: 10px;
        }
        /* List */
        .pp-list { display: flex; flex-direction: column; gap: 6px; padding: 10px }

        /* ── Grid card ── */
        .pp-gc {
          position: relative; border-radius: 10px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.062); cursor: zoom-in; aspect-ratio: 1;
        }
        .pp-gc img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.30s cubic-bezier(0.16,1,0.3,1);
        }
        .pp-gc:hover img { transform: scale(1.05) }
        .pp-gc-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.60);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 8px;
          opacity: 0; transition: opacity 0.20s;
        }
        .pp-gc:hover .pp-gc-overlay { opacity: 1 }
        .pp-gc-foot {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 18px 8px 7px;
          background: linear-gradient(to top, rgba(0,0,0,0.80), transparent);
          transition: opacity 0.20s;
        }
        .pp-gc:hover .pp-gc-foot { opacity: 0 }
        .pp-gc-style {
          font-family: 'JetBrains Mono', monospace;
          font-size: 7.5px; letter-spacing: 0.05em; color: rgba(255,255,255,0.38);
        }

        /* ── List card ── */
        .pp-lc {
          display: flex; gap: 11px; padding: 9px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.052); cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .pp-lc:hover { background: rgba(255,255,255,0.025); border-color: rgba(255,255,255,0.10) }
        .pp-lc-thumb {
          width: 68px; height: 68px; border-radius: 8px;
          overflow: hidden; flex-shrink: 0;
        }
        .pp-lc-thumb img { width: 100%; height: 100%; object-fit: cover; display: block }
        .pp-lc-meta {
          flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between;
        }
        .pp-lc-style {
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400;
          color: rgba(232,255,0,0.70);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pp-lc-date {
          font-family: 'JetBrains Mono', monospace; font-size: 8.5px;
          color: rgba(255,255,255,0.24); margin-top: 3px;
        }
        .pp-lc-btns { display: flex; gap: 6px; margin-top: 8px }

        /* ── Shared tiny buttons ── */
        .pp-btn-save {
          padding: 5px 11px; border-radius: 6px; border: none; cursor: pointer;
          font-family: 'JetBrains Mono', monospace; font-size: 8.5px;
          letter-spacing: 0.12em; text-transform: uppercase;
          background: #E8FF00; color: #060609; font-weight: 600;
          transition: filter 0.14s;
        }
        .pp-btn-save:hover { filter: brightness(1.08) }
        .pp-btn-ghost {
          padding: 5px 11px; border-radius: 6px; cursor: pointer;
          font-family: 'JetBrains Mono', monospace; font-size: 8.5px;
          letter-spacing: 0.12em; text-transform: uppercase;
          background: transparent; color: rgba(255,255,255,0.42);
          border: 1px solid rgba(255,255,255,0.10);
          transition: all 0.14s;
        }
        .pp-btn-ghost:hover { border-color: rgba(255,255,255,0.18); color: rgba(255,255,255,0.72) }

        /* ── Empty creations ── */
        .pp-cr-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 38px 24px; gap: 12px; text-align: center;
        }
        .pp-cr-empty-icon {
          width: 50px; height: 50px; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.062);
          background: rgba(255,255,255,0.016);
          display: grid; place-items: center;
        }
        .pp-cr-empty-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px; letter-spacing: 0.12em;
          color: rgba(255,255,255,0.42);
        }
        .pp-cr-empty-sub {
          font-family: 'JetBrains Mono', monospace; font-size: 9px;
          letter-spacing: 0.07em; color: rgba(255,255,255,0.20);
          line-height: 1.80;
        }

        /* ══ LIGHTBOX ════════════════════════════════════════════════════════ */
        .pp-lb {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.94);
          backdrop-filter: blur(22px) saturate(120%);
          -webkit-backdrop-filter: blur(22px) saturate(120%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 28px; cursor: zoom-out;
        }
        .pp-lb-inner {
          position: relative; max-width: 680px; width: 100%; cursor: default;
        }
        .pp-lb-close {
          position: absolute; top: -42px; right: 0;
          width: 32px; height: 32px; border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.13);
          background: rgba(255,255,255,0.055);
          color: rgba(255,255,255,0.68); cursor: pointer;
          display: grid; place-items: center;
          transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        .pp-lb-close:hover {
          background: rgba(255,255,255,0.10);
          border-color: rgba(255,255,255,0.20);
          color: white; transform: rotate(90deg);
        }
        .pp-lb-img {
          width: 100%; height: auto; border-radius: 14px; display: block;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .pp-lb-bar {
          margin-top: 14px; display: flex; align-items: center; justify-content: space-between;
          padding: 11px 14px; border-radius: 10px;
          background: rgba(255,255,255,0.030); border: 1px solid rgba(255,255,255,0.065);
        }
        .pp-lb-style {
          font-family: 'Bebas Neue', sans-serif; font-size: 15px; letter-spacing: 0.10em;
          color: rgba(255,255,255,0.88);
        }
        .pp-lb-date {
          font-family: 'JetBrains Mono', monospace; font-size: 8.5px;
          color: rgba(255,255,255,0.26); margin-top: 3px;
        }
        .pp-lb-btns { display: flex; gap: 8px }
      `}</style>

      {/* ══ LIGHTBOX ══ */}
      {lightbox && (
        <div className="pp-lb" onClick={() => setLightbox(null)}>
          <div className="pp-lb-inner" onClick={e => e.stopPropagation()}>
            <button className="pp-lb-close" onClick={() => setLightbox(null)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            <img className="pp-lb-img" src={lightbox.src} alt="" />
            <div className="pp-lb-bar">
              <div>
                <div className="pp-lb-style">{lightbox.style}</div>
                <div className="pp-lb-date">{lightbox.createdAt}</div>
              </div>
              <div className="pp-lb-btns">
                {onRegenerate && (
                  <button className="pp-btn-ghost" onClick={onRegenerate}>↺ Regen</button>
                )}
                <button className="pp-btn-save" onClick={() => download(lightbox.src, 0)}>↓ Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pp">

        {/* ── Profile card ── */}
        <div className="pp-card">
          <div className="pp-card-line" />
          <div className="pp-card-body">
            <div className="pp-avatar">{initial}</div>
            <div className="pp-meta">
              <div className="pp-name">{name}</div>
              <div className="pp-email">{email}</div>
              {since && <div className="pp-since">Since {since}</div>}
            </div>
            {isOrg && <div className="pp-org-pill">ORG</div>}
          </div>
        </div>

        {/* ── Total Creations counter — hero number ── */}
        <div className="pp-counter">
          <div className="pp-counter-left">
            <div className="pp-counter-eyebrow">All Time</div>
            <div className="pp-counter-num">{totalCreations}</div>
            <div className="pp-counter-label">Total Creations</div>
          </div>
          <div className="pp-counter-icon">
            {/* Sparkle / image icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="rgba(232,255,0,0.70)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        </div>

        {/* ── Generation stats ── */}
        <div className="pp-stats">
          {([
            ["Total Gen",  totalGen,    "rgba(255,255,255,0.88)"],
            ["Single",     singleGen,   "rgba(232,255,0,0.85)"],
            ["Carousel",   carouselGen, "rgba(167,139,250,0.85)"],
          ] as const).map(([lbl, val, col]) => (
            <div key={lbl} className="pp-stat">
              <div className="pp-stat-num" style={{ color: col }}>{val}</div>
              <div className="pp-stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>

        {/* ── Credits ── */}
        <button
          className={`pp-credits${isOrg ? " pp-credits-static" : ""}`}
          onClick={() => !isOrg && setCreditsOpen(true)}
          style={{
            borderColor: isOrg  ? "rgba(167,139,250,0.22)" :
                         isLow  ? "rgba(255,107,53,0.24)"  :
                                  "rgba(232,255,0,0.18)",
            background:  isOrg  ? "rgba(167,139,250,0.055)" :
                         isLow  ? "rgba(255,107,53,0.055)"  :
                                  "rgba(232,255,0,0.040)",
          }}>
          <div>
            <div className="pp-cred-sup" style={{
              color: isOrg ? "rgba(196,181,253,0.68)" : isLow ? "rgba(255,140,80,0.68)" : "rgba(232,255,0,0.62)",
            }}>Available Credits</div>
            <div className="pp-cred-num">{isOrg ? "∞" : credits}</div>
            <div className="pp-cred-sub">{isOrg ? "Unlimited" : isLow ? "Running low" : "Click to top up"}</div>
          </div>
          <div className="pp-cred-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.45)">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
        </button>

        {/* ── Last gen ── */}
        {lastGen && (
          <div className="pp-lastgen">
            <span className="pp-lastgen-lbl">Last Generation</span>
            <span className="pp-lastgen-val">{lastGen}</span>
          </div>
        )}

        {/* ── Style usage ── */}
        {Object.keys(styleUsage).length > 0 && (
          <div className="pp-usage">
            <div className="pp-usage-title">Style Usage</div>
            {Object.entries(styleUsage).map(([s, c]) => (
              <div key={s} className="pp-usage-row">
                <div className="pp-usage-meta">
                  <span className="pp-usage-name">{s}</span>
                  <span className="pp-usage-count">{c}</span>
                </div>
                <div className="pp-track">
                  <div className="pp-track-fill" style={{ width: `${(c / maxStyle) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Creations gallery ── */}
        <div className="pp-cr">

          {/* Header */}
          <div className="pp-cr-head">
            <div className="pp-cr-head-left">
              <span className="pp-cr-title">Your Creations</span>
              {creations.length > 0 && (
                <span className="pp-cr-badge">{creations.length}</span>
              )}
            </div>
            {creations.length > 0 && (
              <div style={{ display:"flex", gap:4 }}>
                {(["grid","list"] as const).map(v => (
                  <button key={v} className="pp-vtoggle"
                    onClick={() => setView(v)}
                    style={{
                      borderColor: view === v ? "rgba(232,255,0,0.26)" : "rgba(255,255,255,0.07)",
                      background:  view === v ? "rgba(232,255,0,0.08)" : "transparent",
                    }}>
                    {v === "grid"
                      ? <svg width="11" height="11" viewBox="0 0 12 12" fill={view==="grid" ? "rgba(232,255,0,0.82)" : "rgba(255,255,255,0.28)"}><rect x="0" y="0" width="5" height="5" rx="1"/><rect x="7" y="0" width="5" height="5" rx="1"/><rect x="0" y="7" width="5" height="5" rx="1"/><rect x="7" y="7" width="5" height="5" rx="1"/></svg>
                      : <svg width="11" height="11" viewBox="0 0 12 12" fill={view==="list" ? "rgba(232,255,0,0.82)" : "rgba(255,255,255,0.28)"}><rect x="0" y="1" width="12" height="2" rx="1"/><rect x="0" y="5" width="12" height="2" rx="1"/><rect x="0" y="9" width="12" height="2" rx="1"/></svg>
                    }
                  </button>
                ))}
              </div>
            )}
          </div>

          {creations.length > 0 ? (
            <>
              {/* Filter tabs */}
              {allStyles.length > 2 && (
                <div className="pp-filters">
                  {allStyles.map(s => (
                    <button key={s} className="pp-ftab"
                      onClick={() => setFilter(s)}
                      style={{
                        borderColor: filter === s ? "rgba(232,255,0,0.26)" : "rgba(255,255,255,0.07)",
                        background:  filter === s ? "rgba(232,255,0,0.07)" : "transparent",
                        color:       filter === s ? "rgba(232,255,0,0.82)" : "rgba(255,255,255,0.28)",
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {filtered.length === 0 ? (
                <div style={{ padding:"20px", textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.22)", letterSpacing:"0.08em" }}>
                  No creations for this style yet.
                </div>
              ) : view === "grid" ? (
                <div className="pp-grid">
                  {filtered.map((c, i) => (
                    <GridCard key={c.id || i} creation={c}
                      onOpen={() => setLightbox(c)}
                      onDownload={() => download(c.src, i)}
                      onRegenerate={onRegenerate} />
                  ))}
                </div>
              ) : (
                <div className="pp-list">
                  {filtered.map((c, i) => (
                    <ListCard key={c.id || i} creation={c}
                      onOpen={() => setLightbox(c)}
                      onDownload={() => download(c.src, i)}
                      onRegenerate={onRegenerate} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="pp-cr-empty">
              <div className="pp-cr-empty-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeLinecap="round">
                  <rect x="3"  y="3"  width="7" height="7" rx="1.5"/>
                  <rect x="14" y="3"  width="7" height="7" rx="1.5"/>
                  <rect x="3"  y="14" width="7" height="7" rx="1.5"/>
                  <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                </svg>
              </div>
              <div className="pp-cr-empty-title">No Creations Yet</div>
              <p className="pp-cr-empty-sub">Generate your first image<br/>to see it here.</p>
            </div>
          )}
        </div>

      </div>

      <CreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </>
  )
}

/* ══ GRID CARD ══════════════════════════════════════════════════════════════ */
function GridCard({ creation, onOpen, onDownload, onRegenerate }: {
  creation: { src: string; style: string; createdAt: string }
  onOpen: () => void; onDownload: () => void; onRegenerate?: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <div className="pp-gc"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onOpen}>
      <img src={creation.src} alt="" />

      <div className="pp-gc-overlay">
        <div style={{
          width:28, height:28, borderRadius:"50%",
          border:"1px solid rgba(255,255,255,0.26)",
          display:"grid", placeItems:"center",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            <path d="M11 8v6M8 11h6"/>
          </svg>
        </div>
        <div style={{ display:"flex", gap:5 }} onClick={e => e.stopPropagation()}>
          <button className="pp-btn-save" onClick={onDownload}>Save</button>
          {onRegenerate && <button className="pp-btn-ghost" onClick={onRegenerate}>Regen</button>}
        </div>
      </div>

      <div className="pp-gc-foot" style={{ opacity: hov ? 0 : 1 }}>
        <span className="pp-gc-style">{creation.style}</span>
      </div>
    </div>
  )
}

/* ══ LIST CARD ══════════════════════════════════════════════════════════════ */
function ListCard({ creation, onOpen, onDownload, onRegenerate }: {
  creation: { src: string; style: string; createdAt: string }
  onOpen: () => void; onDownload: () => void; onRegenerate?: () => void
}) {
  return (
    <div className="pp-lc" onClick={onOpen}>
      <div className="pp-lc-thumb">
        <img src={creation.src} alt="" />
      </div>
      <div className="pp-lc-meta">
        <div>
          <div className="pp-lc-style">{creation.style || "Untitled"}</div>
          <div className="pp-lc-date">{creation.createdAt}</div>
        </div>
        <div className="pp-lc-btns" onClick={e => e.stopPropagation()}>
          <button className="pp-btn-save" onClick={onDownload}>↓ Save</button>
          {onRegenerate && <button className="pp-btn-ghost" onClick={onRegenerate}>↺ Regen</button>}
        </div>
      </div>
    </div>
  )
}