import type { Timestamp } from 'firebase/firestore';

export type ArticleState = 'new' | 'skipped' | 'saved';

export interface Article {
  id: string;
  title: string;
  link: string;
  source: string;
  aiSummary: string;
  angles: string[];
  score: number;
  pubDate: string;
  createdAt: Timestamp;
  state: ArticleState;
  fullText: string;
  translation: string;
}

export interface Material {
  id: string;
  articleId: string;
  title: string;
  link: string;
  source: string;
  originalText: string;
  translation: string;
  tags: string[];
  note: string;
  createdAt: Timestamp;
  usedInSessions: string[];
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type SessionStatus = 'writing' | 'done';

export interface Session {
  id: string;
  title: string;
  materialIds: string[];
  messages: ChatMessage[];
  finalDraft: string;
  fbPost: string;
  status: SessionStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AppConfig {
  translatorInstructions: string;
  blogInstructions: string;
  fetchWebhookUrl: string;
}
