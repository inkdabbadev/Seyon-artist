import { create } from "zustand"
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
  sendPasswordResetEmail,
} from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"
import { getOrCreateUser, fetchUser } from "@/lib/userService"
import type { UserProfile } from "@/types"

interface AuthStore {
  firebaseUser: User | null
  profile: UserProfile | null
  loading: boolean
  authError: string | null

  init: () => () => void
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>

  resetPassword: (email: string) => Promise<void>

  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  setProfile: (p: UserProfile) => void
  clearError: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  firebaseUser: null,
  profile: null,
  loading: true,
  authError: null,

  init: () => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        set({ firebaseUser: user, loading: true })
        try {
          const profile = await getOrCreateUser(
            user.uid,
            user.email!,
            user.displayName ?? "",
            user.photoURL ?? ""
          )
          set({ profile, loading: false })
        } catch {
          set({ loading: false })
        }
      } else {
        set({ firebaseUser: null, profile: null, loading: false })
      }
    })
    return unsub
  },

  signInWithGoogle: async () => {
    set({ authError: null })
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const profile = await getOrCreateUser(
        result.user.uid,
        result.user.email!,
        result.user.displayName ?? "",
        result.user.photoURL ?? ""
      )
      set({ firebaseUser: result.user, profile })
    } catch (e: any) {
      set({ authError: e?.message ?? "Sign in failed" })
    }
  },

  signInWithEmail: async (email, password) => {
    set({ authError: null })
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const profile = await getOrCreateUser(
        result.user.uid,
        result.user.email!,
        result.user.displayName ?? "",
        ""
      )
      set({ firebaseUser: result.user, profile })
    } catch (e: any) {
      const msg =
        e?.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : e?.code === "auth/user-not-found"
            ? "No account found with this email."
            : e?.message ?? "Sign in failed"
      set({ authError: msg })
    }
  },

  signUpWithEmail: async (email, password, name) => {
    set({ authError: null })
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: name })
      const profile = await getOrCreateUser(result.user.uid, result.user.email!, name, "")
      set({ firebaseUser: result.user, profile })
    } catch (e: any) {
      const msg =
        e?.code === "auth/email-already-in-use"
          ? "An account with this email already exists."
          : e?.code === "auth/weak-password"
            ? "Password must be at least 6 characters."
            : e?.message ?? "Sign up failed"
      set({ authError: msg })
    }
  },

  // ✅ Default Firebase reset page (no continueUrl)
  resetPassword: async (email: string) => {
    set({ authError: null })
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (e: any) {
      const msg =
        e?.code === "auth/invalid-email"
          ? "Please enter a valid email address."
          : e?.code === "auth/user-not-found"
            ? "No account found with this email."
            : e?.code === "auth/too-many-requests"
              ? "Too many attempts. Please try again later."
              : e?.message ?? "Failed to send reset email."
      set({ authError: msg })
    }
  },

  logout: async () => {
    await signOut(auth)
    set({ firebaseUser: null, profile: null })
  },

  refreshProfile: async () => {
    const { firebaseUser } = get()
    if (!firebaseUser) return
    const profile = await fetchUser(firebaseUser.uid)
    if (profile) set({ profile })
  },

  setProfile: (profile) => set({ profile }),
  clearError: () => set({ authError: null }),
}))