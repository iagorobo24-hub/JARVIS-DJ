export interface DJAnalysisInput {
  name: string;
  tier: number;
  followers: number;
  platform: string;
  recent_growth: number;
  metrics?: any;
}

export interface JARVISInsight {
  type: 'growth' | 'viral' | 'engagement' | 'strategy';
  label: string;
  description: string;
  recommendation: string;
  score: number;
}

export interface WeeklyMetrics {
  followers_gain: number;
  engagement_avg: number;
  top_posts: string[];
  competitor_comparison: string;
}

export interface DJSummary {
  id: string;
  name: string;
  tier: number;
  followers: number;
  platform: string;
}

export interface User {
  id: string;
  email: string;
  role: 'free' | 'artist' | 'pro' | 'label';
}
