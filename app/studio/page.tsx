"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

import StudioNav    from "@/components/studio/Studionav"
import SetupPanel   from "@/components/studio/Setuppanel"
import ProfilePanel from "@/components/studio/Profilepanel"
import CanvasPanel  from "@/components/studio/Canvaspanel"

import { useAuthStore }                        from "@/store/authStore"
import { saveCreation, deductCredits }         from "@/lib/userService"
import type { GenerateRequest, Tab, Creation } from "@/types"

export default function StudioPage() {
  const {
    profile,
    setProfile,
    refreshProfile,
    loading,
    init,
  } = useAuthStore()

  const router = useRouter()

  const [tab, setTab]             = useState<Tab>("setup")
  const [panelOpen, setPanelOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [outputs, setOutputs]     = useState<string[]>([])
  const [lastSetup, setLastSetup] = useState<GenerateRequest | null>(null)
  const [genError, setGenError]   = useState<string | null>(null)

  // ── CURSOR RESTORE ────────────────────────────────────────────────────────
  // The landing page sets body { cursor: none } for its custom cursor.
  // We must explicitly restore it the moment the studio mounts,
  // and on every child element so nothing can inherit cursor:none.
  useEffect(() => {
    // Force real cursor on body immediately
    document.body.style.cursor = "auto"
    document.documentElement.style.cursor = "auto"

    // Also inject a high-specificity style tag so nothing in the studio
    // can accidentally inherit cursor:none from a cached CSS rule.
    const style = document.createElement("style")
    style.id = "studio-cursor-restore"
    style.textContent = `
      /* Studio cursor restore — overrides any cursor:none from landing page */
      body, html,
      .s-bg, .s-frame, .s-nav, .s-body,
      .s-left, .s-right, .s-tabs, .s-tab,
      .s-mbar, .s-mbtn, .s-drawer, .s-dhead,
      [class*="sn-"], [class*="sp-"], [class*="pp-"], [class*="cp-"] {
        cursor: auto !important;
      }
      /* Semantic cursors for interactive elements */
      button:not(:disabled),
      [role="button"]:not(:disabled),
      a,
      select,
      label[for],
      .s-tab,
      .s-mbtn,
      .s-dclose,
      [data-clickable] {
        cursor: pointer !important;
      }
      input, textarea {
        cursor: text !important;
      }
      button:disabled,
      [disabled] {
        cursor: not-allowed !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      // Clean up the injected style when navigating away
      document.getElementById("studio-cursor-restore")?.remove()
    }
  }, [])

  // ── Init Firebase auth listener ───────────────────────────────────────────
  useEffect(() => {
    const unsub = init()
    return unsub
  }, [init])

  // ── Redirect unauthenticated users ────────────────────────────────────────
  useEffect(() => {
    if (!loading && !profile) router.push("/")
  }, [loading, profile, router])

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async (data: GenerateRequest) => {
    if (!profile) return

    setLastSetup(data)
    setGenError(null)
    setIsGenerating(true)
    setOutputs([])

    const creditCost = data.model === "flash" ? 1 : 3
    const totalCost  = creditCost * data.slides
    const isCarousel = data.slides > 1

    const deducted = await deductCredits(
      profile.uid, totalCost, profile.isOrgMember ?? false
    )
    if (!deducted) {
      setGenError(`Not enough credits. Need ${totalCost}, have ${profile.credits ?? 0}.`)
      setIsGenerating(false)
      return
    }

    if (!profile.isOrgMember) {
      setProfile({ ...profile, credits: (profile.credits ?? 0) - totalCost })
    }

    try {
      const res  = await fetch("/api/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expertStyle:     data.expertStyle,
          notes:           data.notes,
          aspectRatio:     data.aspectRatio,
          model:           data.model,
          slides:          data.slides,
          inputLayout:     data.inputLayout,
          referenceStyles: data.referenceStyles,
        }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }

      const images: string[] = Array.isArray(json.images) ? json.images : []

      if (images.length === 0) {
        throw new Error("No images returned from generation.")
      }

      setOutputs(images)

      if (json.errors?.length) {
        setGenError(
          `${images.length}/${data.slides} slides generated. Some failed: ${json.errors[0]}`
        )
      }

      const now = new Date().toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })

      await Promise.allSettled(
        images.map((src, i) => {
          const creation: Creation = {
            id:          `${profile.uid}-${Date.now()}-${i}`,
            src,
            style:       data.expertStyle,
            aspectRatio: data.aspectRatio,
            slides:      data.slides,
            createdAt:   now,
            prompt:      data.notes || undefined,
          }
          return saveCreation(profile.uid, creation, data.expertStyle, isCarousel)
        })
      )

      await refreshProfile()

    } catch (err: any) {
      setGenError(err?.message ?? "Generation failed. Check your API key and try again.")
    } finally {
      setIsGenerating(false)
    }
  }, [profile, setProfile, refreshProfile])

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading || !profile) return (
    <div style={{
      height: "100vh", display: "grid", placeItems: "center",
      background: "#060609",
      cursor: "auto",   /* ← explicit: never inherit cursor:none */
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        /* Ensure cursor is always visible on loading screen */
        body { cursor: auto !important }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.08)",
          borderTopColor: "rgba(232,255,0,0.70)",
          animation: "spin 0.75s linear infinite",
        }} />
        <span style={{
          fontFamily: "ui-monospace,monospace", fontSize: 10,
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.22)",
        }}>Loading studio</span>
      </div>
    </div>
  )

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        /* ─── STUDIO CURSOR BASELINE ─── */
        /* Belt-and-suspenders: even if a stray cursor:none exists, reset here */
        .s-bg, .s-bg * { cursor: auto }
        button:not([disabled]), .s-tab, .s-mbtn, .s-dclose { cursor: pointer !important }
        input, textarea, select { cursor: text !important }
        button[disabled] { cursor: not-allowed !important }

        /* ─── LAYOUT ─── */
        .s-bg {
          min-height: 100vh;
          background:
            radial-gradient(900px 700px at 15% 12%, rgba(99,180,255,0.07) 0%, transparent 60%),
            radial-gradient(900px 700px at 85% 12%, rgba(190,130,255,0.06) 0%, transparent 60%),
            radial-gradient(700px 500px at 70% 90%, rgba(120,255,210,0.05) 0%, transparent 60%),
            #060609;
          padding: clamp(10px, 1.8vw, 22px);
        }
        .s-frame {
          width: min(1440px, 100%);
          margin: 0 auto;
          border-radius: clamp(16px, 1.4vw, 24px);
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.025);
          box-shadow: 0 32px 120px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.06);
          overflow: hidden;
          min-height: calc(100vh - clamp(20px, 3.6vw, 44px));
          display: flex; flex-direction: column;
          position: relative;
        }
        .s-shimmer {
          height: 1px;
          background: linear-gradient(90deg,
            transparent,
            rgba(255,255,255,0.12) 40%,
            rgba(255,255,255,0.06) 70%,
            transparent);
          flex-shrink: 0;
        }
        .s-nav {
          position: sticky; top: 0; z-index: 30;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(6,6,9,0.80);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        }
        .s-body {
          position: relative; flex: 1; min-height: 0;
          display: grid;
          grid-template-columns: 400px 1fr;
        }
        .s-left {
          min-height: 0;
          border-right: 1px solid rgba(255,255,255,0.06);
          background: rgba(0,0,0,0.10);
          display: flex; flex-direction: column;
        }
        .s-tabs {
          display: flex; flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(0,0,0,0.08);
        }
        .s-tab {
          flex: 1; padding: 13px 0; border: none;
          background: transparent;
          font-family: ui-monospace, monospace;
          font-size: 10px; letter-spacing: 0.20em; text-transform: uppercase;
          color: rgba(255,255,255,0.30);
          transition: color 0.18s, background 0.18s;
          position: relative;
        }
        .s-tab:hover { color: rgba(255,255,255,0.65); background: rgba(255,255,255,0.02); }
        .s-tab.on    { color: rgba(255,255,255,0.88); background: rgba(255,255,255,0.03); }
        .s-tab.on::after {
          content: ""; position: absolute; left: 20px; right: 20px; bottom: 0;
          height: 1.5px; border-radius: 999px;
          background: #E8FF00; box-shadow: 0 0 8px rgba(232,255,0,0.45);
        }
        .s-left-scroll { flex: 1; min-height: 0; overflow: hidden; }
        .s-right {
          min-height: 0; background: rgba(0,0,0,0.12);
          display: flex; flex-direction: column;
        }
        .s-mbar {
          display: none; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(0,0,0,0.15); backdrop-filter: blur(12px);
        }
        .s-mbtn {
          border-radius: 999px; padding: 9px 14px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.75);
          font-family: ui-monospace, monospace;
          font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
          transition: all 0.18s;
        }
        .s-mbtn:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.16);
          color: rgba(255,255,255,0.92);
        }
        .s-dbackdrop {
          position: fixed; inset: 0; z-index: 80;
          background: rgba(4,4,8,0.78); backdrop-filter: blur(14px);
          cursor: auto !important;
        }
        .s-drawer {
          position: fixed; z-index: 90;
          top: 12px; bottom: 12px; left: 12px; right: 12px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(10,10,16,0.98);
          box-shadow: 0 40px 160px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.06);
          overflow: hidden; display: flex; flex-direction: column;
          cursor: auto !important;
        }
        .s-dhead {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(0,0,0,0.20); flex-shrink: 0;
        }
        .s-dclose {
          width: 34px; height: 34px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.60);
          display: grid; place-items: center; transition: all 0.18s;
        }
        .s-dclose:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.88);
        }

        @media (max-width: 1040px) { .s-body { grid-template-columns: 360px 1fr; } }
        @media (max-width: 900px)  {
          .s-body { grid-template-columns: 1fr; }
          .s-left { display: none; }
          .s-mbar { display: flex; }
        }
      `}</style>

      <div className="s-bg">
        <div className="s-frame">
          <div className="s-shimmer" />

          <div className="s-nav">
            <StudioNav profile={profile} />
          </div>

          {/* Mobile bar */}
          <div className="s-mbar">
            <button className="s-mbtn" onClick={() => { setTab("setup");   setPanelOpen(true) }}>Setup</button>
            <div style={{
              fontFamily: "ui-monospace,monospace", fontSize: 10,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
            }}>Studio</div>
            <button className="s-mbtn" onClick={() => { setTab("profile"); setPanelOpen(true) }}>Profile</button>
          </div>

          <div className="s-body">

            {/* Left panel */}
            <div className="s-left">
              <div className="s-tabs">
                {(["setup", "profile"] as Tab[]).map(t => (
                  <button key={t} type="button"
                    className={`s-tab${tab === t ? " on" : ""}`}
                    onClick={() => setTab(t)}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="s-left-scroll">
                {tab === "setup" ? (
                  <SetupPanel
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    credits={profile.credits ?? 0}
                    isOrgMember={profile.isOrgMember ?? false}
                    error={genError}
                    onClearError={() => setGenError(null)}
                  />
                ) : (
                  <ProfilePanel
                    profile={profile}
                    onRegenerate={() => {
                      if (lastSetup) { setTab("setup"); handleGenerate(lastSetup) }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Canvas */}
            <div className="s-right">
              <CanvasPanel
                isGenerating={isGenerating}
                outputs={outputs}
                onRegenerate={() => { if (lastSetup) handleGenerate(lastSetup) }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              className="s-dbackdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
            />
            <motion.div
              className="s-drawer"
              initial={{ opacity: 0, y: 20, scale: 0.97, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0,  scale: 1,    filter: "blur(0px)"  }}
              exit={{    opacity: 0, y: 16, scale: 0.97, filter: "blur(10px)" }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <div className="s-dhead">
                <div style={{ display: "flex", gap: 7 }}>
                  {(["setup", "profile"] as Tab[]).map(t => (
                    <button key={t} type="button" className="s-mbtn"
                      style={{
                        background:  tab === t ? "rgba(255,255,255,0.07)"  : "rgba(255,255,255,0.03)",
                        borderColor: tab === t ? "rgba(232,255,0,0.30)"    : "rgba(255,255,255,0.09)",
                        color:       tab === t ? "rgba(255,255,255,0.90)"  : "rgba(255,255,255,0.45)",
                      }}
                      onClick={() => setTab(t)}>
                      {t}
                    </button>
                  ))}
                </div>
                <button className="s-dclose" onClick={() => setPanelOpen(false)} aria-label="Close">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                {tab === "setup" ? (
                  <SetupPanel
                    onGenerate={(data) => {
                      setPanelOpen(false)
                      handleGenerate(data)
                    }}
                    isGenerating={isGenerating}
                    credits={profile.credits ?? 0}
                    isOrgMember={profile.isOrgMember ?? false}
                    error={genError}
                    onClearError={() => setGenError(null)}
                  />
                ) : (
                  <ProfilePanel
                    profile={profile}
                    onRegenerate={() => {
                      if (lastSetup) {
                        setTab("setup")
                        setPanelOpen(false)
                        handleGenerate(lastSetup)
                      }
                    }}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}