import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from './config';
import { User, CreateUserData } from '@/types/user';

export class UserService {
  private static readonly COLLECTION = 'users';

  // ✅ CORRIGIDO: Parâmetro agora compatível com CreateUserData
  static async createUser(userId: string, userData: CreateUserData): Promise<User> {
    const userDoc = doc(db, this.COLLECTION, userId);
    
    const user: User = {
      id: userId,
      email: userData.email.toLowerCase(),
      role: userData.role || 'customer',
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: false,
      profile: {
        displayName: userData.displayName,
        document: userData.document, // CPF obrigatório
        phone: userData.phone,
      },
      preferences: {
        emailMarketing: true,
        smsNotifications: false,
        theme: 'system',
        language: 'pt-BR'
      }
    };

    await setDoc(userDoc, user);
    return user;
  }

  // Buscar usuário por ID
  static async getUser(userId: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, this.COLLECTION, userId));
    return userDoc.exists() ? (userDoc.data() as User) : null;
  }

  // Verificar se email já existe
  static async checkEmailExists(email: string): Promise<boolean> {
    const q = query(
      collection(db, this.COLLECTION),
      where('email', '==', email.toLowerCase())
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  // Verificar se CPF já existe
  static async checkDocumentExists(document: string): Promise<boolean> {
    const cleanedDocument = document.replace(/\D/g, '');
    const q = query(
      collection(db, this.COLLECTION),
      where('profile.document', '==', cleanedDocument)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  // Atualizar perfil do usuário
  static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const userDoc = doc(db, this.COLLECTION, userId);
    await updateDoc(userDoc, {
      ...updates,
      updatedAt: new Date()
    });
  }

  // Buscar usuário por CPF
  static async getUserByDocument(document: string): Promise<User | null> {
    const cleanedDocument = document.replace(/\D/g, '');
    const q = query(
      collection(db, this.COLLECTION),
      where('profile.document', '==', cleanedDocument)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    
    return querySnapshot.docs[0].data() as User;
  }
}