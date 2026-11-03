
export interface IChatMessageEntity {
  messageId: string
  conversationId: string
  senderId: string
  originalContent: string
  sanitizedContent: string
  isBlockedByAi: boolean
  matchedViolations: string[]
  flaggedAsSuspicious: boolean
  createdAt: string
}

export class ChatMessage {
  private static messagesStore = new Map<string, IChatMessageEntity>()

  static create(data: Omit<IChatMessageEntity, 'createdAt'>): IChatMessageEntity {
    const message: IChatMessageEntity = {
      ...data,
      createdAt: new Date().toISOString()
    }
    this.messagesStore.set(message.messageId, message)
    return message
  }

  static findById(messageId: string): IChatMessageEntity | undefined {
    return this.messagesStore.get(messageId)
  }

  static listByConversation(conversationId: string): IChatMessageEntity[] {
    const results: IChatMessageEntity[] = []
    for (const msg of this.messagesStore.values()) {
      if (msg.conversationId === conversationId) {
        results.push(msg)
      }
    }
    return results
  }
}