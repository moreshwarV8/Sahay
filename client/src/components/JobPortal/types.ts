export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  skills_required: string;
  experience_required: string;
  date_posted: string;
  url: string;
  keywords?: string[];
  application_deadline?: string;
  job_type?: string;
  salary_range?: string;
  isBookmarked?: boolean;
  // New properties for matching:
  match_percentage?: number;
  best_resume?: {
    id: string;
    name: string;
  };
  improvement_suggestions?: string;
}

export interface Resume {
  id: string;
  name: string;
  file: File;
  url: string;
  uploadDate: string;
  text?: string;  // New: Stores the extracted text from the resume for matching
  score?: number;
  categoryScores?: Record<string, number>;
  feedback?: Record<string, string>;
  recommendations?: string[];
  scoreLoading: boolean;
}

export interface Profile {
  id: string; // Changed from number to string for consistency with usage.
  fullName: string;
  email: string;
  phone: string;
  skills: string;
  experience: string;
  education: string;
  interests: string;
  resumes: Resume[];
  preferredLocation?: string;
  jobTitle?: string;
  bio?: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  notificationPreferences: {
    email: boolean;
    jobAlerts: boolean;
    applicationUpdates: boolean;
    newMatchingJobs: boolean;
  };
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: "job_match" | "application_update" | "system" | "deadline";
  relatedJobId?: number;
}

export interface Application {
  id: number;
  jobId: number;
  date: string;
  status: "applied" | "screening" | "interviewing" | "rejected" | "offered";
  notes: string;
}

export interface UserStats {
  applicationsSubmitted: number;
  bookmarkedJobs: number;
  profileViews: number;
  matchScore: number;
}

export interface Education {
  degree: string;
  field: string;
  university: string;
  year: string;
}
