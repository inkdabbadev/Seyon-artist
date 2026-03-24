# Art Director AI — Setup Guide

## Stack
- **Next.js 15** (App Router)
- **Firebase** (Auth + Firestore)
- **Gemini AI** (Image generation)
- **Zustand** (State management)
- **Framer Motion** (Animations)
- **Tailwind CSS 4**

---

## 1. Firebase Setup (5 minutes)

### Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click **Add project** → name it "art-director-ai"
3. Disable Google Analytics (optional) → Create project

### Enable Authentication
1. Left sidebar → **Build → Authentication**
2. Click **Get started**
3. Enable **Google** provider → add your support email → Save
4. Enable **Email/Password** provider → Save

### Create Firestore Database
1. Left sidebar → **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Select a region close to your users → Done

### Firestore Security Rules
In Firestore → **Rules** tab, paste:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
Click **Publish**.

### Get Firebase Config
1. Project Settings (gear icon) → **General** tab
2. Scroll to **Your apps** → click **Web** icon (</>)
3. Register app name → Copy the config object

---

## 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

Paste your Firebase config values + Gemini API key.

---

## 3. Org Member Access (Free Unlimited Credits)

Open `lib/userService.ts` and edit:

```typescript
const ORG_EMAILS: string[] = [
  "rahul@yourcompany.com",      // specific people
  "admin@yourcompany.com",
]

const ORG_DOMAINS: string[] = [
  "yourcompany.com",            // entire domain = unlimited
]
```

Anyone signing in with these emails/domains gets **unlimited credits automatically**.

---

## 4. Install & Run

```bash
npm install
npm run dev
```

---

## 5. Credit System

| User type | Credits on signup | Behavior |
|-----------|------------------|---------|
| New user | 10 free credits | Deducted per generation |
| Org member | Unlimited | Never deducted |

**Flash model** = 5 credits/generation (higher quality)  
**Pro model** = 1 credit/generation (faster)

Credits are stored in Firestore and deducted server-side (in `userService.ts`).

---

## 6. Production Deployment (Vercel)

```bash
npm run build
```

In Vercel dashboard → Environment Variables → add all `.env.local` keys.

---

## Folder Structure

```
app/
├── api/generate/route.ts     ← Gemini API endpoint
├── studio/page.tsx           ← Main studio (auth-guarded)
├── page.tsx                  ← Landing page
├── layout.tsx
├── globals.css
└── Loader.tsx

components/
├── auth/
│   ├── AuthModal.tsx         ← Sign in / Sign up modal
│   └── CreditsModal.tsx      ← Buy credits modal
└── studio/
    ├── StudioNav.tsx         ← Header with credits/user
    ├── SetupPanel.tsx        ← All setup controls
    ├── CanvasPanel.tsx       ← Output canvas
    └── ProfilePanel.tsx      ← User profile + creations

lib/
├── firebase.ts               ← Firebase init
└── userService.ts            ← Firestore operations

store/
└── authStore.ts              ← Zustand auth state

types/
└── index.ts                  ← TypeScript types
```