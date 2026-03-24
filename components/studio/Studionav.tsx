"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/authStore"
import CreditsModal from "@/components/auth/CreditsModal"
import ProfilePanel from "@/components/studio/Profilepanel"
import type { UserProfile } from "@/types"

export default function StudioNav({ profile }: { profile: UserProfile }) {
  const { logout, profile: liveProfile, refreshProfile } = useAuthStore()
  const router = useRouter()

  const [creditsOpen, setCreditsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [signingOut,  setSigningOut]  = useState(false)

  const p          = liveProfile ?? profile
  const isOrg      = p.isOrgMember ?? false
  const credits    = p.credits     ?? 0
  const name       = p.displayName ?? p.email?.split("@")[0] ?? "User"
  const initial    = name.charAt(0).toUpperCase()
  const isLow      = !isOrg && credits < 5
  const creditText = isOrg ? "∞" : String(credits)

  const didOpen = useRef(false)
  useEffect(() => {
    if (profileOpen && !didOpen.current) {
      didOpen.current = true
      refreshProfile().catch(() => {})
    }
    if (!profileOpen) didOpen.current = false
  }, [profileOpen, refreshProfile])

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try { await logout() } catch (_) {}
    router.push("/")
  }

  const creditState = isOrg ? "org" : isLow ? "low" : "normal"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

        /* ── SHELL — 3-col: [logo] [center text] [actions] ── */
        .sn {
          position: relative; z-index: 200;
          height: 62px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 0 20px;
          background: rgba(6,6,14,0.84);
          border-bottom: 1px solid rgba(255,255,255,0.058);
          backdrop-filter: saturate(180%) blur(52px);
          -webkit-backdrop-filter: saturate(180%) blur(52px);
        }

        /* ── LEFT — logo only ── */
        .sn-left {
          display: flex; align-items: center;
        }
        .sn-logomark {
          width: 46px; height: 46px; border-radius: 13px;
          background: rgba(255,255,255,0.038);
          border: 1px solid rgba(255,255,255,0.09);
          display: grid; place-items: center; flex-shrink: 0;
          overflow: hidden; position: relative;
          transition: border-color 0.30s, box-shadow 0.30s;
        }
        .sn-logomark:hover {
          border-color: rgba(232,255,0,0.26);
          box-shadow: 0 0 24px rgba(232,255,0,0.10), 0 0 8px rgba(232,255,0,0.06);
        }

        /* ── CENTER — text only, truly centered ── */
        .sn-center {
          display: flex; flex-direction: column;
          align-items: center; gap: 2px;
          line-height: 1;
        }

        /* SEYON gradient */
        .sn-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px; letter-spacing: 0.24em; line-height: 1;
          background: linear-gradient(
            100deg,
            #E8FF00  0%,
            #A78BFA 28%,
            #FF6B35 56%,
            #34D399 80%,
            #E8FF00 100%
          );
          background-size: 220% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: snFlow 7s ease-in-out infinite alternate;
        }
        @keyframes snFlow {
          0%   { background-position: 0% 50% }
          100% { background-position: 100% 50% }
        }

        /* Subtitle */
        .sn-subtitle {
          font-family: 'JetBrains Mono', monospace;
          font-size: 7px; letter-spacing: 0.30em; text-transform: uppercase;
          color: rgba(255,255,255,0.22); line-height: 1;
        }

        /* ── RIGHT — actions ── */
        .sn-right {
          display: flex; align-items: center; gap: 8px;
          justify-content: flex-end;
        }

        /* ── CREDIT PILL ── */
        .sn-credit-pill {
          height: 28px; padding: 0 11px; border-radius: 6px;
          display: inline-flex; align-items: center; gap: 6px;
          border: 1px solid; cursor: pointer; white-space: nowrap;
          font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 400;
          position: relative; overflow: hidden;
          transition: filter 0.20s, transform 0.18s cubic-bezier(0.16,1,0.3,1), box-shadow 0.20s;
        }
        .sn-credit-pill:hover:not([data-disabled="true"]) {
          filter: brightness(1.14); transform: translateY(-0.5px);
          box-shadow: 0 3px 14px rgba(0,0,0,0.25);
        }
        .sn-credit-pill[data-disabled="true"] { cursor: default; pointer-events: none }
        .sn-credit-pill[data-state="normal"] {
          border-color: rgba(255,255,255,0.08); background: rgba(255,255,255,0.035); color: rgba(255,255,255,0.50);
        }
        .sn-credit-pill[data-state="low"] {
          border-color: rgba(255,107,53,0.22); background: rgba(255,107,53,0.07); color: rgba(255,140,80,0.88);
        }
        .sn-credit-pill[data-state="org"] {
          border-color: rgba(167,139,250,0.22); background: rgba(167,139,250,0.07); color: rgba(196,181,253,0.88);
        }
        .sn-bolt { width: 10px; height: 10px; flex-shrink: 0; opacity: 0.70 }
        .sn-credit-pill[data-state="normal"] .sn-bolt { opacity: 0.35 }
        .sn-low-blink {
          width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0;
          background: rgba(255,107,53,0.9);
          animation: snBlink 1.6s ease-in-out infinite;
        }
        @keyframes snBlink { 0%,100%{opacity:1} 50%{opacity:0.15} }

        /* ── DIVIDER ── */
        .sn-vdivider { width: 1px; height: 18px; background: rgba(255,255,255,0.07); flex-shrink: 0 }

        /* ── USER CHIP ── */
        .sn-user {
          height: 28px; padding: 0 10px 0 5px; border-radius: 999px;
          display: flex; align-items: center; gap: 7px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03); cursor: pointer;
          transition: all 0.20s cubic-bezier(0.16,1,0.3,1);
        }
        .sn-user:hover {
          border-color: rgba(255,255,255,0.13); background: rgba(255,255,255,0.055);
          transform: translateY(-0.5px); box-shadow: 0 3px 14px rgba(0,0,0,0.24);
        }
        .sn-user.is-open { border-color: rgba(232,255,0,0.18); background: rgba(232,255,0,0.05) }
        .sn-user.is-open .sn-uname { color: rgba(255,255,255,0.80) }
        .sn-avatar {
          width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(140deg, rgba(232,255,0,0.22), rgba(255,255,255,0.04));
          border: 1px solid rgba(255,255,255,0.12);
          display: grid; place-items: center;
          font-family: 'Bebas Neue', sans-serif; font-size: 11px;
          color: rgba(255,255,255,0.90); letter-spacing: 0.02em;
        }
        .sn-uname {
          font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 400;
          color: rgba(255,255,255,0.48); white-space: nowrap; overflow: hidden;
          text-overflow: ellipsis; max-width: 110px; transition: color 0.18s;
        }
        .sn-user:hover .sn-uname { color: rgba(255,255,255,0.75) }
        .sn-caret {
          width: 8px; height: 8px; flex-shrink: 0; color: rgba(255,255,255,0.22);
          transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), color 0.18s;
        }
        .sn-user:hover .sn-caret { color: rgba(255,255,255,0.45) }
        .sn-user.is-open .sn-caret { transform: rotate(180deg); color: rgba(232,255,0,0.55) }

        /* ── SIGN OUT ── */
        .sn-signout {
          height: 28px; padding: 0 11px; border-radius: 6px;
          display: flex; align-items: center; gap: 5px;
          border: 1px solid rgba(255,255,255,0.06); background: transparent; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 400;
          color: rgba(255,255,255,0.28);
          transition: all 0.18s cubic-bezier(0.16,1,0.3,1); white-space: nowrap;
        }
        .sn-signout:hover:not(:disabled) {
          background: rgba(255,50,50,0.07); border-color: rgba(255,80,80,0.18); color: rgba(255,110,110,0.82);
        }
        .sn-signout:disabled { opacity: 0.35; cursor: not-allowed }
        .sn-spin {
          width: 10px; height: 10px; border-radius: 50%;
          border: 1.5px solid rgba(255,110,110,0.18); border-top-color: rgba(255,110,110,0.65);
          animation: snSpin 0.7s linear infinite; flex-shrink: 0;
        }
        @keyframes snSpin { to { transform: rotate(360deg) } }

        /* ── BACKDROP ── */
        .sn-backdrop {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(6px) saturate(80%);
          -webkit-backdrop-filter: blur(6px) saturate(80%);
        }

        /* ── PROFILE DRAWER ── */
        .sn-drawer {
          position: fixed; top: 62px; right: 0; bottom: 0;
          width: 360px; z-index: 310;
          display: flex; flex-direction: column; overflow: hidden;
          background: rgba(8,8,18,0.96);
          backdrop-filter: saturate(180%) blur(40px);
          -webkit-backdrop-filter: saturate(180%) blur(40px);
          border-left: 1px solid rgba(255,255,255,0.065);
          box-shadow: -1px 0 0 rgba(255,255,255,0.04), -40px 0 140px rgba(0,0,0,0.80);
        }
        .sn-d-prism {
          height: 1px; flex-shrink: 0;
          background: linear-gradient(90deg,
            transparent 0%, rgba(100,160,255,0.50) 20%,
            rgba(232,255,0,0.45) 50%, rgba(200,140,255,0.50) 80%, transparent 100%);
        }
        .sn-d-bar {
          height: 48px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 18px; border-bottom: 1px solid rgba(255,255,255,0.052);
        }
        .sn-d-label {
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.50);
        }
        .sn-d-x {
          width: 26px; height: 26px; border-radius: 999px;
          display: grid; place-items: center;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.38); cursor: pointer;
          transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        .sn-d-x:hover {
          background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.16);
          color: rgba(255,255,255,0.82); transform: rotate(90deg);
        }
        .sn-d-body { flex: 1; overflow: hidden }

        /* ── RESPONSIVE ── */
        @media (max-width: 680px) {
          .sn-subtitle { display: none }
          .sn-uname    { display: none }
          .sn-user     { padding: 0 5px }
          .sn-caret    { display: none }
          .sn-drawer   { width: 100vw; border-left: none }
        }
        @media (max-width: 480px) {
          .sn           { padding: 0 14px; height: 54px }
          .sn-logomark  { width: 38px; height: 38px; border-radius: 10px }
          .sn-signout   { display: none }
          .sn-name      { font-size: 18px }
          .sn-drawer    { top: 54px }
        }
      `}</style>

      {/* ══════════════════ NAV ══════════════════ */}
      <header className="sn">

        {/* LEFT — Logo only */}
        <div className="sn-left">
          <div className="sn-logomark">
            <Image src="/logo.png" alt="Seyon" width={32} height={32} priority
              style={{ objectFit: "contain", opacity: 0.92, position: "relative", zIndex: 1 }} />
          </div>
        </div>

        {/* CENTER — Text only */}
        <div className="sn-center">
          <span className="sn-name">SEYON</span>
          <span className="sn-subtitle">Creative Studio</span>
        </div>

        {/* RIGHT — Actions */}
        <div className="sn-right">

          <motion.button
            className="sn-credit-pill"
            data-state={creditState}
            data-disabled={String(isOrg)}
            onClick={() => !isOrg && setCreditsOpen(true)}
            title={isOrg ? "Org — unlimited" : isLow ? "Low credits — top up" : "Manage credits"}
            whileTap={{ scale: isOrg ? 1 : 0.95 }}
          >
            <svg className="sn-bolt" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            {creditText}
            {!isOrg && <span style={{ opacity:0.50, fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>cr</span>}
            {isLow && !isOrg && <span className="sn-low-blink" />}
          </motion.button>

          <div className="sn-vdivider" />

          <motion.button
            className={`sn-user${profileOpen ? " is-open" : ""}`}
            onClick={() => setProfileOpen(o => !o)}
            aria-label="Profile"
            whileTap={{ scale: 0.97 }}
          >
            <div className="sn-avatar">{initial}</div>
            <span className="sn-uname">{name}</span>
            <svg className="sn-caret" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </motion.button>

          <button className="sn-signout" onClick={handleSignOut} disabled={signingOut} aria-label="Sign out">
            {signingOut ? <><span className="sn-spin" /> Signing out</> : "Sign out"}
          </button>

        </div>
      </header>

      {/* ══════════════════ DRAWER ══════════════════ */}
      <AnimatePresence>
        {profileOpen && (
          <>
            <motion.div className="sn-backdrop"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration:0.22 }}
              onClick={() => setProfileOpen(false)}
            />
            <motion.aside className="sn-drawer"
              initial={{ x:"100%", opacity:0.6, filter:"blur(8px)" }}
              animate={{ x:0,      opacity:1,   filter:"blur(0px)" }}
              exit={{    x:"100%", opacity:0,   filter:"blur(8px)" }}
              transition={{ duration:0.32, ease:[0.16,1,0.3,1] }}
              role="complementary" aria-label="Profile panel"
            >
              <div className="sn-d-prism" />
              <div className="sn-d-bar">
                <span className="sn-d-label">My Profile</span>
                <button className="sn-d-x" onClick={() => setProfileOpen(false)} aria-label="Close">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div className="sn-d-body"><ProfilePanel profile={p} /></div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </>
  )
}