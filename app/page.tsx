"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion, useSpring } from "framer-motion"
import { useAuthStore } from "@/store/authStore"
import AuthModal from "@/components/auth/AuthModal"

// ─── DATA ─────────────────────────────────────────────────────────────────────
const PERSONAS = [
  { id: "01", name: "Poster",          tag: "Editorial",  accent: "#E8FF00" },
  { id: "02", name: "Thumbnail",       tag: "Cinematic",  accent: "#FF6B35" },
  { id: "03", name: "Profile or Logo", tag: "Identity",   accent: "#A78BFA" },
  { id: "04", name: "Custom",          tag: "Freeform",   accent: "#34D399" },
]

const STATS = [
  { value: "4",  label: "AI Personas"   },
  { value: "8×", label: "Max Slides"    },
  { value: "5",  label: "Aspect Ratios" },
  { value: "∞",  label: "Possibilities" },
]

// ─── MAGNETIC BUTTON ──────────────────────────────────────────────────────────
function MagBtn({ children, className, onClick, onMouseEnter, onMouseLeave, style }: any) {
  const ref = useRef<HTMLButtonElement>(null)
  const x   = useSpring(0, { stiffness: 200, damping: 20 })
  const y   = useSpring(0, { stiffness: 200, damping: 20 })
  const move  = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect()
    x.set((e.clientX - r.left - r.width  / 2) * 0.3)
    y.set((e.clientY - r.top  - r.height / 2) * 0.3)
  }
  const leave = (e: React.MouseEvent) => { x.set(0); y.set(0); onMouseLeave?.(e) }
  return (
    <motion.button ref={ref} style={{ x, y, ...style }}
      onMouseMove={move} onMouseLeave={leave} onMouseEnter={onMouseEnter}
      onClick={onClick} className={className}>{children}</motion.button>
  )
}

// ─── SPLIT TITLE ──────────────────────────────────────────────────────────────
function SplitTitle({ text, delay = 0, gradient }: { text: string; delay?: number; gradient?: string }) {
  return (
    <span style={{ display: "inline-flex" }}>
      {text.split("").map((ch, i) => (
        <motion.span key={i}
          initial={{ opacity: 0, y: 110, skewY: 9 }}
          animate={{ opacity: 1, y: 0, skewY: 0 }}
          transition={{ duration: 1.0, delay: delay + i * 0.042, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "inline-block", lineHeight: "inherit",
            background: gradient ?? "linear-gradient(165deg,#FFFFFF 30%,rgba(255,255,255,0.30) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { profile, loading, init } = useAuthStore()
  const router  = useRouter()
  const [authOpen, setAuthOpen] = useState(false)
  const [active, setActive]     = useState(0)
  const [scanDone, setScanDone] = useState(false)
  const [cur, setCur]           = useState({ x: -300, y: -300 })
  const [curBig, setCurBig]     = useState(false)
  const [hovered, setHovered]   = useState<number | null>(null)

  useEffect(() => { const u = init(); return u }, [init])
  useEffect(() => { if (profile) router.replace("/studio") }, [profile, router])
  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % PERSONAS.length), 3500)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    const t = setTimeout(() => setScanDone(true), 2600)
    return () => clearTimeout(t)
  }, [])

  // ── Window-level mouse tracking — works through any overlay or modal ──
  useEffect(() => {
    const onMove = (e: MouseEvent) => setCur({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  // ── body cursor: none on landing, real cursor when modal open or on unmount ──
  useEffect(() => {
    document.body.style.cursor = authOpen ? "" : "none"
  }, [authOpen])

  // Restore real cursor when page unmounts (navigation to /studio)
  useEffect(() => {
    return () => { document.body.style.cursor = "" }
  }, [])

  const enter = () => setCurBig(true)
  const leave = () => setCurBig(false)

  if (loading) return (
    <div style={{ height:"100vh", background:"#05050D", display:"grid", placeItems:"center" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
        <motion.div
          animate={{ scaleY:[0.3,1,0.3], opacity:[0.2,1,0.2] }}
          transition={{ duration:1.6, repeat:Infinity, ease:"easeInOut" }}
          style={{ width:1, height:60, background:"linear-gradient(180deg,transparent,#E8FF00,transparent)" }}
        />
        <span style={{
          fontFamily:"'JetBrains Mono',monospace", fontSize:11,
          letterSpacing:"0.36em", textTransform:"uppercase",
          color:"rgba(255,255,255,0.28)", fontWeight:600,
        }}>Initializing</span>
      </div>
    </div>
  )

  const p = PERSONAS[active]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');

        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0 }
        html { color-scheme:dark; -webkit-font-smoothing:antialiased }
        body { background:#05050D; color:#EDE9DF; overflow-x:hidden }
        ::selection { background:#E8FF00; color:#05050D }
        ::-webkit-scrollbar { width:2px }
        ::-webkit-scrollbar-thumb { background:rgba(232,255,0,0.28); border-radius:99px }

        /* ══════════════════════════════════════════════════════════════
           INTRO CURTAIN
        ══════════════════════════════════════════════════════════════ */
        .intro-curtain {
          position:fixed; inset:0; z-index:600;
          display:flex; align-items:center; justify-content:center; flex-direction:column;
          gap:30px; background:#05050D;
          animation:curtainLift 2.6s cubic-bezier(0.77,0,0.18,1) 0.4s forwards;
        }
        @keyframes curtainLift {
          0%,60% { clip-path:inset(0 0 0 0); opacity:1 }
          100%   { clip-path:inset(0 0 100% 0); opacity:0; pointer-events:none }
        }
        .intro-logotype {
          font-family:'Bebas Neue',sans-serif;
          font-size:clamp(90px,19vw,240px);
          letter-spacing:0.20em; line-height:1;
          color:transparent; -webkit-text-stroke:1px rgba(232,255,0,0.38);
          animation:logoReveal 2.6s ease forwards 0.4s;
        }
        @keyframes logoReveal {
          0%   { color:transparent; -webkit-text-stroke-color:rgba(232,255,0,0.12); letter-spacing:0.38em }
          18%  { color:#E8FF00; -webkit-text-stroke-color:#E8FF00;
                 text-shadow:0 0 130px rgba(232,255,0,0.60),0 0 320px rgba(232,255,0,0.14);
                 letter-spacing:0.20em }
          72%  { color:#E8FF00; letter-spacing:0.20em }
          100% { color:transparent; -webkit-text-stroke-color:rgba(232,255,0,0.02) }
        }
        .intro-scan {
          width:clamp(150px,24vw,300px); height:1px;
          background:linear-gradient(90deg,transparent,#E8FF00,transparent);
          animation:scanPulse 1.9s ease-in-out infinite;
        }
        @keyframes scanPulse { 0%,100%{opacity:0.15;transform:scaleX(0.18)} 50%{opacity:1;transform:scaleX(1)} }
        .intro-sub {
          font-family:'JetBrains Mono',monospace; font-weight:600;
          font-size:11px; letter-spacing:0.44em; text-transform:uppercase;
          color:rgba(232,255,0,0.32); opacity:0;
          animation:subFade 2.6s ease forwards 0.4s;
        }
        @keyframes subFade { 0%{opacity:0} 22%{opacity:1} 78%{opacity:1} 100%{opacity:0} }

        /* ══════════════════════════════════════════════════════════════
           CURSOR
        ══════════════════════════════════════════════════════════════ */
        .cursor-dot, .cursor-ring {
          position:fixed; z-index:9999; pointer-events:none;
          border-radius:50%; transform:translate(-50%,-50%);
        }

        /* ══════════════════════════════════════════════════════════════
           ATMOSPHERIC BG
        ══════════════════════════════════════════════════════════════ */
        /* Film grain — ultra subtle */
        .noise-layer {
          position:fixed; inset:0; z-index:0; pointer-events:none; opacity:0.016;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          animation:noiseDrift 0.14s steps(1) infinite;
        }
        @keyframes noiseDrift {
          0%{transform:translate(0,0)} 25%{transform:translate(-3%,2%)}
          50%{transform:translate(2%,-3%)} 75%{transform:translate(-1%,3%)}
        }

        /* Fine perspective grid */
        .grid-layer {
          position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image:
            linear-gradient(rgba(255,255,255,0.009) 1px, transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,0.009) 1px, transparent 1px);
          background-size:88px 88px;
          mask-image:radial-gradient(ellipse 78% 68% at 50% 44%,#000 8%,transparent 100%);
          animation:gridBreath 18s ease-in-out infinite;
        }
        @keyframes gridBreath { 0%,100%{opacity:0.80} 50%{opacity:0.12} }

        /* Deep space orbs */
        .orb {
          position:fixed; border-radius:50%; pointer-events:none;
          filter:blur(140px); z-index:0;
          animation:orbFloat 22s ease-in-out infinite;
        }
        @keyframes orbFloat {
          0%,100%{transform:translate(0,0)scale(1)}
          33%{transform:translate(26px,-38px)scale(1.08)}
          66%{transform:translate(-20px,24px)scale(0.92)}
        }

        /* Light streaks / meteor effect */
        .streak {
          position:fixed; pointer-events:none; z-index:0;
          background:linear-gradient(to bottom,transparent,rgba(232,255,0,0.055),transparent);
          animation:streakFall linear infinite;
        }
        @keyframes streakFall {
          from{transform:translateY(-120%)} to{transform:translateY(220vh)}
        }

        /* ══════════════════════════════════════════════════════════════
           NAV
        ══════════════════════════════════════════════════════════════ */
        .nav {
          position:fixed; top:0; left:0; right:0; z-index:200;
          height:70px;
          display:flex; align-items:center; justify-content:space-between;
          padding:0 clamp(28px,5vw,76px);
          background:rgba(5,5,13,0.38);
          border-bottom:1px solid rgba(255,255,255,0.026);
          backdrop-filter:blur(44px) saturate(160%);
          -webkit-backdrop-filter:blur(44px) saturate(160%);
        }
        /* Prismatic top line */
        .nav::before {
          content:""; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,
            transparent 0%,
            rgba(100,160,255,0.30) 22%,
            rgba(232,255,0,0.38) 50%,
            rgba(200,130,255,0.30) 78%,
            transparent 100%);
          pointer-events:none;
        }

        .nav-brand { display:flex; align-items:center; gap:14px }
        .nav-logobox {
          width:42px; height:42px; border-radius:11px;
          border:1px solid rgba(255,255,255,0.08);
          background:rgba(255,255,255,0.030);
          display:grid; place-items:center; flex-shrink:0;
          position:relative; overflow:hidden;
          transition:border-color 0.32s, box-shadow 0.32s;
        }
        /* Spinning conic border on hover */
        .nav-logobox::after {
          content:""; position:absolute; inset:-2px; border-radius:13px;
          background:conic-gradient(from 0deg,transparent 62%,rgba(232,255,0,0.45) 100%);
          opacity:0; animation:spinRing 2.8s linear infinite; transition:opacity 0.28s;
        }
        .nav-logobox:hover { border-color:rgba(232,255,0,0.22) }
        .nav-logobox:hover::after { opacity:1 }
        @keyframes spinRing { to{transform:rotate(360deg)} }

        .nav-wordmark { display:flex; flex-direction:column; gap:2px }
        .nav-name {
          font-family:'Bebas Neue',sans-serif;
          font-size:28px; letter-spacing:0.28em; line-height:1;
          color:rgba(255,255,255,0.92);
        }
        .nav-caption {
          font-family:'JetBrains Mono',monospace; font-weight:600;
          font-size:10px; letter-spacing:0.20em; text-transform:uppercase;
          color:rgba(255,255,255,0.24);
        }

        .nav-action {
          display:inline-flex; align-items:center; gap:10px;
          padding:12px 28px; border-radius:8px;
          border:1px solid rgba(255,255,255,0.09);
          background:rgba(255,255,255,0.042);
          font-family:'JetBrains Mono',monospace; font-weight:700;
          font-size:11px; letter-spacing:0.22em; text-transform:uppercase;
          color:rgba(255,255,255,0.55);
          cursor:pointer; transition:all 0.30s cubic-bezier(0.16,1,0.3,1);
        }
        .nav-action:hover {
          border-color:rgba(232,255,0,0.32);
          background:rgba(232,255,0,0.08);
          color:rgba(255,255,255,0.92);
          box-shadow:0 0 44px rgba(232,255,0,0.10), inset 0 0 28px rgba(232,255,0,0.04);
          transform:translateY(-1px);
        }
        .live-dot {
          width:7px; height:7px; border-radius:50%;
          background:#4ADE80; box-shadow:0 0 10px rgba(74,222,128,0.75);
          animation:livePulse 2.6s ease-in-out infinite; flex-shrink:0;
        }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.28;transform:scale(0.62)} }

        /* ══════════════════════════════════════════════════════════════
           HERO STAGE
        ══════════════════════════════════════════════════════════════ */
        .stage {
          min-height:100vh;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:130px clamp(28px,7vw,120px) 108px;
          position:relative; text-align:center;
        }

        /* Persona giant watermark */
        .wm-wrap {
          position:absolute; inset:0; overflow:hidden;
          display:flex; align-items:center; justify-content:center;
          pointer-events:none; z-index:0;
        }
        .wm-text {
          font-family:'Bebas Neue',sans-serif;
          font-size:clamp(128px,30vw,400px);
          letter-spacing:0.09em; text-transform:uppercase; line-height:1;
          user-select:none; transform:translateY(13%);
        }

        /* ── PILL BADGE ── */
        .pill {
          display:inline-flex; align-items:center; gap:11px;
          padding:9px 20px; border-radius:999px;
          border:1px solid rgba(255,255,255,0.072);
          background:rgba(255,255,255,0.028);
          backdrop-filter:blur(18px);
        }
        .pill-dot {
          width:6px; height:6px; border-radius:50%; flex-shrink:0;
          background:#E8FF00; box-shadow:0 0 10px rgba(232,255,0,0.85);
          animation:livePulse 2.4s ease-in-out infinite;
        }
        .pill-text {
          font-family:'JetBrains Mono',monospace; font-weight:600;
          font-size:11px; letter-spacing:0.26em; text-transform:uppercase;
          color:rgba(255,255,255,0.38);
        }
        .pill-sep { width:1px; height:12px; background:rgba(255,255,255,0.12); flex-shrink:0 }

        /* ── EYEBROW ── */
        .eyebrow {
          font-family:'JetBrains Mono',monospace; font-weight:700;
          font-size:12px; letter-spacing:0.44em; text-transform:uppercase;
          color:rgba(232,255,0,0.56);
          display:flex; align-items:center; gap:14px;
        }
        .eyebrow::before,.eyebrow::after {
          content:""; flex:1; max-width:44px; height:1px;
          background:linear-gradient(90deg,transparent,rgba(232,255,0,0.38));
        }
        .eyebrow::after { background:linear-gradient(270deg,transparent,rgba(232,255,0,0.38)) }

        /* ── HEADLINE ── */
        .headline {
          font-family:'Bebas Neue',sans-serif;
          font-size:clamp(96px,17vw,220px);
          line-height:0.84; letter-spacing:0.01em;
          perspective:800px; position:relative;
        }
        .hl-line { overflow:hidden; padding-bottom:0.07em; display:block }

        .hl-accent {
          font-family:'Instrument Serif',serif; font-style:italic;
          font-size:0.60em; letter-spacing:0.02em;
          background:linear-gradient(135deg,rgba(232,255,0,0.95) 0%,rgba(232,255,0,0.48) 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          display:block; margin-top:-0.07em;
        }

        /* ── DESCRIPTOR ── */
        .desc {
          font-family:'DM Sans',sans-serif; font-weight:500;
          font-size:clamp(15px,1.55vw,18px);
          line-height:1.80; color:rgba(255,255,255,0.40);
          max-width:440px; letter-spacing:0.010em;
        }

        /* ── CTA PRIMARY ── */
        .cta-primary {
          position:relative; overflow:hidden;
          display:inline-flex; align-items:center; gap:14px;
          padding:18px 54px; border-radius:8px;
          background:#E8FF00;
          border:1px solid rgba(232,255,0,0.60);
          color:#05050D;
          font-family:'JetBrains Mono',monospace; font-weight:700;
          font-size:12px; letter-spacing:0.26em; text-transform:uppercase;
          cursor:pointer; white-space:nowrap;
          transition:box-shadow 0.35s, filter 0.28s, transform 0.22s cubic-bezier(0.16,1,0.3,1);
          box-shadow:0 8px 52px rgba(232,255,0,0.30), inset 0 1px 0 rgba(255,255,255,0.50);
        }
        .cta-primary::before {
          content:""; position:absolute;
          top:0; left:-140%; width:65%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.52),transparent);
          transition:left 0.65s ease;
        }
        .cta-primary:hover::before { left:200% }
        .cta-primary:hover {
          box-shadow:0 0 90px rgba(232,255,0,0.45), 0 16px 64px rgba(0,0,0,0.65);
          filter:brightness(1.06); transform:translateY(-2px);
        }
        .arrow-chip {
          width:22px; height:22px; border-radius:5px;
          background:rgba(0,0,0,0.13);
          display:grid; place-items:center; flex-shrink:0;
          transition:transform 0.28s cubic-bezier(0.16,1,0.3,1);
        }
        .cta-primary:hover .arrow-chip { transform:translate(4px,-3px) rotate(-5deg) }

        /* ── RULE ── */
        .thin-rule {
          height:1px; width:100%; max-width:650px;
          background:linear-gradient(90deg,
            transparent 0%, rgba(255,255,255,0.046) 20%,
            rgba(255,255,255,0.075) 50%, rgba(255,255,255,0.046) 80%, transparent 100%);
        }

        /* ── STATS PANEL ── */
        .stats-panel {
          display:flex; align-items:stretch; width:100%; max-width:650px;
          border:1px solid rgba(255,255,255,0.046);
          border-radius:12px;
          background:rgba(255,255,255,0.009);
          backdrop-filter:blur(26px);
          overflow:hidden; position:relative;
        }
        .stats-panel::after {
          content:""; position:absolute; inset:0; pointer-events:none;
          background:linear-gradient(90deg,transparent 0%,rgba(232,255,0,0.013) 50%,transparent 100%);
          animation:sheen 7s ease-in-out infinite;
        }
        @keyframes sheen { 0%,100%{transform:translateX(-130%)} 50%{transform:translateX(130%)} }

        .stat-col {
          flex:1; text-align:center;
          padding:26px 12px 22px;
          border-right:1px solid rgba(255,255,255,0.046);
          position:relative; overflow:hidden;
        }
        .stat-col:last-child { border-right:none }
        .stat-col::before {
          content:""; position:absolute; top:0; left:50%; transform:translateX(-50%);
          width:1px; height:0; background:#E8FF00; opacity:0;
          transition:height 0.45s cubic-bezier(0.16,1,0.3,1), opacity 0.30s;
        }
        .stat-col:hover::before { height:100%; opacity:0.20 }

        .s-val {
          font-family:'Bebas Neue',sans-serif;
          font-size:clamp(36px,3.8vw,50px);
          line-height:1; letter-spacing:0.06em;
          background:linear-gradient(165deg,rgba(255,255,255,0.92) 0%,rgba(255,255,255,0.26) 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .s-lbl {
          font-family:'JetBrains Mono',monospace; font-weight:600;
          font-size:10px; letter-spacing:0.24em; text-transform:uppercase;
          color:rgba(255,255,255,0.22); margin-top:6px;
        }

        /* ── PERSONA GRID ── */
        .persona-grid {
          display:grid; grid-template-columns:repeat(4,1fr); gap:8px;
          width:100%; max-width:650px;
        }
        .p-card {
          position:relative; overflow:hidden;
          display:flex; align-items:center; gap:11px;
          padding:15px 14px; border-radius:10px;
          border:1px solid rgba(255,255,255,0.050);
          background:rgba(255,255,255,0.018);
          cursor:pointer;
          transition:all 0.40s cubic-bezier(0.16,1,0.3,1);
        }
        .p-card::before {
          content:""; position:absolute; inset:0;
          background:radial-gradient(ellipse at 8% 50%, var(--acc) 0%, transparent 70%);
          opacity:0; transition:opacity 0.40s;
        }
        .p-card.active::before { opacity:0.09 }
        /* accent glow top edge */
        .p-card::after {
          content:""; position:absolute; top:0; left:0; right:0; height:1px;
          background:var(--acc); opacity:0; transition:opacity 0.35s;
        }
        .p-card.active::after { opacity:0.50 }
        .p-card:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,0.38) }

        .p-stripe {
          position:absolute; left:0; top:14%; bottom:14%;
          width:2px; border-radius:0 2px 2px 0;
          transition:all 0.40s cubic-bezier(0.16,1,0.3,1);
        }
        .p-name-text {
          font-family:'DM Sans',sans-serif; font-weight:600;
          font-size:13px; letter-spacing:0.01em;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
          transition:color 0.28s; line-height:1.2;
        }
        .p-tag-text {
          font-family:'JetBrains Mono',monospace; font-weight:600;
          font-size:9.5px; letter-spacing:0.18em; text-transform:uppercase;
          margin-top:3px; transition:color 0.28s;
        }

        /* ── FOOTER STRIP ── */
        .footer-strip {
          position:fixed; bottom:0; left:0; right:0; z-index:100;
          height:40px;
          display:flex; align-items:center;
          border-top:1px solid rgba(255,255,255,0.026);
          background:rgba(5,5,13,0.48);
          backdrop-filter:blur(26px);
          padding:0 clamp(28px,5vw,76px);
        }
        .footer-left {
          display:flex; align-items:center; gap:12px;
          font-family:'JetBrains Mono',monospace; font-weight:600;
          font-size:10px; letter-spacing:0.24em; text-transform:uppercase;
          color:rgba(255,255,255,0.22);
        }
        .footer-right {
          margin-left:auto;
          display:flex; align-items:center; gap:12px;
          font-family:'JetBrains Mono',monospace; font-weight:600;
          font-size:10px; letter-spacing:0.24em; text-transform:uppercase;
          color:rgba(255,255,255,0.22);
        }
        .fs-dot {
          width:5px; height:5px; border-radius:50%; flex-shrink:0;
          background:#4ADE80; box-shadow:0 0 8px rgba(74,222,128,0.65);
          animation:livePulse 3s ease-in-out infinite;
        }
        .fs-divider { width:1px; height:13px; background:rgba(255,255,255,0.08); flex-shrink:0 }

        /* ── SIDE ANNOTATIONS — static, no animation ── */
        .side-note {
          position:fixed; z-index:50; pointer-events:none;
          font-family:'JetBrains Mono',monospace; font-weight:600;
          font-size:9px; letter-spacing:0.34em; text-transform:uppercase;
          color:rgba(255,255,255,0.12);
          writing-mode:vertical-rl;
        }

        /* ── ENTRY ANIMATIONS ── */
        @keyframes emergeUp {
          from { opacity:0; transform:translateY(30px) }
          to   { opacity:1; transform:translateY(0) }
        }
        .u0 { animation:emergeUp 0.75s cubic-bezier(0.16,1,0.3,1) 0.1s  both }
        .u1 { animation:emergeUp 0.75s cubic-bezier(0.16,1,0.3,1) 1.9s  both }
        .u2 { animation:emergeUp 0.75s cubic-bezier(0.16,1,0.3,1) 2.05s both }
        .u3 { animation:emergeUp 0.75s cubic-bezier(0.16,1,0.3,1) 2.18s both }
        .u4 { animation:emergeUp 0.75s cubic-bezier(0.16,1,0.3,1) 2.30s both }
        .u5 { animation:emergeUp 0.75s cubic-bezier(0.16,1,0.3,1) 2.42s both }
        .u6 { animation:emergeUp 0.75s cubic-bezier(0.16,1,0.3,1) 2.54s both }

        /* ── RESPONSIVE ── */
        @media (max-width:740px) {
          .persona-grid { grid-template-columns:1fr 1fr }
          .stats-panel  { flex-wrap:wrap }
          .stat-col     { min-width:50%; border-bottom:1px solid rgba(255,255,255,0.04) }
          .side-note    { display:none }
          .footer-strip { display:none }
          .cta-row      { flex-direction:column; align-items:stretch }
          .cta-primary  { justify-content:center }
        }
      `}</style>

      {/* ─── INTRO CURTAIN ─── */}
      {!scanDone && (
        <div className="intro-curtain">
          <div className="intro-logotype">SEYON</div>
          <div className="intro-scan" />
          <div className="intro-sub">Creative Operating System · Initializing</div>
        </div>
      )}

      {/* ─── CURSORS — fade out when modal open so real cursor works inside AuthModal ─── */}
      <div className="cursor-dot" style={{
        left:cur.x, top:cur.y, width:5, height:5,
        background:"#E8FF00", boxShadow:"0 0 14px rgba(232,255,0,1)",
        opacity: authOpen ? 0 : 1, transition: "opacity 0.15s",
      }} />
      <div className="cursor-ring" style={{
        left:cur.x, top:cur.y,
        width:curBig ? 52 : 30, height:curBig ? 52 : 30,
        border:`1.5px solid ${curBig ? "rgba(232,255,0,0.55)" : "rgba(232,255,0,0.20)"}`,
        transition:"width 0.18s, height 0.18s, border-color 0.18s, opacity 0.15s",
        boxShadow:curBig ? "0 0 22px rgba(232,255,0,0.07)" : "none",
        opacity: authOpen ? 0 : 1,
      }} />

      {/* ─── AMBIENT BACKGROUND ─── */}
      <motion.div
        style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}
        animate={{
          background:
            `radial-gradient(1000px 800px at 50% 14%, rgba(65,115,255,0.038) 0%, transparent 56%),
             radial-gradient(680px 580px at 85% 80%, rgba(145,75,255,0.030) 0%, transparent 55%),
             radial-gradient(520px 460px at 10% 82%, ${p.accent}0A 0%, transparent 52%),
             #05050D`
        }}
        transition={{ duration:2.2, ease:"easeInOut" }}
      />

      {/* Deep space orbs */}
      <div className="orb" style={{ width:640, height:640, top:"-13%", left:"24%", background:"rgba(38,75,255,0.018)", animationDelay:"0s" }} />
      <div className="orb" style={{ width:430, height:430, bottom:"5%",  right:"5%", background:"rgba(125,45,255,0.014)", animationDelay:"-7s" }} />
      <motion.div className="orb"
        animate={{ background:`${p.accent}09` }} transition={{ duration:2.2 }}
        style={{ width:370, height:370, bottom:"21%", left:"3%", animationDelay:"-12s" }}
      />

      {/* Meteor streaks — purely decorative, no blink */}
      {[{ l:14, h:140, d:0   },
        { l:31, h:220, d:2.1 },
        { l:53, h:170, d:4.4 },
        { l:68, h:260, d:6.8 },
        { l:84, h:190, d:9.0 }].map((s, i) => (
        <div key={i} className="streak" style={{
          left:`${s.l}%`, width:"1px", height:`${s.h}px`,
          animationDuration:`${11 + i * 2.2}s`, animationDelay:`${s.d}s`,
        }} />
      ))}

      <div className="grid-layer" />
      <div className="noise-layer" />

      {/* Side annotations — static text only, no blinking */}
      <div className="side-note" style={{ left:14, top:"50%", transform:"translateY(-50%) rotate(180deg)" }}>
        Seyon · AI Image Generation Studio
      </div>
      <div className="side-note" style={{ right:14, top:"50%", transform:"translateY(-50%)" }}>
        Production Ready · 2025
      </div>

      {/* ─── MAIN SHELL ─── */}
      <div
        style={{ minHeight:"100vh", position:"relative", display:"flex", flexDirection:"column", zIndex:1 }}>

        {/* ════ NAV ════ */}
        <nav className="nav u0">
          <div className="nav-brand">
            <div className="nav-logobox">
              <Image src="/logo.png" alt="Seyon" width={28} height={28} priority
                style={{ objectFit:"contain", opacity:0.88, position:"relative", zIndex:1 }} />
            </div>
            <div className="nav-wordmark">
              <div className="nav-name">SEYON</div>
              <div className="nav-caption">Creative OS · Studio</div>
            </div>
          </div>

          <MagBtn className="nav-action" onClick={() => setAuthOpen(true)}
            onMouseEnter={enter} onMouseLeave={leave}>
            <span className="live-dot" />
            Enter Studio
          </MagBtn>
        </nav>

        {/* ════ HERO ════ */}
        <section className="stage">

          {/* Persona watermark */}
          <div className="wm-wrap">
            <AnimatePresence mode="wait">
              <motion.div key={active}
                initial={{ opacity:0, scale:1.08, filter:"blur(30px)" }}
                animate={{ opacity:1, scale:1,    filter:"blur(0px)"  }}
                exit={{   opacity:0, scale:0.93,  filter:"blur(30px)" }}
                transition={{ duration:0.95, ease:[0.16,1,0.3,1] }}
                className="wm-text"
                style={{ color:"transparent", WebkitTextStroke:`1px ${p.accent}0D` }}>
                {p.name.split(" ")[0]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Content */}
          <div style={{
            position:"relative", zIndex:1,
            display:"flex", flexDirection:"column", alignItems:"center",
            width:"100%", gap:0,
          }}>

            {/* Badge */}
            <motion.div className="u1" style={{ marginBottom:34 }}>
              <div className="pill">
                <span className="pill-dot" />
                <span className="pill-text">Invite-only beta</span>
                <span className="pill-sep" />
                <span className="pill-text">Production ready</span>
              </div>
            </motion.div>

            {/* Eyebrow */}
            <motion.div className="u1 eyebrow" style={{ marginBottom:22 }}>
              AI Creative Studio
            </motion.div>

            {/* Headline */}
            <div className="headline u2" style={{ marginBottom:16 }}>
              <span className="hl-line">
                <SplitTitle text="SEYON" delay={1.90} />
              </span>
              <span className="hl-line">
                <SplitTitle text="ARTIST" delay={2.04} />
              </span>
            </div>

            {/* Accent */}
            <motion.div
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.85, delay:2.55, ease:[0.16,1,0.3,1] }}
              className="hl-accent"
              style={{ marginBottom:38 }}>
              for the ones who create.
            </motion.div>

            {/* Descriptor */}
            <motion.p className="desc u3" style={{ marginBottom:50 }}>
              A premium AI creative studio built for production-ready visuals.
              Four expert personas, multiple aspect ratios, single frames or full carousels — fast.
            </motion.p>

            {/* CTA */}
            <div className="cta-row u4"
              style={{ display:"flex", alignItems:"center", gap:14, marginBottom:68 }}>
              <MagBtn className="cta-primary" onClick={() => setAuthOpen(true)}
                onMouseEnter={enter} onMouseLeave={leave}>
                Get Access
                <div className="arrow-chip">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </div>
              </MagBtn>
            </div>

            {/* Rule */}
            <div className="thin-rule u5" style={{ marginBottom:30 }} />

            {/* Stats */}
            <div className="stats-panel u5" style={{ marginBottom:22 }}>
              {STATS.map(s => (
                <div key={s.label} className="stat-col"
                  onMouseEnter={enter} onMouseLeave={leave}>
                  <div className="s-val">{s.value}</div>
                  <div className="s-lbl">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Persona grid */}
            <div className="persona-grid u6">
              {PERSONAS.map((px, i) => {
                const isActive = active === i
                return (
                  <div key={px.id}
                    className={`p-card${isActive ? " active" : ""}`}
                    style={{
                      "--acc": px.accent,
                      borderColor: isActive ? `${px.accent}26` : "rgba(255,255,255,0.050)",
                      background:  isActive ? `${px.accent}08` : "rgba(255,255,255,0.018)",
                    } as React.CSSProperties}
                    onClick={() => setActive(i)}
                    onMouseEnter={() => { setHovered(i); enter() }}
                    onMouseLeave={() => { setHovered(null); leave() }}>

                    <div className="p-stripe" style={{
                      background: isActive ? px.accent : "transparent",
                      boxShadow:  isActive ? `0 0 12px ${px.accent}55` : "none",
                    }} />

                    <motion.div
                      animate={{
                        width:      isActive ? 7 : 5,
                        height:     isActive ? 7 : 5,
                        background: isActive ? px.accent : "rgba(255,255,255,0.14)",
                        opacity:    isActive ? 1 : 0.35,
                        boxShadow:  isActive ? `0 0 11px ${px.accent}58` : "none",
                      }}
                      transition={{ duration:0.35 }}
                      style={{ borderRadius:"50%", flexShrink:0 }}
                    />

                    <div style={{ minWidth:0, flex:1 }}>
                      <div className="p-name-text"
                        style={{ color: isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.40)" }}>
                        {px.name}
                      </div>
                      <div className="p-tag-text"
                        style={{ color: isActive ? px.accent : "rgba(255,255,255,0.22)" }}>
                        {px.tag}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </section>

        {/* ════ FOOTER ════ */}
        <div className="footer-strip u0">
          <div className="footer-left">
            <span className="fs-dot" />
            All systems operational
            <span className="fs-divider" />
            Invite-only Beta
          </div>
          <div className="footer-right">
            <span>© 2025 Seyon Studio</span>
            <span className="fs-divider" />
            <span>Privacy Policy</span>
          </div>
        </div>

      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}