// shared/types/communication.ts

export interface Message {
  id: string;
  senderId: string;
  recipientId: string; // Can be a userId or a groupId
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: string[]; // URLs or IDs of attachments
  type?: 'text' | 'image' | 'video' | 'audio' | 'file';
}

export interface Call {
  id: string;
  participants: string[]; // Array of user IDs
  startTime: Date;
  endTime: Date | null;
  status: 'ringing' | 'active' | 'ended' | 'missed';
  type?: 'audio' | 'video';
  aiAssisted?: boolean; // e.g., for real-time translation, noise cancellation
}

export interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string;
  content: string;
  timestamp: Date;
  likes: number;
  comments: Comment[];
  attachments?: string[];
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  timestamp: Date;
}

export interface SocialMediaPost {
  id: string;
  platform: string; // e.g., 'twitter', 'facebook'
  authorId: string;
  content: string;
  timestamp: Date;
  externalUrl?: string;
  likes?: number;
  reposts?: number;
  comments?: number;
}