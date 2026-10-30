export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant' | 'moderator';
  content: string;
  createdAt: Date;
  moderated?: boolean;
}

export const createChatMessage = (input: Partial<ChatMessage> = {}): ChatMessage => ({
  id: input.id ?? 'msg_001',
  conversationId: input.conversationId ?? 'conversation_001',
  sender: input.sender ?? 'user',
  content: input.content ?? 'Mensagem inicial.',
  createdAt: input.createdAt ?? new Date(),
  moderated: input.moderated ?? false,
});
