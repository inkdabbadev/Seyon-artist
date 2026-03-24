"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/authStore"

// ── Contact details ───────────────────────────────────────────────────────────
const WHATSAPP_NUMBER = "919342899751"
const CONTACT_EMAIL   = "inkdabba.dev@gmail.com"

// ── Packs ─────────────────────────────────────────────────────────────────────
const PACKS = [
  { credits: 25,  price: "₹149", label: "Starter", desc: "25 Flash or 8 Pro generations"   },
  { credits: 75,  price: "₹399", label: "Creator", desc: "75 Flash or 25 Pro generations"  },
  { credits: 200, price: "₹999", label: "Studio",  desc: "200 Flash or 66 Pro generations" },
]

const PACK_ACCENT = [
  "rgba(232,255,0,",   // Starter — yellow
  "rgba(100,200,255,", // Creator — blue
  "rgba(200,130,255,", // Studio  — purple
]

export default function CreditsModal({
  open, onClose,
}: {
  open: boolean; onClose: () => void
}) {
  const { profile } = useAuthStore()

  const [selected, setSelected] = useState(1)
  const [mounted,  setMounted]  = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [open])

  const pack      = PACKS[selected]
  const accent    = PACK_ACCENT[selected]
  const userName  = profile?.displayName ?? profile?.email?.split("@")[0] ?? "User"
  const userEmail = profile?.email ?? ""

  const waText = `Hi, I'd like to purchase the *${pack.label} Pack* (${pack.credits} credits for ${pack.price}).\n\nName: ${userName}\nEmail: ${userEmail}`
  const waLink  = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`
  const mailLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Credits — ${pack.label} Pack`)}&body=${encodeURIComponent(`Hi,\n\nI'd like to buy the ${pack.label} Pack (${pack.credits} credits for ${pack.price}).\n\nName: ${userName}\nEmail: ${userEmail}`)}`

  if (!mounted) return null

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

            /* ══ BACKDROP ══════════════════════════════════════════════════ */
            .cm-bd {
              position: fixed; inset: 0; z-index: 9998;
              background: rgba(4,4,10,0.88);
              backdrop-filter: blur(24px) saturate(120%);
              -webkit-backdrop-filter: blur(24px) saturate(120%);
            }

            /* ══ CONTAINER ══════════════════════════════════════════════════ */
            .cm-ct {
              position: fixed; inset: 0; z-index: 9999;
              display: flex; align-items: center; justify-content: center;
              padding: 20px; pointer-events: none;
            }

            /* ══ CARD ═══════════════════════════════════════════════════════ */
            .cm-card {
              pointer-events: all;
              width: min(460px, 100%); border-radius: 22px; overflow: hidden;
              background: rgba(8,9,18,0.99);
              border: 1px solid rgba(255,255,255,0.08);
              box-shadow:
                inset 0 0 0 1px rgba(255,255,255,0.03),
                0 60px 200px rgba(0,0,0,0.92);
            }

            /* Top prismatic line */
            .cm-prism {
              height: 1px;
              background: linear-gradient(90deg,
                transparent 0%,
                rgba(100,200,255,0.55) 18%,
                rgba(232,255,0,0.50) 50%,
                rgba(200,130,255,0.50) 78%,
                transparent 100%);
            }

            .cm-body { padding: 24px 24px 22px }

            /* ══ HEADER ═════════════════════════════════════════════════════ */
            .cm-head {
              display: flex; justify-content: space-between; align-items: flex-start;
              gap: 12px; margin-bottom: 20px;
            }
            .cm-title {
              font-family: 'Bebas Neue', sans-serif;
              font-size: 28px; letter-spacing: 0.16em; line-height: 1;
              color: rgba(255,255,255,0.92); margin: 0;
            }
            .cm-subtitle {
              font-family: 'JetBrains Mono', monospace;
              font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
              color: rgba(255,255,255,0.26); margin-top: 5px;
            }
            .cm-close {
              width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
              border: 1px solid rgba(255,255,255,0.09);
              background: rgba(255,255,255,0.035); color: rgba(255,255,255,0.40);
              display: grid; place-items: center; cursor: pointer;
              transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
            }
            .cm-close:hover {
              background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.16);
              color: rgba(255,255,255,0.88); transform: rotate(90deg);
            }

            /* ══ MODEL PILLS ════════════════════════════════════════════════ */
            .cm-pills { display: flex; gap: 6px; margin-bottom: 18px; flex-wrap: wrap }
            .cm-pill {
              display: inline-flex; align-items: center; gap: 6px;
              padding: 5px 11px; border-radius: 999px;
              border: 1px solid rgba(255,255,255,0.07);
              background: rgba(255,255,255,0.025);
              font-family: 'JetBrains Mono', monospace; font-size: 9.5px;
              letter-spacing: 0.10em; text-transform: uppercase;
              color: rgba(255,255,255,0.38);
            }
            .cm-pill-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0 }

            /* ══ PACK CARDS ══════════════════════════════════════════════════ */
            .cm-packs { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px }
            .cm-pack {
              width: 100%; display: flex; align-items: center; justify-content: space-between;
              padding: 13px 15px; border-radius: 13px; border: 1px solid; text-align: left;
              background: rgba(255,255,255,0.018); cursor: pointer;
              transition: all 0.20s cubic-bezier(0.16,1,0.3,1);
              position: relative; overflow: hidden;
            }
            .cm-pack::after {
              content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px;
              opacity: 0; transition: opacity 0.20s;
            }
            .cm-pack:hover { transform: translateY(-1px) }
            .cm-pack.sel::after { opacity: 1 }

            .cm-pack-left { display: flex; align-items: center; gap: 12px }

            /* Radio */
            .cm-radio {
              width: 17px; height: 17px; border-radius: 50%; flex-shrink: 0;
              border: 1.5px solid rgba(255,255,255,0.18);
              display: grid; place-items: center;
              transition: border-color 0.18s;
            }
            .cm-rdot { width: 8px; height: 8px; border-radius: 50% }

            .cm-pack-label {
              font-family: 'Bebas Neue', sans-serif;
              font-size: 17px; letter-spacing: 0.12em; line-height: 1;
              color: rgba(255,255,255,0.82); transition: color 0.18s;
            }
            .cm-pack-desc {
              font-family: 'JetBrains Mono', monospace; font-size: 9.5px;
              letter-spacing: 0.06em; color: rgba(255,255,255,0.28); margin-top: 3px;
            }

            .cm-pack-price {
              text-align: right; flex-shrink: 0;
            }
            .cm-pack-amount {
              font-family: 'Bebas Neue', sans-serif;
              font-size: 22px; letter-spacing: 0.06em; line-height: 1;
              transition: color 0.18s;
            }
            .cm-pack-per {
              font-family: 'JetBrains Mono', monospace; font-size: 8.5px;
              color: rgba(255,255,255,0.20); margin-top: 2px;
            }

            /* ══ DIVIDER ════════════════════════════════════════════════════ */
            .cm-rule {
              height: 1px; margin-bottom: 16px;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent);
            }

            /* ══ CTA BUTTONS ════════════════════════════════════════════════ */
            .cm-ctas { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px }

            /* WhatsApp */
            .cm-wa {
              width: 100%; padding: 14px; border-radius: 13px; border: none; cursor: pointer;
              font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
              letter-spacing: 0.18em; text-transform: uppercase; font-weight: 500;
              display: flex; align-items: center; justify-content: center; gap: 10px;
              background: linear-gradient(135deg, #25D366 0%, #1bbc58 100%); color: white;
              box-shadow: 0 4px 20px rgba(37,211,102,0.25);
              text-decoration: none;
              transition: filter 0.18s, transform 0.18s cubic-bezier(0.16,1,0.3,1), box-shadow 0.18s;
            }
            .cm-wa:hover {
              filter: brightness(1.08); transform: translateY(-1.5px);
              box-shadow: 0 8px 32px rgba(37,211,102,0.38);
            }

            /* Email */
            .cm-mail {
              width: 100%; padding: 12px; border-radius: 13px; cursor: pointer;
              font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
              letter-spacing: 0.18em; text-transform: uppercase; font-weight: 400;
              display: flex; align-items: center; justify-content: center; gap: 10px;
              background: transparent; border: 1px solid rgba(255,255,255,0.09);
              color: rgba(255,255,255,0.48); text-decoration: none;
              transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
            }
            .cm-mail:hover {
              border-color: rgba(255,255,255,0.17);
              background: rgba(255,255,255,0.038);
              color: rgba(255,255,255,0.78);
              transform: translateY(-1px);
            }

            /* ══ HOW IT WORKS ════════════════════════════════════════════════ */
            .cm-steps {
              padding: 14px 14px; border-radius: 12px;
              border: 1px solid rgba(255,255,255,0.058);
              background: rgba(255,255,255,0.012);
            }
            .cm-steps-title {
              font-family: 'JetBrains Mono', monospace; font-size: 8.5px;
              letter-spacing: 0.22em; text-transform: uppercase;
              color: rgba(255,255,255,0.24); margin-bottom: 13px;
            }
            .cm-step {
              display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;
            }
            .cm-step:last-child { margin-bottom: 0 }
            .cm-step-n {
              width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0;
              background: rgba(232,255,0,0.08); border: 1px solid rgba(232,255,0,0.18);
              display: grid; place-items: center;
              font-family: 'JetBrains Mono', monospace; font-size: 9px;
              color: rgba(232,255,0,0.78);
            }
            .cm-step-txt {
              font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 300;
              color: rgba(255,255,255,0.40); line-height: 1.60; padding-top: 2px;
            }
            .cm-step-txt b { color: rgba(255,255,255,0.68); font-weight: 500 }

            /* ══ FOOTER ═════════════════════════════════════════════════════ */
            .cm-footer {
              text-align: center; margin-top: 14px;
              font-family: 'JetBrains Mono', monospace; font-size: 8.5px;
              letter-spacing: 0.14em; text-transform: uppercase;
              color: rgba(255,255,255,0.16);
            }
          `}</style>

          {/* Backdrop */}
          <motion.div className="cm-bd"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.20 }}
            onClick={onClose}
          />

          {/* Card */}
          <div className="cm-ct">
            <motion.div
              className="cm-card"
              initial={{ opacity:0, scale:0.94, y:28, filter:"blur(14px)" }}
              animate={{ opacity:1, scale:1,    y:0,  filter:"blur(0px)"  }}
              exit={{    opacity:0, scale:0.94, y:20, filter:"blur(14px)" }}
              transition={{ duration:0.34, ease:[0.16,1,0.3,1] }}
              onClick={e => e.stopPropagation()}
              role="dialog" aria-modal="true"
            >
              <div className="cm-prism" />
              <div className="cm-body">

                {/* Header */}
                <div className="cm-head">
                  <div>
                    <h2 className="cm-title">Get Credits</h2>
                    <p className="cm-subtitle">Prices in INR · Credits never expire</p>
                  </div>
                  <button className="cm-close" onClick={onClose} aria-label="Close">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                {/* Model cost pills */}
                <div className="cm-pills">
                  <div className="cm-pill">
                    <div className="cm-pill-dot" style={{ background:"rgba(100,200,255,0.80)" }}/>
                    Flash — 1 credit
                  </div>
                  <div className="cm-pill">
                    <div className="cm-pill-dot" style={{ background:"rgba(200,130,255,0.80)" }}/>
                    Pro — 3 credits
                  </div>
                </div>

                {/* Pack selector */}
                <div className="cm-packs">
                  {PACKS.map((pk, i) => {
                    const acc = PACK_ACCENT[i]
                    const isSel = selected === i
                    return (
                      <button key={pk.label}
                        className={`cm-pack${isSel ? " sel" : ""}`}
                        onClick={() => setSelected(i)}
                        style={{
                          borderColor: isSel ? `${acc}0.32)` : "rgba(255,255,255,0.07)",
                          background:  isSel ? `${acc}0.055)` : "rgba(255,255,255,0.018)",
                          "--pack-accent": acc,
                        } as React.CSSProperties}
                      >
                        {/* Top shimmer on selected */}
                        <div style={{
                          position:"absolute", top:0, left:0, right:0, height:1,
                          background: `linear-gradient(90deg,transparent,${acc}0.55),transparent)`,
                          opacity: isSel ? 1 : 0, transition:"opacity 0.20s",
                          pointerEvents:"none",
                        }} />

                        <div className="cm-pack-left">
                          {/* Radio */}
                          <div className="cm-radio" style={{
                            borderColor: isSel ? `${acc}0.80)` : "rgba(255,255,255,0.18)",
                          }}>
                            {isSel && <div className="cm-rdot" style={{ background:`${acc}0.90)` }} />}
                          </div>
                          <div>
                            <div className="cm-pack-label" style={{
                              color: isSel ? `${acc}0.95)` : "rgba(255,255,255,0.78)",
                            }}>
                              {pk.label}
                            </div>
                            <div className="cm-pack-desc">{pk.desc}</div>
                          </div>
                        </div>

                        <div className="cm-pack-price">
                          <div className="cm-pack-amount" style={{
                            color: isSel ? `${acc}0.95)` : "rgba(255,255,255,0.65)",
                          }}>
                            {pk.price}
                          </div>
                          <div className="cm-pack-per">
                            ₹{(parseInt(pk.price.replace("₹","")) / pk.credits).toFixed(2)}/cr
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Divider */}
                <div className="cm-rule" />

                {/* CTA buttons */}
                <div className="cm-ctas">
                  <a className="cm-wa" href={waLink} target="_blank" rel="noopener noreferrer">
                    <svg width="17" height="17" viewBox="0 0 32 32" fill="white">
                      <path d="M16 1C7.716 1 1 7.716 1 16c0 2.68.698 5.197 1.92 7.38L1 31l7.845-1.9A14.95 14.95 0 0 0 16 31c8.284 0 15-6.716 15-15S24.284 1 16 1zm7.73 20.857c-.32.896-1.872 1.712-2.567 1.82-.655.1-1.48.142-2.387-.15-.55-.175-1.254-.41-2.155-.8-3.79-1.636-6.27-5.47-6.46-5.724-.19-.253-1.55-2.06-1.55-3.93 0-1.873 1.01-2.793 1.366-3.176.358-.383.78-.478 1.04-.478.26 0 .52.002.75.013.24.012.562-.09.88.67.32.76 1.088 2.63 1.184 2.82.096.19.16.41.032.66-.128.25-.192.41-.384.63-.19.22-.4.493-.57.662-.19.19-.39.397-.168.778.22.38.982 1.62 2.107 2.624 1.447 1.292 2.668 1.692 3.048 1.882.38.19.6.16.82-.097.22-.255.94-1.095 1.19-1.47.25-.375.5-.315.84-.19.34.126 2.16 1.02 2.53 1.207.37.19.617.284.708.44.09.157.09.906-.23 1.8z"/>
                    </svg>
                    Message on WhatsApp
                  </a>
                  <a className="cm-mail" href={mailLink}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    Send an Email
                  </a>
                </div>

                {/* How it works */}
                <div className="cm-steps">
                  <div className="cm-steps-title">How it works</div>
                  {[
                    ["1", <span key="1">Select a pack and tap <b>Message on WhatsApp</b></span>],
                    ["2", <span key="2">Send the pre-filled message and complete payment</span>],
                    ["3", <span key="3"><b>Credits added within minutes</b> after payment</span>],
                  ].map(([n, text]) => (
                    <div key={n as string} className="cm-step">
                      <div className="cm-step-n">{n}</div>
                      <div className="cm-step-txt">{text}</div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <p className="cm-footer">UPI · Bank transfer · Credits never expire</p>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(modal, document.body)
}