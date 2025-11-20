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
import { formatDocument, formatPhoneNumber } from '@/lib/utils/helpers';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    document: '', // CPF
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [documentValid, setDocumentValid] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { register } = useAuth();

  // Função para validar CPF
  const validateCPF = (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '');

    if (cleaned.length !== 11) return false;

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleaned)) return false;

    // Validar primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(9))) return false;

    // Validar segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(10))) return false;

    return true;
  };

  // Validações em tempo real
  useEffect(() => {
    // Validação de email
    if (formData.email) {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      setEmailValid(isValid);
    } else {
      setEmailValid(null);
    }

    // Validação de CPF
    if (formData.document) {
      const cleanedDocument = formData.document.replace(/\D/g, '');
      const isValid = validateCPF(cleanedDocument);
      setDocumentValid(isValid);
    } else {
      setDocumentValid(null);
    }

    // Força da senha
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 6) strength += 1;
      if (formData.password.length >= 8) strength += 1;
      if (/[A-Z]/.test(formData.password)) strength += 1;
      if (/[0-9]/.test(formData.password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.email, formData.document, formData.password]);

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 2) return 'Fraca';
    if (strength <= 3) return 'Média';
    return 'Forte';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validações
    if (!formData.acceptTerms) {
      setError('Você deve aceitar os termos de serviço');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!emailValid) {
      setError('Por favor, insira um email válido');
      return;
    }

    if (!documentValid) {
      setError('Por favor, insira um CPF válido');
      return;
    }

    setLoading(true);

    try {
      await register(
        formData.email,
        formData.password,
        formData.displayName,
        formData.document,
        formData.phone
      );
      setSuccess('Conta criada com sucesso! Verifique seu email.');
    } catch (error: any) {
      console.error('Erro no registro:', error);

      // Tratamento de erros específicos
      if (error.message === 'auth/email-already-in-use') {
        setError('Este email já está em uso');
      } else if (error.message === 'auth/document-already-in-use') {
        setError('Este CPF já está cadastrado');
      } else if (error.code === 'auth/invalid-email') {
        setError('Email inválido');
      } else if (error.code === 'auth/weak-password') {
        setError('Senha muito fraca. Use uma combinação de letras, números e símbolos.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Erro de conexão. Verifique sua internet.');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let formattedValue = value;

    // Formatação automática do telefone
    if (name === 'phone') {
      formattedValue = formatPhoneNumber(value);
    }

    // Formatação automática do CPF
    if (name === 'document') {
      formattedValue = formatDocument(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    if (error) setError('');
  };

  return (
    <Card className="w-full bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl text-center text-white">
          Criar sua conta
        </CardTitle>
        <p className="text-center text-white/60 text-sm">
          Comece sua jornada no e-commerce
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
          {/* Nome Completo */}
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium text-white">
              Nome Completo *
            </label>
            <Input
              id="displayName"
              name="displayName"
              placeholder="Como você gostaria de ser chamado"
              value={formData.displayName}
              onChange={handleChange}
              required
              disabled={loading}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          {/* CPF */}
          <div className="space-y-2">
            <label htmlFor="document" className="text-sm font-medium text-white">
              CPF *
            </label>
            <div className="relative">
              <Input
                id="document"
                name="document"
                placeholder="000.000.000-00"
                value={formData.document}
                onChange={handleChange}
                required
                disabled={loading}
                maxLength={14}
                className={`bg-white/5 border-white/20 text-white placeholder:text-white/40 ${documentValid === false ? 'border-red-500/50' : ''
                  } ${documentValid === true ? 'border-green-500/50' : ''
                  }`}
              />
              {documentValid === true && (
                <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-400" />
              )}
            </div>
            {documentValid === false && (
              <p className="text-red-400 text-xs">Por favor, insira um CPF válido</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-white">
              Email *
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
                className={`bg-white/5 border-white/20 text-white placeholder:text-white/40 ${emailValid === false ? 'border-red-500/50' : ''
                  } ${emailValid === true ? 'border-green-500/50' : ''
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

          {/* Telefone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-white">
              Telefone (Opcional)
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-white">
              Senha *
            </label>
            <PasswordInput
              id="password"
              name="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
            />

            {/* Indicador de força da senha */}
            {formData.password && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Força da senha:</span>
                  <span className={`font-medium ${passwordStrength <= 2 ? 'text-red-400' :
                      passwordStrength <= 3 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                    {getPasswordStrengthText(passwordStrength)}
                  </span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded-full transition-all ${index <= passwordStrength
                          ? getPasswordStrengthColor(passwordStrength)
                          : 'bg-white/20'
                        }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-white">
              Confirmar Senha *
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Digite a senha novamente"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              className={`bg-white/5 border-white/20 text-white placeholder:text-white/40 ${formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? 'border-red-500/50'
                  : formData.confirmPassword && formData.password === formData.confirmPassword
                    ? 'border-green-500/50'
                    : ''
                }`}
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-red-400 text-xs">As senhas não coincidem</p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="text-green-400 text-xs">Senhas coincidem!</p>
            )}
          </div>

          {/* Termos e Condições */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
              className="w-4 h-4 mt-1 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500 flex-shrink-0"
              required
            />
            <label htmlFor="acceptTerms" className="text-sm text-white/80">
              Aceito os{' '}
              <Link href="/terms" className="text-white hover:underline">
                Termos de Serviço
              </Link>{' '}
              e{' '}
              <Link href="/privacy" className="text-white hover:underline">
                Política de Privacidade
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-white text-slate-900 hover:bg-white/90 transition-all duration-200 font-semibold py-2.5"
            disabled={
              loading ||
              !formData.displayName ||
              !formData.document ||
              !formData.email ||
              !formData.password ||
              !formData.confirmPassword ||
              !formData.acceptTerms ||
              formData.password !== formData.confirmPassword ||
              !emailValid ||
              !documentValid
            }
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Criando conta...</span>
              </div>
            ) : (
              'Criar minha conta'
            )}
          </Button>
        </form>

        {/* Login Link */}
        <div className="text-center pt-4 border-t border-white/10">
          <p className="text-white/60 text-sm">
            Já tem uma conta?{' '}
            <Link
              href="/login"
              className="text-white font-semibold hover:text-white/80 transition-colors"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}