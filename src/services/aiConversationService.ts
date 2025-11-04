import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { Conversation, ConversationMessage } from './aiService';

export class AIConversationService {
  private static instance: AIConversationService;
  private readonly collectionName = 'ai_conversations';

  static getInstance(): AIConversationService {
    if (!AIConversationService.instance) {
      AIConversationService.instance = new AIConversationService();
    }
    return AIConversationService.instance;
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    try {
      const conversationData = {
        title: conversation.title,
        messages: conversation.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          relevantData: msg.relevantData || []
        })),
        createdAt: conversation.createdAt,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, this.collectionName, conversation.id), conversationData);
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw new Error('Failed to save conversation');
    }
  }

  async createConversation(conversation: Conversation): Promise<void> {
    try {
      const conversationData = {
        title: conversation.title,
        messages: conversation.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          relevantData: msg.relevantData || []
        })),
        createdAt: conversation.createdAt,
        updatedAt: new Date()
      };

      await addDoc(collection(db, this.collectionName), {
        ...conversationData,
        id: conversation.id
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }
  }

  async loadConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const docRef = doc(db, this.collectionName, conversationId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: conversationId,
          title: data.title,
          messages: data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toDate(),
            relevantData: msg.relevantData || []
          })),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        };
      }

      return null;
    } catch (error) {
      console.error('Error loading conversation:', error);
      return null;
    }
  }

  async loadAllConversations(): Promise<Conversation[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const conversations: Conversation[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          title: data.title,
          messages: data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toDate(),
            relevantData: msg.relevantData || []
          })),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        });
      });

      return conversations;
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Failed to delete conversation');
    }
  }

  async searchConversations(searchTerm: string): Promise<Conversation[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const conversations: Conversation[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const conversation = {
          id: doc.id,
          title: data.title,
          messages: data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toDate(),
            relevantData: msg.relevantData || []
          })),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        };

        // Search in title and messages
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = conversation.title.toLowerCase().includes(searchLower);
        const messageMatch = conversation.messages.some((msg: ConversationMessage) => 
          msg.content.toLowerCase().includes(searchLower)
        );

        if (titleMatch || messageMatch) {
          conversations.push(conversation);
        }
      });

      return conversations;
    } catch (error) {
      console.error('Error searching conversations:', error);
      return [];
    }
  }

  async getConversationCount(): Promise<number> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting conversation count:', error);
      return 0;
    }
  }

  async clearAllConversations(): Promise<void> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing conversations:', error);
      throw new Error('Failed to clear conversations');
    }
  }
}

export default AIConversationService.getInstance(); 