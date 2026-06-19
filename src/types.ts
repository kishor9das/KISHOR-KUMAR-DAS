export interface Account {
  id: string;
  platform: string;
  link: string;
  category: string;
  username: string;
  password: string;
  email: string;
  mobile: string;
  dateOfOpening: string;
  details: string;
  extraFields?: Record<string, string>; // Extra key-value pairs
}

export interface AuthState {
  user: any; // User object from Firebase
  accessToken: string | null;
  needsAuth: boolean;
  loading: boolean;
}

export const DEFAULT_CATEGORIES = [
  "সোশ্যাল মিডিয়া",
  "ব্যাংক",
  "মিক্স",
  "টুল",
  "বিনোদন",
  "শপিং",
  "ব্যক্তিগত"
];
