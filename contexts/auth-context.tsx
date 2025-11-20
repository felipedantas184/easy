'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { User as UserType } from '@/types/user';
import { UserService } from '@/lib/firebase/user-service';

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, document: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Buscar dados completos do Firestore
          const userData = await UserService.getUser(firebaseUser.uid);

          if (userData) {
            setUser(userData);
          } else {
            // ✅ CORREÇÃO: Apenas log, não faz logout
            console.log('Usuário auth existe, mas documento Firestore ainda não foi criado/sincronizado');
            // Não seta user, mas também não faz logout
            // O documento será criado em breve pelo processo de registro
            setUser(null);
          }
        } catch (error) {
          console.error('Erro ao carregar usuário:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
    document: string,
    phone?: string
  ) => {
    setLoading(true);
    try {
      // Verificar se email já existe
      const emailExists = await UserService.checkEmailExists(email);
      if (emailExists) {
        throw new Error('auth/email-already-in-use');
      }

      // Verificar se CPF já existe
      const documentExists = await UserService.checkDocumentExists(document);
      if (documentExists) {
        throw new Error('auth/document-already-in-use');
      }

      // Criar usuário no Firebase Auth
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Atualizar perfil no Auth
      await updateProfile(firebaseUser, { displayName });

      // ✅ CORRIGIDO: Criar documento no Firestore (sem password)
      await UserService.createUser(firebaseUser.uid, {
        email,
        displayName,
        document: document.replace(/\D/g, ''), // Salvar apenas números
        phone,
        role: 'customer'
      });

      // Enviar email de verificação
      await sendEmailVerification(firebaseUser);

      router.push('/dashboard/stores/new');
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      sendVerificationEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};