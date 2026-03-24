export interface UserProfile {
  uid:                 string
  email:               string
  displayName:         string
  photoURL:            string
  credits:             number
  isOrgMember:         boolean
  totalGenerations:    number
  singleGenerations:   number
  carouselGenerations: number
  totalCreations:      number        // ← total images ever saved to Firestore
  lastGenerationAt:    string
  memberSince:         string
  styleUsage:          Record<string, number>
  creations:           Creation[]
}

export interface Creation {
  id:          string
  src:         string
  style:       string
  aspectRatio: string
  slides:      number
  createdAt:   string
  prompt?:     string
}

export interface GenerateRequest {
  expertStyle:      string
  inputLayout:      string | null
  referenceStyles:  string[]
  aspectRatio:      string
  model:            "flash" | "pro"
  slides:           number
  notes:            string
}

export type Tab = "setup" | "profile"