export interface Mentor {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  expertise: string[];
  isVerified: boolean;
  isAvailable: boolean;
  rating: number;       // 1–5
  totalSessions: number;
  bio?: string;
}
