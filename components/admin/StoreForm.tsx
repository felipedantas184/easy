'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { STORE_SLUG_REGEX, DEFAULT_STORE_THEME } from '@/lib/utils/constants';
import { Store, CreateStoreData } from '@/types/store';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { storeServiceNew } from '@/lib/firebase/store-service-new';
import { 
  ArrowLeft, 
  Store as StoreIcon, 
  Palette, 
  Contact,
  Phone,
  MessageCircle,
  Mail
} from 'lucide-react';

interface StoreFormProps {
  store?: Store;
  onSuccess?: () => void;
}

export function StoreForm({ store, onSuccess }: StoreFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    primaryColor: DEFAULT_STORE_THEME.primaryColor,
    secondaryColor: DEFAULT_STORE_THEME.secondaryColor,
    backgroundColor: DEFAULT_STORE_THEME.backgroundColor,
    contact: {
      phone: '',
      whatsapp: '',
      email: '',
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isAutoGeneratingSlug, setIsAutoGeneratingSlug] = useState(true);

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        slug: store.slug,
        description: store.description || '',
        primaryColor: store.theme.primaryColor,
        secondaryColor: store.theme.secondaryColor,
        backgroundColor: store.theme.backgroundColor,
        contact: {
          phone: store.contact.phone || '',
          whatsapp: store.contact.whatsapp || '',
          email: store.contact.email || '',
        }
      });
      setSlugAvailable(true);
      setIsAutoGeneratingSlug(false); // Não auto-gerar slug ao editar
    }
  }, [store]);

  // Função para gerar slug automaticamente - CORRIGIDA
  const generateSlug = (name: string) => {
    if (!name.trim()) return '';
    
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais, mantém espaços e hífens
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens consecutivos
      .replace(/^-+/, '') // Remove hífens do início
      .replace(/-+$/, ''); // Remove hífens do final
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome da loja é obrigatório');
      return false;
    }

    if (!formData.slug.trim()) {
      setError('Slug é obrigatório');
      return false;
    }

    if (!STORE_SLUG_REGEX.test(formData.slug)) {
      setError('Slug deve conter apenas letras minúsculas, números e hífens');
      return false;
    }

    if (slugAvailable === false) {
      setError('Este slug já está em uso');
      return false;
    }

    if (formData.description && formData.description.length > 500) {
      setError('Descrição muito longa (máx. 500 caracteres)');
      return false;
    }

    setError('');
    return true;
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || !STORE_SLUG_REGEX.test(slug)) {
      setSlugAvailable(null);
      return;
    }

    try {
      const available = await storeServiceNew.isSlugAvailable(slug);
      setSlugAvailable(available);
      
      if (error && available) {
        setError('');
      }
    } catch (error) {
      console.error('Erro ao verificar slug:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value
      }
    }));
  };

  const handleNameChange = (value: string) => {
    handleInputChange('name', value);
    
    // Auto-gerar slug apenas se estiver no modo de criação e o slug não foi modificado manualmente
    if (isAutoGeneratingSlug && !store) {
      const newSlug = generateSlug(value);
      handleInputChange('slug', newSlug);
      if (newSlug) {
        checkSlugAvailability(newSlug);
      }
    }
  };

  const handleSlugChange = (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    handleInputChange('slug', slug);
    
    // Quando o usuário começa a digitar manualmente no slug, para de auto-gerar
    if (isAutoGeneratingSlug && value) {
      setIsAutoGeneratingSlug(false);
    }
    
    if (slug !== store?.slug) {
      checkSlugAvailability(slug);
    } else {
      setSlugAvailable(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('Usuário não autenticado');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const storeData: CreateStoreData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
      };

      if (store) {
        // Editar loja existente
        await storeServiceNew.updateStore(store.id, {
          ...storeData,
          theme: {
            ...store.theme,
            primaryColor: formData.primaryColor,
            secondaryColor: formData.secondaryColor,
            backgroundColor: formData.backgroundColor,
          },
          contact: {
            ...store.contact,
            phone: formData.contact.phone,
            whatsapp: formData.contact.whatsapp,
            email: formData.contact.email,
          }
        });
        setSuccess('Loja atualizada com sucesso!');
      } else {
        // Criar nova loja
        const storeId = await storeServiceNew.createStore(storeData, user.id);
        setSuccess('Loja criada com sucesso! Redirecionando...');
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push('/dashboard/stores');
        }, 2000);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro ao salvar loja:', error);
      setError(error.message || 'Erro ao salvar loja. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {store ? 'Editar Loja' : 'Criar Nova Loja'}
          </h1>
          <p className="text-gray-600 mt-1">
            {store 
              ? 'Atualize as informações da sua loja' 
              : 'Configure sua nova loja virtual em poucos minutos'
            }
          </p>
        </div>
      </div>

      {/* Mensagens de status */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <StoreIcon size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Informações da Loja</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            Configure as informações básicas da sua loja virtual
          </p>

          <div className="space-y-4">
            {/* Nome da Loja */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nome da Loja *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Minha Loja Online"
                disabled={loading}
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium text-gray-700">
                URL da Loja *
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  easystore.com/
                </span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="minha-loja"
                  disabled={loading}
                  className="flex-1"
                  required
                />
              </div>
              {slugAvailable !== null && formData.slug && (
                <p className={`text-sm ${
                  slugAvailable ? 'text-green-600' : 'text-red-600'
                }`}>
                  {slugAvailable ? '✓ Slug disponível' : '✗ Slug indisponível'}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Use apenas letras minúsculas, números e hífens. Esta será a URL da sua loja.
              </p>
              {isAutoGeneratingSlug && !store && (
                <p className="text-sm text-blue-600">
                  ⓘ O slug está sendo gerado automaticamente. Edite se necessário.
                </p>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Descrição
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva brevemente sua loja..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                disabled={loading}
              />
              <p className="text-sm text-gray-500">
                {formData.description.length}/500 caracteres
              </p>
            </div>
          </div>
        </Card>

        {/* Cores da Loja - AGORA COM 3 CORES NOVAMENTE */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Cores da Marca</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            Personalize as cores da sua loja
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cor Primária */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Cor Primária
              </label>
              <div className="space-y-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  disabled={loading}
                  className="w-full h-10 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
                />
              </div>
            </div>

            {/* Cor Secundária */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Cor Secundária
              </label>
              <div className="space-y-2">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  disabled={loading}
                  className="w-full h-10 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
                />
              </div>
            </div>

            {/* Cor de Fundo */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Cor de Fundo
              </label>
              <div className="space-y-2">
                <input
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                  disabled={loading}
                  className="w-full h-10 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Preview do Tema */}
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">Preview do Tema</h4>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div 
                  className="h-6 rounded flex-1"
                  style={{ backgroundColor: formData.primaryColor }}
                ></div>
                <div 
                  className="h-6 rounded flex-1"
                  style={{ backgroundColor: formData.secondaryColor }}
                ></div>
                <div 
                  className="h-6 rounded flex-1 border border-gray-300"
                  style={{ backgroundColor: formData.backgroundColor }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Informações de Contato */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Contact size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Informações de Contato</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            Como seus clientes podem entrar em contato (opcional)
          </p>

          <div className="space-y-4">
            {/* Telefone */}
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone size={16} />
                Telefone
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.contact.phone}
                onChange={(e) => handleContactChange('phone', e.target.value)}
                disabled={loading}
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <label htmlFor="whatsapp" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MessageCircle size={16} />
                WhatsApp
              </label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.contact.whatsapp}
                onChange={(e) => handleContactChange('whatsapp', e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail size={16} />
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="contato@minhaloja.com"
                value={formData.contact.email}
                onChange={(e) => handleContactChange('email', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </Card>

        {/* Botões de Ação */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || slugAvailable === false}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{store ? 'Salvando...' : 'Criando Loja...'}</span>
              </div>
            ) : (
              store ? 'Salvar Alterações' : 'Criar Loja'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}