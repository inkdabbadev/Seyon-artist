import {
  doc, getDoc, setDoc, updateDoc,
  arrayUnion, increment
} from "firebase/firestore"
import { db } from "./firebase"
import type { UserProfile, Creation } from "@/types"

// ── Credit config ─────────────────────────────────────────────────────────────
// To give a user unlimited credits:
//   Firebase Console → Firestore → users/{uid} → set isOrgMember: true
//
// To top up a user's credits after payment:
//   Firebase Console → Firestore → users/{uid} → edit credits field
//
// No code changes ever needed.
const NEW_USER_CREDITS = 25

// ─────────────────────────────────────────────────────────────────────────────

/** Fills every field with a safe default so nothing is ever undefined */
function withDefaults(data: Record<string, any>, uid: string): UserProfile {
  return {
    uid:                 data.uid                 ?? uid,
    email:               data.email               ?? "",
    displayName:         data.displayName         ?? (data.email ?? "").split("@")[0] ?? "User",
    photoURL:            data.photoURL            ?? "",
    credits:             data.credits             ?? NEW_USER_CREDITS,
    isOrgMember:         data.isOrgMember         ?? false,
    totalGenerations:    data.totalGenerations    ?? 0,
    singleGenerations:   data.singleGenerations   ?? 0,
    carouselGenerations: data.carouselGenerations ?? 0,
    totalCreations:      data.totalCreations      ?? 0,   // ← new
    lastGenerationAt:    data.lastGenerationAt    ?? "",
    memberSince:         data.memberSince         ?? "",
    styleUsage:          data.styleUsage          ?? {},
    creations:           data.creations           ?? [],
  }
}

// ── Get or create user ────────────────────────────────────────────────────────
// Called on every sign-in.
// New users always start with 25 free credits and isOrgMember: false.
// Org status is only ever changed manually in the Firebase console.
export async function getOrCreateUser(
  uid:         string,
  email:       string,
  displayName: string,
  photoURL:    string
): Promise<UserProfile> {
  const ref  = doc(db, "users", uid)
  const snap = await getDoc(ref)

  // Existing user — return as-is, trust whatever is in Firestore
  if (snap.exists()) {
    return withDefaults(snap.data(), uid)
  }

  // New user — create with 25 free credits, never org by default
  const profile: UserProfile = withDefaults({
    uid,
    email,
    displayName: displayName || email.split("@")[0],
    photoURL,
    credits:        NEW_USER_CREDITS,
    isOrgMember:    false,
    totalCreations: 0,
    memberSince: new Date().toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    }),
  }, uid)

  await setDoc(ref, profile)
  return profile
}

// ── Fetch user ────────────────────────────────────────────────────────────────
export async function fetchUser(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid))
  if (!snap.exists()) return null
  return withDefaults(snap.data(), uid)
}

// ── Deduct credits ────────────────────────────────────────────────────────────
// Org members (isOrgMember: true in Firestore) are never deducted.
// Returns false if user doesn't have enough credits.
export async function deductCredits(
  uid:       string,
  amount:    number,
  orgMember: boolean
): Promise<boolean> {
  if (orgMember) return true

  const snap = await getDoc(doc(db, "users", uid))
  if (!snap.exists()) return false

  const current = (snap.data().credits ?? 0) as number
  if (current < amount) return false

  await updateDoc(doc(db, "users", uid), { credits: increment(-amount) })
  return true
}

// ── Refund credits (called on generation failure) ─────────────────────────────
export async function refundCredits(
  uid:       string,
  amount:    number,
  orgMember: boolean
): Promise<void> {
  if (orgMember) return
  await updateDoc(doc(db, "users", uid), { credits: increment(amount) })
}

// ── Save creation + update all counters ───────────────────────────────────────
export async function saveCreation(
  uid:        string,
  creation:   Creation,
  style:      string,
  isCarousel: boolean
): Promise<void> {
  const updates: Record<string, any> = {
    totalGenerations:        increment(1),
    totalCreations:          increment(1),   // ← new: persisted creation count
    lastGenerationAt:        new Date().toLocaleString("en-IN", {
      day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit",
    }),
    creations:               arrayUnion(creation),
    [`styleUsage.${style}`]: increment(1),
  }

  if (isCarousel) updates.carouselGenerations = increment(1)
  else            updates.singleGenerations   = increment(1)

  await updateDoc(doc(db, "users", uid), updates)
}

// ── Add credits ───────────────────────────────────────────────────────────────
// You can call this from a protected admin API route,
// OR just edit the credits field directly in Firebase console.
export async function addCredits(uid: string, amount: number): Promise<void> {
  await updateDoc(doc(db, "users", uid), { credits: increment(amount) })
}