"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { GenerateRequest } from "@/types"
import { CATEGORIES, type StyleCategory } from "@/lib/styleService"

// ── Constants ─────────────────────────────────────────────────────────────────
const RATIOS = ["1:1 SQUARE", "3:4 PORTRAIT", "4:3 LANDSCAPE", "9:16 SOCIAL", "16:9 VIDEO"]

const RATIO_PATH: Record<string, string> = {
  "1:1 SQUARE":    "M2 2h20v20H2z",
  "3:4 PORTRAIT":  "M4 1h16v22H4z",
  "4:3 LANDSCAPE": "M1 4h22v16H1z",
  "9:16 SOCIAL":   "M6 1h12v22H6z",
  "16:9 VIDEO":    "M1 7h22v10H1z",
}

interface Props {
  onGenerate:   (d: GenerateRequest) => void
  isGenerating: boolean
  credits:      number
  isOrgMember:  boolean
  error:        string | null
  onClearError: () => void
}

export default function SetupPanel({
  onGenerate, isGenerating, credits, isOrgMember, error, onClearError,
}: Props) {

  // ── Style state ───────────────────────────────────────────────────────────
  const [selectedCat,  setSelectedCat]  = useState<StyleCategory>(CATEGORIES[0])
  const [customPrompt, setCustomPrompt] = useState("")

  // ── Generation state ──────────────────────────────────────────────────────
  const [ratio,    setRatio]    = useState(RATIOS[0])
  const [model,    setModel]    = useState<"flash" | "pro">("flash")
  const [slides,   setSlides]   = useState(1)
  const [notes,    setNotes]    = useState("")
  const [layout,   setLayout]   = useState<string | null>(null)
  const [layoutNm, setLayoutNm] = useState("")
  const [refs,     setRefs]     = useState<string[]>([])
  const [drag,     setDrag]     = useState(false)
  const [refDrag,  setRefDrag]  = useState(false)
  const [expanded, setExpanded] = useState(false)

  const fileRef     = useRef<HTMLInputElement>(null)
  const refFileRef  = useRef<HTMLInputElement>(null)
  const pasteToRefs = useRef(false)

  // ── File helpers ──────────────────────────────────────────────────────────
  const toBase64 = (f: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res((r.result as string).split(",")[1])
      r.onerror = rej; r.readAsDataURL(f)
    })

  const handleLayout = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setLayout(await toBase64(f)); setLayoutNm(f.name)
  }
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]; if (!f) return
    setLayout(await toBase64(f)); setLayoutNm(f.name)
  }
  const addRefFiles = useCallback(async (files: File[]) => {
    const imgs  = files.filter(f => f.type?.startsWith("image/"))
    const space = Math.max(0, 6 - refs.length)
    if (!imgs.length || !space) return
    const b64s = await Promise.all(imgs.slice(0, space).map(toBase64))
    setRefs(p => [...p, ...b64s].slice(0, 6))
  }, [refs.length])
  const handleRefs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length) return
    await addRefFiles(files); e.target.value = ""
  }
  const handleRefDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setRefDrag(false)
    await addRefFiles(Array.from(e.dataTransfer.files || []))
  }

  // Global paste
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const t   = e.target as HTMLElement
      const tag = t?.tagName?.toLowerCase()
      if (tag === "textarea" || tag === "input" || (t as any)?.isContentEditable) return
      const files = Array.from(e.clipboardData?.items || [])
        .filter(it => it.kind === "file").map(it => it.getAsFile()).filter(Boolean) as File[]
      if (!files.length) return; e.preventDefault()
      for (const f of files) {
        if (!pasteToRefs.current) { setLayout(await toBase64(f)); setLayoutNm(f.name || "pasted.png") }
        else await addRefFiles([f])
        pasteToRefs.current = !pasteToRefs.current
      }
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [addRefFiles])

  // ── Derived ───────────────────────────────────────────────────────────────
  const expertStylePrompt = selectedCat.isCustom ? customPrompt : selectedCat.prompt
  const creditCost  = model === "flash" ? 1 : 3
  const totalCost   = creditCost * slides
  const isCustom    = selectedCat.isCustom
  const customReady = !isCustom || customPrompt.trim().length > 0
  const canGenerate = (isOrgMember || credits >= totalCost) && !isGenerating && customReady
  const creditsFine = isOrgMember || credits >= totalCost
  const pct         = ((slides - 1) / 7) * 100

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@200;300;400;500&family=JetBrains+Mono:wght@300;400;500&display=swap');

        /* ══ ROOT ══════════════════════════════════════════════════════════ */
        .sp {
          height: 100%; display: flex; flex-direction: column; overflow: hidden;
          background: rgba(7,7,16,0.97);
          border-right: 1px solid rgba(255,255,255,0.055);
          position: relative;
        }

        /* ══ SCROLL BODY ═══════════════════════════════════════════════════ */
        .sp-body {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.06) transparent;
        }
        .sp-body::-webkit-scrollbar { width: 2px }
        .sp-body::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.07); border-radius: 99px;
        }
        .sp-body::-webkit-scrollbar-thumb:hover {
          background: rgba(232,255,0,0.20);
        }

        /* ══ HEADER ════════════════════════════════════════════════════════ */
        .sp-head {
          flex-shrink: 0;
          padding: 22px 20px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.055);
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
        }
        .sp-head-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 26px; letter-spacing: 0.16em; line-height: 1;
          color: rgba(255,255,255,0.90);
        }
        .sp-head-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(255,255,255,0.24); margin-top: 5px;
        }

        /* Credit chip */
        .sp-cred {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 7px 12px; border-radius: 8px; border: 1px solid; flex-shrink: 0;
        }
        .sp-cred-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0 }
        .sp-cred-lbl {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
        }

        /* ══ SECTION ═══════════════════════════════════════════════════════ */
        .sp-sec {
          padding: 22px 20px 0;
        }
        .sp-rule {
          margin: 20px 0 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent);
        }
        .sp-sec-lbl {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 13px;
        }
        .sp-sec-lbl-txt {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(255,255,255,0.32);
        }
        .sp-sec-lbl-aux {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(255,255,255,0.20); cursor: pointer; background: none; border: none;
          padding: 0; transition: color 0.16s;
        }
        .sp-sec-lbl-aux:hover { color: rgba(255,255,255,0.45) }

        /* ══ CATEGORY GRID ═════════════════════════════════════════════════ */
        .sp-cats {
          display: grid; grid-template-columns: 1fr 1fr; gap: 7px;
        }
        .sp-cat {
          padding: 14px 13px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.065);
          background: rgba(255,255,255,0.018);
          cursor: pointer; text-align: left;
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          position: relative; overflow: hidden;
          transition: all 0.20s cubic-bezier(0.16,1,0.3,1);
        }
        .sp-cat::after {
          content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
          opacity: 0; transition: opacity 0.20s;
        }
        .sp-cat:hover { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.038); transform: translateY(-1px) }
        .sp-cat:hover::after { opacity: 1 }

        /* selected — yellow */
        .sp-cat.on {
          border-color: rgba(232,255,0,0.28);
          background: rgba(232,255,0,0.055);
        }
        .sp-cat.on::after {
          opacity: 1;
          background: linear-gradient(90deg, transparent, rgba(232,255,0,0.40), transparent);
        }
        /* selected — custom purple */
        .sp-cat.on-custom {
          border-color: rgba(167,139,250,0.28);
          background: rgba(167,139,250,0.06);
        }
        .sp-cat.on-custom::after {
          opacity: 1;
          background: linear-gradient(90deg, transparent, rgba(167,139,250,0.40), transparent);
        }

        .sp-cat-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0 }
        .sp-cat-emoji {
          font-size: 18px; flex-shrink: 0; line-height: 1;
          transition: transform 0.20s cubic-bezier(0.16,1,0.3,1);
        }
        .sp-cat:hover .sp-cat-emoji { transform: scale(1.18) }
        .sp-cat.on .sp-cat-emoji, .sp-cat.on-custom .sp-cat-emoji { transform: scale(1.10) }

        .sp-cat-name {
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.65); letter-spacing: 0.01em;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: color 0.18s;
        }
        .sp-cat.on .sp-cat-name { color: rgba(255,255,255,0.92) }
        .sp-cat.on-custom .sp-cat-name { color: rgba(255,255,255,0.92) }

        /* Radio dot */
        .sp-cat-radio {
          width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;
          border: 1.5px solid rgba(255,255,255,0.16);
          display: grid; place-items: center;
          transition: border-color 0.18s;
        }
        .sp-cat.on .sp-cat-radio { border-color: rgba(232,255,0,0.60) }
        .sp-cat.on-custom .sp-cat-radio { border-color: rgba(167,139,250,0.60) }
        .sp-cat-radio-fill { width: 7px; height: 7px; border-radius: 50% }

        /* ══ CUSTOM PROMPT INPUT ════════════════════════════════════════════ */
        .sp-custom-wrap {
          margin-top: 9px; overflow: hidden;
        }
        .sp-custom-input {
          width: 100%; padding: 11px 14px; border-radius: 10px;
          border: 1px solid rgba(167,139,250,0.25);
          background: rgba(167,139,250,0.05);
          color: rgba(255,255,255,0.88);
          font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 300;
          outline: none; transition: border-color 0.18s, box-shadow 0.18s;
          box-sizing: border-box;
        }
        .sp-custom-input::placeholder { color: rgba(255,255,255,0.22) }
        .sp-custom-input:focus {
          border-color: rgba(167,139,250,0.50);
          box-shadow: 0 0 0 3px rgba(167,139,250,0.08);
        }

        /* ══ TEXTAREA ══════════════════════════════════════════════════════ */
        .sp-ta {
          width: 100%; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.022);
          color: rgba(255,255,255,0.85); padding: 13px 15px;
          outline: none; resize: none;
          font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 300; line-height: 1.70;
          transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
          box-sizing: border-box;
        }
        .sp-ta::placeholder { color: rgba(255,255,255,0.20) }
        .sp-ta:focus {
          border-color: rgba(232,255,0,0.20);
          background: rgba(255,255,255,0.030);
          box-shadow: 0 0 0 3px rgba(232,255,0,0.06);
        }
        .sp-char-count {
          margin-top: 5px; text-align: right;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px; letter-spacing: 0.10em;
          color: rgba(255,255,255,0.18);
        }

        /* ══ RATIO PILLS ═══════════════════════════════════════════════════ */
        .sp-ratios { display: flex; flex-wrap: wrap; gap: 7px }
        .sp-ratio {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 13px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.018);
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.40);
          transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        .sp-ratio:hover { border-color: rgba(255,255,255,0.14); color: rgba(255,255,255,0.75); transform: translateY(-1px) }
        .sp-ratio.on {
          border-color: rgba(232,255,0,0.30);
          background: rgba(232,255,0,0.07);
          color: rgba(232,255,0,0.88);
        }

        /* ══ UPLOAD ZONE ════════════════════════════════════════════════════ */
        .sp-drop {
          height: 88px; border-radius: 11px;
          border: 1.5px dashed rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.012);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 8px;
          cursor: pointer;
          transition: all 0.20s cubic-bezier(0.16,1,0.3,1);
        }
        .sp-drop:hover, .sp-drop.drag {
          border-color: rgba(232,255,0,0.28);
          background: rgba(232,255,0,0.035);
          transform: translateY(-1px);
        }
        .sp-drop-lbl {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(255,255,255,0.28);
        }

        /* Upload thumb */
        .sp-thumb {
          position: relative; border-radius: 11px; overflow: hidden;
          height: 96px; border: 1px solid rgba(255,255,255,0.09);
        }
        .sp-thumb img { width: 100%; height: 100%; object-fit: cover; display: block }
        .sp-thumb-x {
          position: absolute; top: 7px; right: 7px; width: 26px; height: 26px;
          border-radius: 50%; border: 1px solid rgba(255,255,255,0.18);
          background: rgba(0,0,0,0.72); color: white; cursor: pointer;
          display: grid; place-items: center; font-size: 11px;
          transition: all 0.15s;
        }
        .sp-thumb-x:hover { background: rgba(0,0,0,0.90); transform: scale(1.08) }
        .sp-thumb-bar {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 20px 10px 7px;
          background: linear-gradient(to top, rgba(0,0,0,0.80), transparent);
          font-family: 'JetBrains Mono', monospace; font-size: 9px;
          letter-spacing: 0.08em; color: rgba(255,255,255,0.40);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* Ref thumbnails */
        .sp-refs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px }
        .sp-ref {
          position: relative; width: 52px; height: 52px;
          border-radius: 10px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.09);
        }
        .sp-ref img { width: 100%; height: 100%; object-fit: cover }
        .sp-ref-rm {
          position: absolute; inset: 0; border: none;
          background: rgba(0,0,0,0.72); color: white;
          cursor: pointer; opacity: 0; transition: opacity 0.15s;
          display: grid; place-items: center; font-size: 13px;
        }
        .sp-ref:hover .sp-ref-rm { opacity: 1 }
        .sp-ref-count {
          margin-top: 7px;
          font-family: 'JetBrains Mono', monospace; font-size: 9.5px;
          letter-spacing: 0.14em; color: rgba(255,255,255,0.24);
        }

        /* ══ MODEL CARDS ════════════════════════════════════════════════════ */
        .sp-models { display: grid; grid-template-columns: 1fr 1fr; gap: 9px }
        .sp-model {
          border-radius: 12px; border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.018);
          cursor: pointer; padding: 16px 14px;
          display: flex; flex-direction: column; gap: 6px;
          position: relative; overflow: hidden;
          transition: all 0.20s cubic-bezier(0.16,1,0.3,1);
        }
        .sp-model::after {
          content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
          opacity: 0; transition: opacity 0.18s;
        }
        .sp-model:hover { border-color: rgba(255,255,255,0.13); background: rgba(255,255,255,0.038); transform: translateY(-1px) }
        .sp-model:hover::after { opacity: 1 }
        .sp-model.on { border-color: rgba(232,255,0,0.26); background: rgba(232,255,0,0.06) }
        .sp-model.on::after {
          opacity: 1;
          background: linear-gradient(90deg, transparent, rgba(232,255,0,0.35), transparent);
        }
        .sp-model-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px; letter-spacing: 0.12em; line-height: 1;
          transition: color 0.18s;
        }
        .sp-model-desc {
          font-family: 'JetBrains Mono', monospace; font-size: 9px;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(255,255,255,0.30);
        }
        .sp-model-badge {
          margin-top: 4px; display: inline-flex; align-items: center;
          padding: 4px 10px; border-radius: 999px;
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          letter-spacing: 0.12em; text-transform: uppercase;
          border: 1px solid; transition: all 0.18s;
        }

        /* ══ SLIDES SLIDER ══════════════════════════════════════════════════ */
        .sp-slide-top {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 16px;
        }
        .sp-slide-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 48px; letter-spacing: 0.04em; line-height: 1;
          color: rgba(255,255,255,0.90);
        }
        .sp-slide-sub {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(255,255,255,0.28); padding-bottom: 8px;
        }
        .sp-track {
          position: relative; height: 4px; border-radius: 99px;
          background: rgba(255,255,255,0.07);
        }
        .sp-track-fill {
          position: absolute; left: 0; top: 0; bottom: 0; border-radius: 99px;
          background: linear-gradient(90deg, #E8FF00, rgba(232,255,0,0.45));
          transition: width 0.08s; pointer-events: none;
        }
        .sp-track-thumb {
          position: absolute; top: 50%; width: 18px; height: 18px; border-radius: 50%;
          background: #fff; border: 2px solid rgba(232,255,0,0.60);
          box-shadow: 0 2px 12px rgba(0,0,0,0.60);
          transform: translate(-50%,-50%); pointer-events: none;
        }
        input[type="range"].sp-range {
          position: absolute; inset: 0; width: 100%; height: 100%;
          opacity: 0; cursor: pointer; margin: 0; -webkit-appearance: none;
        }
        .sp-pips {
          display: flex; justify-content: space-between; margin-top: 13px;
        }
        .sp-pip {
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          letter-spacing: 0.04em; color: rgba(255,255,255,0.20);
          cursor: pointer; transition: color 0.15s; user-select: none; padding: 3px;
        }
        .sp-pip:hover { color: rgba(255,255,255,0.55) }
        .sp-pip.on { color: rgba(232,255,0,0.85) }

        /* ══ GENERATE FOOTER ════════════════════════════════════════════════ */
        .sp-foot {
          flex-shrink: 0;
          padding: 16px 20px 24px;
          border-top: 1px solid rgba(255,255,255,0.055);
          background: rgba(6,6,14,0.60);
        }

        /* Cost row */
        .sp-cost {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; border-radius: 9px; margin-bottom: 12px;
          border: 1px solid rgba(255,255,255,0.055);
          background: rgba(255,255,255,0.018);
        }
        .sp-cost-lbl {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(255,255,255,0.30);
        }
        .sp-cost-val {
          font-family: 'Bebas Neue', sans-serif; font-size: 20px;
          letter-spacing: 0.08em; color: rgba(255,255,255,0.85);
        }

        /* Generate button */
        .sp-gen {
          width: 100%; padding: 17px; border-radius: 12px; border: none;
          cursor: pointer; position: relative; overflow: hidden;
          font-family: 'JetBrains Mono', monospace; font-size: 12px;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: #060609; font-weight: 500;
          background: linear-gradient(110deg, #E8FF00 0%, #d4eb00 55%, #c0d500 100%);
          box-shadow: 0 4px 28px rgba(232,255,0,0.24), inset 0 1px 0 rgba(255,255,255,0.28);
          transition: transform 0.18s cubic-bezier(0.16,1,0.3,1),
                      box-shadow 0.18s, filter 0.15s, opacity 0.15s;
        }
        /* Sweep shimmer */
        .sp-gen::before {
          content: ""; position: absolute; top: 0; left: -110%; width: 55%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.30), transparent);
          transition: left 0.55s ease;
        }
        .sp-gen:hover:not(:disabled)::before { left: 160% }
        .sp-gen:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 0 48px rgba(232,255,0,0.30), 0 8px 32px rgba(0,0,0,0.40);
          filter: brightness(1.05);
        }
        .sp-gen:active:not(:disabled) { transform: translateY(0) }
        .sp-gen:disabled { opacity: 0.28; cursor: not-allowed; transform: none; box-shadow: none }

        /* Spinner */
        .sp-spin {
          display: inline-block; width: 11px; height: 11px;
          border: 2px solid rgba(6,6,9,0.22); border-top-color: #060609;
          border-radius: 50%; animation: spSpin 0.65s linear infinite;
          margin-right: 9px; vertical-align: middle;
        }
        @keyframes spSpin { to { transform: rotate(360deg) } }

        /* Warnings */
        .sp-warn {
          margin-top: 10px; text-align: center;
          font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
          letter-spacing: 0.10em; color: rgba(255,160,80,0.80);
        }

        /* Error banner */
        .sp-err {
          margin: 16px 20px 0; padding: 12px 14px; border-radius: 11px;
          background: rgba(255,60,60,0.06); border: 1px solid rgba(255,60,60,0.18);
          display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
        }
        .sp-err-msg {
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          letter-spacing: 0.06em; color: rgba(255,130,130,0.92); line-height: 1.65;
        }
        .sp-err-x {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          border: 1px solid rgba(255,80,80,0.20); background: rgba(255,60,60,0.06);
          color: rgba(255,120,120,0.88); cursor: pointer;
          display: grid; place-items: center;
          transition: all 0.15s;
        }
        .sp-err-x:hover { background: rgba(255,60,60,0.12); border-color: rgba(255,80,80,0.35) }
      `}</style>

      <div className="sp">

        {/* ══ HEADER ══ */}
        <div className="sp-head">
          <div>
            <div className="sp-head-title">Setup</div>
            <div className="sp-head-sub">Configure generation</div>
          </div>

          {/* Credit chip */}
          <div className="sp-cred" style={{
            borderColor: isOrgMember ? "rgba(167,139,250,0.24)" : creditsFine ? "rgba(232,255,0,0.22)" : "rgba(255,107,53,0.28)",
            background:  isOrgMember ? "rgba(167,139,250,0.06)" : creditsFine ? "rgba(232,255,0,0.05)" : "rgba(255,107,53,0.06)",
          }}>
            <div className="sp-cred-dot" style={{
              background: isOrgMember ? "rgba(196,181,253,0.90)" : creditsFine ? "#E8FF00" : "rgba(255,140,80,0.90)",
              boxShadow: `0 0 7px ${isOrgMember ? "rgba(196,181,253,0.40)" : creditsFine ? "rgba(232,255,0,0.40)" : "rgba(255,140,80,0.40)"}`,
            }} />
            <span className="sp-cred-lbl" style={{
              color: isOrgMember ? "rgba(196,181,253,0.88)" : creditsFine ? "rgba(232,255,0,0.85)" : "rgba(255,150,80,0.90)",
            }}>
              {isOrgMember ? "∞ Org" : `${credits} cr`}
            </span>
          </div>
        </div>

        {/* ══ SCROLLABLE BODY ══ */}
        <div className="sp-body">

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div className="sp-err"
                initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}>
                <span className="sp-err-msg">{error}</span>
                <button className="sp-err-x" onClick={onClearError}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Expert Style ── */}
          <div className="sp-sec">
            <div className="sp-sec-lbl">
              <span className="sp-sec-lbl-txt">Expert Style</span>
            </div>
            <div className="sp-cats">
              {CATEGORIES.map(cat => {
                const isSel = selectedCat.id === cat.id
                const cls   = isSel ? (cat.isCustom ? " on-custom" : " on") : ""
                return (
                  <button key={cat.id} className={`sp-cat${cls}`} onClick={() => setSelectedCat(cat)}>
                    <div className="sp-cat-left">
                      <span className="sp-cat-emoji">{cat.emoji}</span>
                      <span className="sp-cat-name">{cat.title}</span>
                    </div>
                    <div className="sp-cat-radio">
                      {isSel && (
                        <div className="sp-cat-radio-fill" style={{
                          background: cat.isCustom ? "rgba(167,139,250,0.88)" : "#E8FF00",
                        }} />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Custom input */}
            <AnimatePresence>
              {isCustom && (
                <motion.div className="sp-custom-wrap"
                  initial={{ opacity:0, height:0 }}
                  animate={{ opacity:1, height:"auto" }}
                  exit={{ opacity:0, height:0 }}
                  transition={{ duration:0.22, ease:[0.16,1,0.3,1] }}>
                  <input className="sp-custom-input" type="text"
                    placeholder="e.g. Tamil movie poster, Minimalist brand..."
                    value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                    autoFocus />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="sp-rule" />

          {/* ── Creative Notes ── */}
          <div className="sp-sec">
            <div className="sp-sec-lbl">
              <span className="sp-sec-lbl-txt">Creative Notes</span>
              <button className="sp-sec-lbl-aux" onClick={() => setExpanded(p => !p)}>
                {expanded ? "Collapse ↑" : "Expand ↓"}
              </button>
            </div>
            <textarea className="sp-ta"
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Describe your vision, brand rules, style notes..."
              style={{ height: expanded ? 160 : 84 }} />
            {notes.length > 0 && <div className="sp-char-count">{notes.length} chars</div>}
          </div>
          <div className="sp-rule" />

          {/* ── Aspect Ratio ── */}
          <div className="sp-sec">
            <div className="sp-sec-lbl">
              <span className="sp-sec-lbl-txt">Aspect Ratio</span>
            </div>
            <div className="sp-ratios">
              {RATIOS.map(r => (
                <button key={r} className={`sp-ratio${ratio === r ? " on" : ""}`} onClick={() => setRatio(r)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d={RATIO_PATH[r]} />
                  </svg>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="sp-rule" />

          {/* ── Input Layout ── */}
          <div className="sp-sec">
            <div className="sp-sec-lbl">
              <span className="sp-sec-lbl-txt">Input Layout</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:"0.14em", color:"rgba(255,255,255,0.20)", textTransform:"uppercase" }}>Optional</span>
            </div>
            {layout ? (
              <div className="sp-thumb">
                <img src={`data:image/png;base64,${layout}`} alt="layout" />
                <button className="sp-thumb-x" onClick={() => { setLayout(null); setLayoutNm("") }}>✕</button>
                <div className="sp-thumb-bar">{layoutNm}</div>
              </div>
            ) : (
              <div className={`sp-drop${drag ? " drag" : ""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop} role="button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(232,255,0,0.35)" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span className="sp-drop-lbl">{drag ? "Release to upload" : "Drop or click to upload"}</span>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleLayout} style={{ display:"none" }} />
          </div>
          <div className="sp-rule" />

          {/* ── Reference Styles ── */}
          <div className="sp-sec">
            <div className="sp-sec-lbl">
              <span className="sp-sec-lbl-txt">Reference Styles</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:"0.14em", color:"rgba(255,255,255,0.20)", textTransform:"uppercase" }}>Up to 6</span>
            </div>
            {refs.length > 0 && (
              <div className="sp-refs">
                {refs.map((src, i) => (
                  <div key={i} className="sp-ref">
                    <img src={`data:image/png;base64,${src}`} alt={`ref-${i}`} />
                    <button className="sp-ref-rm" onClick={() => setRefs(p => p.filter((_,j) => j !== i))}>✕</button>
                  </div>
                ))}
              </div>
            )}
            {refs.length < 6 && (
              <div className={`sp-drop${refDrag ? " drag" : ""}`} role="button"
                onClick={() => refFileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setRefDrag(true) }}
                onDragLeave={() => setRefDrag(false)}
                onDrop={handleRefDrop}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(232,255,0,0.35)" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span className="sp-drop-lbl">{refDrag ? "Release to add" : "Drop or click to upload"}</span>
              </div>
            )}
            {refs.length > 0 && <div className="sp-ref-count">{refs.length}/6 references</div>}
            <input ref={refFileRef} type="file" accept="image/*" multiple onChange={handleRefs} style={{ display:"none" }} />
          </div>
          <div className="sp-rule" />

          {/* ── AI Model ── */}
          <div className="sp-sec">
            <div className="sp-sec-lbl">
              <span className="sp-sec-lbl-txt">AI Model</span>
            </div>
            <div className="sp-models">
              {(["flash","pro"] as const).map(m => {
                const cost   = m === "flash" ? 1 : 3
                const active = model === m
                return (
                  <button key={m} className={`sp-model${active ? " on" : ""}`} onClick={() => setModel(m)}>
                    <div className="sp-model-name" style={{ color: active ? "#E8FF00" : "rgba(255,255,255,0.78)" }}>
                      {m === "flash" ? "Flash" : "Pro"}
                    </div>
                    <div className="sp-model-desc">{m === "flash" ? "High speed" : "Max quality"}</div>
                    <div className="sp-model-badge" style={{
                      borderColor: active ? "rgba(232,255,0,0.24)" : "rgba(255,255,255,0.09)",
                      background:  active ? "rgba(232,255,0,0.09)" : "rgba(255,255,255,0.03)",
                      color:       active ? "rgba(232,255,0,0.88)" : "rgba(255,255,255,0.38)",
                    }}>
                      {cost} cr{cost !== 1 ? "" : ""}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="sp-rule" />

          {/* ── Slides ── */}
          <div className="sp-sec" style={{ paddingBottom: 20 }}>
            <div className="sp-slide-top">
              <div>
                <div className="sp-sec-lbl" style={{ marginBottom:4 }}>
                  <span className="sp-sec-lbl-txt">Number of Slides</span>
                </div>
                <div className="sp-slide-sub">
                  {slides === 1 ? "Single image" : `Carousel · ${slides} slides`}
                </div>
              </div>
              <div className="sp-slide-num">{slides}</div>
            </div>
            <div className="sp-track">
              <div className="sp-track-fill" style={{ width:`${pct}%` }} />
              <div className="sp-track-thumb" style={{ left:`calc(${pct}% + ${(8-slides)*0.5}px)` }} />
              <input type="range" min={1} max={8} step={1} value={slides}
                onChange={e => setSlides(Number(e.target.value))} className="sp-range" />
            </div>
            <div className="sp-pips">
              {[1,2,3,4,5,6,7,8].map(n => (
                <span key={n} className={`sp-pip${slides===n?" on":""}`} onClick={() => setSlides(n)}>{n}</span>
              ))}
            </div>
          </div>

        </div>

        {/* ══ STICKY FOOTER — Generate ══ */}
        <div className="sp-foot">
          <div className="sp-cost">
            <span className="sp-cost-lbl">
              {isOrgMember ? "Org Access" : `${creditCost} cr × ${slides} slide${slides>1?"s":""}`}
            </span>
            <span className="sp-cost-val">
              {isOrgMember ? "Free" : `${totalCost} cr`}
            </span>
          </div>

          <button type="button" className="sp-gen btn-generate"
            disabled={!canGenerate}
            onClick={() => onGenerate({
              expertStyle:     expertStylePrompt,
              inputLayout:     layout,
              referenceStyles: refs,
              aspectRatio:     ratio,
              model, slides, notes,
            })}>
            {isGenerating && <span className="sp-spin" />}
            {isGenerating ? "Generating..." : `Generate${slides > 1 ? ` · ${slides} Slides` : ""}`}
          </button>

          {isCustom && !customPrompt.trim() && !isGenerating && (
            <p className="sp-warn">✦ Enter your custom style above</p>
          )}
          {!isOrgMember && credits < totalCost && !isGenerating && (
            <p className="sp-warn">⚡ {totalCost} cr needed · {credits} available</p>
          )}
        </div>

      </div>
    </>
  )
}