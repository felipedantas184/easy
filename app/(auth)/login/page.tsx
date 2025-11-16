'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const { login } = useAuth();

  // Validação de email em tempo real
  useEffect(() => {
    if (formData.email) {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      setEmailValid(isValid);
    } else {
      setEmailValid(null);
    }
  }, [formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validação final
    if (!emailValid) {
      setError('Por favor, insira um email válido');
      setLoading(false);
      return;
    }

    try {
      await login(formData.email, formData.password);
      setSuccess('Login realizado com sucesso! Redirecionando...');
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      // Tratamento de erros específicos do Firebase
      if (error.code === 'auth/invalid-credential') {
        setError('Email ou senha incorretos');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else if (error.code === 'auth/user-not-found') {
        setError('Nenhuma conta encontrada com este email.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Erro de conexão. Verifique sua internet.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Limpa erros quando o usuário começa a digitar
    if (error) setError('');
  };

  return (
    <Card className="w-full bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl text-center text-white">
          Bem-vindo de volta
        </CardTitle>
        <p className="text-center text-white/60 text-sm">
          Entre na sua conta para continuar
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Alertas */}
        {error && (
          <div className="flex items-center space-x-2 bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 text-green-200 px-4 py-3 rounded-lg text-sm">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-white">
              Email
            </label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className={`bg-white/5 border-white/20 text-white placeholder:text-white/40 ${
                  emailValid === false ? 'border-red-500/50' : ''
                } ${
                  emailValid === true ? 'border-green-500/50' : ''
                }`}
              />
              {emailValid === true && (
                <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-400" />
              )}
            </div>
            {emailValid === false && (
              <p className="text-red-400 text-xs">Por favor, insira um email válido</p>
            )}
          </div>
          
          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-sm font-medium text-white">
                Senha
              </label>
              <Link 
                href="/forgot-password" 
                className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              placeholder="Sua senha"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-white text-slate-900 hover:bg-white/90 transition-all duration-200 font-semibold py-2.5"
            disabled={loading || !formData.email || !formData.password}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Entrando...</span>
              </div>
            ) : (
              'Entrar na plataforma'
            )}
          </Button>
        </form>

        {/* Signup Link */}
        <div className="text-center pt-4 border-t border-white/10">
          <p className="text-white/60 text-sm">
            Não tem uma conta?{' '}
            <Link 
              href="/register" 
              className="text-white font-semibold hover:text-white/80 transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}