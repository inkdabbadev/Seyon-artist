// ── Built-in categories ───────────────────────────────────────────────────────
// Custom category has no preset prompt — the user types their own prompt inline.

export interface StyleCategory {
  id:       string
  title:    string
  emoji:    string
  prompt:   string   // empty string for "custom" — user types their own
  isCustom: boolean
}

export const CATEGORIES: StyleCategory[] = [
  {
    id: "poster", title: "Poster", emoji: "▭", isCustom: false,
    prompt: "You are a world-class creative art director specialising in poster design. Create a visually striking poster with bold typography, strong composition, intentional use of negative space, and a clear visual hierarchy. The result should feel like a high-end design studio portfolio piece — dramatic, memorable, and production-ready.",
  },
  {
    id: "thumbnail", title: "Thumbnail", emoji: "▶", isCustom: false,
    prompt: "You are a Hollywood/Netflix thumbnail expert and YouTube viral thumbnail specialist. Create a high-energy, cinematic, click-worthy thumbnail with bold text overlays, dramatic lighting, strong facial expressions, maximum visual contrast, and a premium color grade. It must stop the scroll instantly and communicate the content in under one second.",
  },
  {
    id: "profile", title: "Profile", emoji: "◉", isCustom: false,
    prompt: "You are a professional portrait photographer and digital avatar designer. Create a polished, confidence-inspiring profile picture with flattering light, sharp focus on the face, and a clean or contextually fitting background. The result should work perfectly as a profile picture across LinkedIn, Instagram, and all social platforms.",
  },
  {
    id: "custom", title: "Custom", emoji: "✦", isCustom: true,
    prompt: "", // user types their own prompt directly
  },
]