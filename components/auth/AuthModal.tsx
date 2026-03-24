"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/authStore"

type Mode = "signin" | "signup" | "forgot"

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, authError, clearError } = useAuthStore()

  const [mode, setMode]         = useState<Mode>("signin")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [name, setName]         = useState("")
  const [busy, setBusy]         = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [info, setInfo]         = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      clearError()
      setEmail(""); setPassword(""); setName("")
      setShowPass(false); setBusy(false)
      setMode("signin"); setInfo(null)
    }
  }, [open, clearError])

  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [open, onClose])

  const handleGoogle = async () => {
    setBusy(true); setInfo(null)
    await signInWithGoogle()
    setBusy(false)
    if (!useAuthStore.getState().authError) onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setInfo(null)
    if (mode === "signin") {
      await signInWithEmail(email, password)
      setBusy(false)
      if (!useAuthStore.getState().authError) onClose()
      return
    }
    if (mode === "signup") {
      await signUpWithEmail(email, password, name)
      setBusy(false)
      if (!useAuthStore.getState().authError) onClose()
      return
    }
    if (mode === "forgot") {
      await resetPassword(email)
      setBusy(false)
      if (!useAuthStore.getState().authError) {
        setInfo("Password reset link sent. Check your inbox (and spam).")
      }
      return
    }
    setBusy(false)
  }

  const TITLES: Record<Mode, string> = {
    signin: "Welcome Back",
    signup: "Join Seyon",
    forgot: "Reset Password",
  }
  const SUBS: Record<Mode, string> = {
    signin: "Sign in to your creative studio",
    signup: "Start with 10 free credits",
    forgot: "We'll send a reset link to your email",
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

            /* ════════════════════════════════════════════════════════════
               CURSOR RESTORE
               The landing page sets body { cursor: none }.
               Everything inside the modal must restore the real cursor.
               We do this by forcing cursor:auto on the modal layers and
               then using semantic cursors on every interactive element.
            ════════════════════════════════════════════════════════════ */
            .am-bd,
            .am-ct,
            .am-card,
            .am-body,
            .am-card * {
              cursor: auto;
            }

            /* Interactive elements — explicit semantic cursors */
            .am-close,
            .am-tab,
            .am-google,
            .am-eye,
            .am-forgot,
            .am-submit,
            .am-link {
              cursor: pointer !important;
            }
            .am-input {
              cursor: text !important;
            }
            .am-submit:disabled,
            .am-google:disabled {
              cursor: not-allowed !important;
            }

            /* ── BACKDROP ── */
            .am-bd {
              position: fixed; inset: 0; z-index: 400;
              background: rgba(4,4,10,0.82);
              backdrop-filter: blur(24px) saturate(130%);
              -webkit-backdrop-filter: blur(24px) saturate(130%);
            }

            /* ── CENTERING WRAPPER ── */
            .am-ct {
              position: fixed; inset: 0; z-index: 410;
              display: flex; align-items: center; justify-content: center;
              padding: 20px;
            }

            /* ── CARD ── */
            .am-card {
              width: min(440px, 100%);
              position: relative;
              border-radius: 18px;
              background: rgba(9,9,20,0.98);
              border: 1px solid rgba(255,255,255,0.075);
              box-shadow:
                0 0 0 1px rgba(255,255,255,0.032) inset,
                0 64px 200px rgba(0,0,0,0.92),
                0 24px 64px rgba(0,0,0,0.64);
            }

            /* ── TOP PRISM LINE ── */
            .am-edge {
              height: 1px; width: 100%;
              border-radius: 18px 18px 0 0;
              background: linear-gradient(90deg,
                transparent 0%,
                rgba(100,160,255,0.35) 22%,
                rgba(232,255,0,0.42) 50%,
                rgba(200,130,255,0.35) 78%,
                transparent 100%);
            }

            /* ── DECORATIVE LAYERS — pointer-events:none so they never block clicks ── */
            .am-glow {
              position: absolute; top: -90px; left: 50%;
              transform: translateX(-50%);
              width: 380px; height: 220px;
              pointer-events: none; z-index: 0;
              background: radial-gradient(ellipse at 50% 0%,
                rgba(232,255,0,0.06) 0%, transparent 65%);
              border-radius: 50%;
            }
            .am-accent-line {
              position: absolute; left: 0; top: 18px; bottom: 18px;
              width: 2px; border-radius: 2px;
              pointer-events: none; z-index: 0;
              background: linear-gradient(180deg,
                transparent 0%, rgba(232,255,0,0.42) 38%,
                rgba(232,255,0,0.22) 72%, transparent 100%);
            }

            /* ── CLOSE BUTTON ── */
            .am-close {
              position: absolute; top: 16px; right: 16px;
              z-index: 20;
              width: 32px; height: 32px; border-radius: 9px;
              display: grid; place-items: center;
              background: rgba(255,255,255,0.04);
              border: 1px solid rgba(255,255,255,0.08);
              color: rgba(255,255,255,0.38);
              transition: background 0.2s, border-color 0.2s, color 0.2s,
                          transform 0.22s cubic-bezier(0.16,1,0.3,1);
            }
            .am-close:hover {
              background: rgba(255,255,255,0.08);
              border-color: rgba(255,255,255,0.16);
              color: rgba(255,255,255,0.82);
              transform: rotate(90deg) scale(1.08);
            }
            .am-close:active { transform: rotate(90deg) scale(0.94) }

            /* ── BODY ── */
            .am-body {
              position: relative; z-index: 1;
              padding: 28px 32px 30px;
            }

            /* ── BRAND ROW ── */
            .am-logo-row {
              display: flex; align-items: center; gap: 10px;
              margin-bottom: 26px;
            }
            .am-logo-chip {
              width: 30px; height: 30px; border-radius: 8px;
              border: 1px solid rgba(255,255,255,0.07);
              background: rgba(255,255,255,0.025);
              display: grid; place-items: center; flex-shrink: 0;
            }
            .am-logo-wordmark {
              font-family: 'Bebas Neue', sans-serif;
              font-size: 16px; letter-spacing: 0.28em;
              color: rgba(255,255,255,0.52); line-height: 1;
            }

            /* ── TITLE ── */
            .am-heading {
              font-family: 'Bebas Neue', sans-serif;
              font-size: 38px; letter-spacing: 0.08em;
              color: rgba(255,255,255,0.92); line-height: 1;
            }
            .am-sub {
              margin-top: 7px;
              font-family: 'DM Sans', sans-serif; font-weight: 300;
              font-size: 14px; line-height: 1.60;
              color: rgba(255,255,255,0.30);
            }

            /* ── ALERTS ── */
            .am-err {
              margin: 14px 0 0; padding: 11px 14px; border-radius: 9px;
              background: rgba(255,60,60,0.06);
              border: 1px solid rgba(255,80,80,0.16);
              color: rgba(255,130,130,0.90);
              font-family: 'JetBrains Mono', monospace;
              font-size: 10.5px; line-height: 1.55;
              display: flex; align-items: flex-start; gap: 8px;
            }
            .am-info {
              margin: 14px 0 0; padding: 11px 14px; border-radius: 9px;
              background: rgba(232,255,0,0.05);
              border: 1px solid rgba(232,255,0,0.14);
              color: rgba(232,255,0,0.78);
              font-family: 'JetBrains Mono', monospace;
              font-size: 10.5px; line-height: 1.55;
              display: flex; align-items: flex-start; gap: 8px;
            }

            /* ── MODE TABS ── */
            .am-tabs {
              display: flex; gap: 4px; margin-bottom: 22px;
              padding: 4px; border-radius: 10px;
              background: rgba(255,255,255,0.028);
              border: 1px solid rgba(255,255,255,0.06);
            }
            .am-tab {
              flex: 1; padding: 9px 10px; border-radius: 7px; border: none;
              font-family: 'JetBrains Mono', monospace;
              font-size: 9px; letter-spacing: 0.20em; text-transform: uppercase;
              transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
            }
            .am-tab-inactive { background: transparent; color: rgba(255,255,255,0.28) }
            .am-tab-inactive:hover { color: rgba(255,255,255,0.58) }
            .am-tab-active {
              background: rgba(255,255,255,0.075);
              color: rgba(255,255,255,0.82);
              box-shadow: 0 1px 6px rgba(0,0,0,0.28);
            }

            /* ── CREDITS BADGE ── */
            .am-credits {
              display: inline-flex; align-items: center; gap: 7px;
              padding: 6px 12px; border-radius: 999px;
              border: 1px solid rgba(232,255,0,0.16);
              background: rgba(232,255,0,0.05);
              font-family: 'JetBrains Mono', monospace;
              font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
              color: rgba(232,255,0,0.65); margin-bottom: 20px;
            }
            .am-credits-dot {
              width: 5px; height: 5px; border-radius: 50%;
              background: #E8FF00; box-shadow: 0 0 6px rgba(232,255,0,0.75);
              flex-shrink: 0;
            }

            /* ── GOOGLE BUTTON ── */
            .am-google {
              width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
              margin-top: 22px; padding: 13px 16px; border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.09);
              background: rgba(255,255,255,0.038);
              color: rgba(255,255,255,0.72);
              font-family: 'DM Sans', sans-serif; font-weight: 400; font-size: 14px;
              position: relative; overflow: hidden;
              transition: all 0.24s cubic-bezier(0.16,1,0.3,1);
            }
            .am-google::after {
              content: ""; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
              transition: left 0.52s ease;
              pointer-events: none;
            }
            .am-google:hover::after { left: 160% }
            .am-google:hover {
              background: rgba(255,255,255,0.065);
              border-color: rgba(255,255,255,0.14);
              color: rgba(255,255,255,0.92);
              transform: translateY(-1px);
              box-shadow: 0 8px 28px rgba(0,0,0,0.28);
            }
            .am-google:disabled { opacity: 0.38; pointer-events: none }

            /* ── DIVIDER ── */
            .am-divider {
              display: flex; align-items: center; gap: 14px; margin: 18px 0;
            }
            .am-line {
              flex: 1; height: 1px;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07));
            }
            .am-line:last-child {
              background: linear-gradient(270deg, transparent, rgba(255,255,255,0.07));
            }
            .am-or {
              font-family: 'JetBrains Mono', monospace;
              font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase;
              color: rgba(255,255,255,0.18);
            }

            /* ── FORM ── */
            .am-form { display: flex; flex-direction: column; gap: 10px }
            .am-field { display: flex; flex-direction: column; gap: 5px }
            .am-field-label {
              font-family: 'JetBrains Mono', monospace;
              font-size: 8.5px; letter-spacing: 0.22em; text-transform: uppercase;
              color: rgba(255,255,255,0.26); padding-left: 2px;
            }
            .am-input {
              width: 100%; padding: 12px 14px; border-radius: 9px;
              border: 1px solid rgba(255,255,255,0.07);
              background: rgba(255,255,255,0.025);
              color: rgba(255,255,255,0.88);
              font-family: 'DM Sans', sans-serif; font-weight: 400; font-size: 14px;
              outline: none;
              transition: border-color 0.22s, box-shadow 0.22s, background 0.22s;
            }
            .am-input::placeholder { color: rgba(255,255,255,0.17) }
            .am-input:focus {
              border-color: rgba(232,255,0,0.34);
              box-shadow: 0 0 0 3px rgba(232,255,0,0.07);
              background: rgba(255,255,255,0.038);
            }

            /* ── PASSWORD WRAPPER ── */
            .am-pw { position: relative }
            .am-eye {
              position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
              width: 30px; height: 26px; border-radius: 6px;
              display: grid; place-items: center;
              background: rgba(255,255,255,0.03);
              border: 1px solid rgba(255,255,255,0.06);
              color: rgba(255,255,255,0.30);
              transition: all 0.18s;
            }
            .am-eye:hover {
              background: rgba(255,255,255,0.07);
              border-color: rgba(255,255,255,0.13);
              color: rgba(255,255,255,0.72);
            }

            /* ── FORGOT ── */
            .am-row { display: flex; justify-content: flex-end; margin-top: 2px }
            .am-forgot {
              background: none; border: none; padding: 0;
              font-family: 'JetBrains Mono', monospace;
              font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
              color: rgba(255,255,255,0.28);
              transition: color 0.18s;
            }
            .am-forgot:hover { color: rgba(232,255,0,0.80) }

            /* ── SUBMIT ── */
            .am-submit {
              width: 100%; margin-top: 6px; padding: 14px 16px; border-radius: 10px;
              border: 1px solid rgba(232,255,0,0.50);
              background: #E8FF00;
              color: #05050D;
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px; font-weight: 700; letter-spacing: 0.26em; text-transform: uppercase;
              position: relative; overflow: hidden;
              transition: box-shadow 0.30s, filter 0.24s, transform 0.20s cubic-bezier(0.16,1,0.3,1);
              box-shadow: 0 8px 40px rgba(232,255,0,0.28), inset 0 1px 0 rgba(255,255,255,0.50);
            }
            .am-submit::before {
              content: ""; position: absolute; top: 0; left: -130%; width: 60%; height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.46), transparent);
              transition: left 0.60s ease; pointer-events: none;
            }
            .am-submit:not(:disabled):hover::before { left: 190% }
            .am-submit:not(:disabled):hover {
              box-shadow: 0 0 72px rgba(232,255,0,0.42), 0 12px 44px rgba(0,0,0,0.55);
              filter: brightness(1.06); transform: translateY(-1px);
            }
            .am-submit:disabled { opacity: 0.40; pointer-events: none }

            /* ── SPINNER ── */
            .am-spinner {
              width: 12px; height: 12px; border-radius: 50%;
              border: 1.5px solid rgba(5,5,13,0.18);
              border-top-color: #05050D;
              display: inline-block;
              animation: amSpin 0.7s linear infinite;
              vertical-align: middle; margin-right: 8px;
            }
            @keyframes amSpin { to { transform: rotate(360deg) } }

            /* ── SWITCH ── */
            .am-switch {
              text-align: center; margin-top: 20px;
              font-family: 'DM Sans', sans-serif; font-weight: 300;
              font-size: 13.5px; color: rgba(255,255,255,0.28);
            }
            .am-link {
              background: none; border: none; padding: 0;
              font-family: 'DM Sans', sans-serif; font-weight: 400; font-size: 13.5px;
              color: rgba(255,255,255,0.65); margin-left: 5px;
              transition: color 0.18s;
              text-decoration: underline; text-underline-offset: 3px;
              text-decoration-color: rgba(255,255,255,0.15);
            }
            .am-link:hover { color: #E8FF00; text-decoration-color: rgba(232,255,0,0.45) }
          `}</style>

          {/* ── BACKDROP ── */}
          <motion.div
            className="am-bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* ── MODAL WRAPPER ── */}
          <div className="am-ct">
            <motion.div
              className="am-card"
              initial={{ opacity: 0, scale: 0.94, y: 32, filter: "blur(14px)" }}
              animate={{ opacity: 1, scale: 1,    y: 0,  filter: "blur(0px)"  }}
              exit={{   opacity: 0, scale: 0.94, y: 20,  filter: "blur(14px)" }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              {/* Decorative layers — pointer-events:none */}
              <div className="am-edge" />
              <div className="am-glow" />
              <div className="am-accent-line" />

              {/* ── CLOSE ── */}
              <button
                className="am-close"
                onClick={onClose}
                onPointerDown={e => e.stopPropagation()}
                aria-label="Close modal"
                type="button"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>

              {/* ── BODY ── */}
              <div className="am-body">

                {/* Brand */}
                <div className="am-logo-row">
                  <div className="am-logo-chip">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="rgba(232,255,0,0.50)" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="3" fill="rgba(232,255,0,0.65)"/>
                    </svg>
                  </div>
                  <span className="am-logo-wordmark">SEYON</span>
                </div>

                {/* Tabs */}
                <AnimatePresence mode="wait">
                  {mode !== "forgot" && (
                    <motion.div className="am-tabs"
                      key="tabs"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.20 }}>
                      {(["signin", "signup"] as Mode[]).map(m => (
                        <button key={m}
                          type="button"
                          className={`am-tab ${mode === m ? "am-tab-active" : "am-tab-inactive"}`}
                          onClick={() => { setInfo(null); clearError(); setMode(m) }}>
                          {m === "signin" ? "Sign In" : "Sign Up"}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Heading */}
                <AnimatePresence mode="wait">
                  <motion.div key={mode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
                    <h2 className="am-heading">{TITLES[mode]}</h2>
                    <p className="am-sub">{SUBS[mode]}</p>
                    {mode === "signup" && (
                      <div style={{ marginTop: 14 }}>
                        <div className="am-credits">
                          <span className="am-credits-dot" />
                          10 free credits on signup
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {authError && (
                    <motion.div className="am-err"
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1, opacity: 0.7 }}>
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {authError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Info */}
                <AnimatePresence>
                  {info && (
                    <motion.div className="am-info"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      {info}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Google */}
                <AnimatePresence>
                  {mode !== "forgot" && (
                    <motion.div key="google-block"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.24, delay: 0.06 }}>
                      <button onClick={handleGoogle} disabled={busy} className="am-google" type="button">
                        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </button>
                      <div className="am-divider">
                        <div className="am-line"/>
                        <span className="am-or">or</span>
                        <div className="am-line"/>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <motion.form onSubmit={handleSubmit} className="am-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: 0.10 }}>

                  {/* Name */}
                  <AnimatePresence>
                    {mode === "signup" && (
                      <motion.div className="am-field"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}>
                        <label className="am-field-label">Full Name</label>
                        <input type="text" placeholder="Your name"
                          value={name} onChange={e => setName(e.target.value)}
                          required className="am-input" autoComplete="name"/>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <div className="am-field">
                    <label className="am-field-label">Email</label>
                    <input type="email" placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      required className="am-input" autoComplete="email"/>
                  </div>

                  {/* Password */}
                  <AnimatePresence>
                    {mode !== "forgot" && (
                      <motion.div className="am-field"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}>
                        <label className="am-field-label">Password</label>
                        <div className="am-pw">
                          <input
                            type={showPass ? "text" : "password"}
                            placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
                            value={password} onChange={e => setPassword(e.target.value)}
                            required minLength={6}
                            className="am-input" style={{ paddingRight: 48 }}
                            autoComplete={mode === "signin" ? "current-password" : "new-password"}/>
                          <button type="button" className="am-eye"
                            onClick={() => setShowPass(s => !s)}
                            aria-label="Toggle password visibility">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2">
                              {showPass ? (
                                <>
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                  <line x1="1" y1="1" x2="23" y2="23"/>
                                </>
                              ) : (
                                <>
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </>
                              )}
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Forgot */}
                  {mode === "signin" && (
                    <div className="am-row">
                      <button type="button" className="am-forgot"
                        onClick={() => { setMode("forgot"); setInfo(null); clearError() }}>
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Submit */}
                  <button type="submit" disabled={busy} className="am-submit">
                    {busy && <span className="am-spinner"/>}
                    {busy ? "Please wait…"
                      : mode === "signin" ? "Sign In"
                      : mode === "signup" ? "Create Account"
                      : "Send Reset Link"}
                  </button>
                </motion.form>

                {/* Switch */}
                <p className="am-switch">
                  {mode === "signin"  ? "Don't have an account?"
                    : mode === "signup" ? "Already have an account?"
                    : "Remember your password?"}
                  <button type="button" className="am-link"
                    onClick={() => { setInfo(null); clearError(); setMode(mode === "signin" ? "signup" : "signin") }}>
                    {mode === "signin" ? "Sign up free" : "Sign in"}
                  </button>
                </p>

                {mode === "forgot" && (
                  <p className="am-switch" style={{ marginTop: 10 }}>
                    <button type="button" className="am-link"
                      onClick={() => { setInfo(null); clearError(); setMode("signin") }}>
                      ← Back to sign in
                    </button>
                  </p>
                )}

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}