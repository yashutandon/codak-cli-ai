export interface Message {
  id: string;
  role: string;
  title: string;
  content: string;
  status: string;
  part: null;
  mode: string;
  model: string;
  duration: null;
  createdAt: string;
  sessionId: string;
}

export interface Session {
  id: string;
  title: string;
  cwd: string | null;
  userId: string;
  createdAt: string;
  messages: Message[];
}

export interface CreateSessionPayload {
  title: string;
  cwd?: string;
  intialMessage?: {
    role: string;
    content: string;
    mode: string;
    model: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}