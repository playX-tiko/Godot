export interface ProjectFile {
  name: string;
  content: string;
  path: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
