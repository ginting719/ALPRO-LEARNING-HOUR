

export interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'user';
}

export interface Question {
  id?: string;
  question_text: string;
  options: { text: string }[];
  correct_option_index: number;
  points: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  youtube_video_url: string;
  created_at: string;
  questions?: Question[];
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  module_id: string;
  score: number;
  completed_at: string;
  profiles: {
    full_name: string;
  };
  modules: {
    title: string;
  };
  attempt_number?: number;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  total_score: number;
}