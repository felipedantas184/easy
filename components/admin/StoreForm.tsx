'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { STORE_SLUG_REGEX, DEFAULT_STORE_THEME } from '@/lib/utils/constants';
import { Store, CreateStoreData, StoreAddress } from '@/types/store';
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
  Mail,
  MapPin,
  Upload,
  FileText,
  Building
} from 'lucide-react';
import { LogoUpload } from './LogoUpload';

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
    document: '', // ✅ NOVO: CNPJ
    logo: '', // ✅ NOVO: URL da logo
    primaryColor: DEFAULT_STORE_THEME.primaryColor,
    secondaryColor: DEFAULT_STORE_THEME.secondaryColor,
    backgroundColor: DEFAULT_STORE_THEME.backgroundColor,
    contact: {
      phone: '',
      whatsapp: '',
      email: '',
      address: {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
      } as StoreAddress
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
        document: store.document || '', // ✅ NOVO
        logo: store.theme.logo || '', // ✅ NOVO
        primaryColor: store.theme.primaryColor,
        secondaryColor: store.theme.secondaryColor,
        backgroundColor: store.theme.backgroundColor,
        contact: {
          phone: store.contact.phone || '',
          whatsapp: store.contact.whatsapp || '',
          email: store.contact.email || '',
          address: store.contact.address || { // ✅ NOVO
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: '',
          }
        }
      });
      setSlugAvailable(true);
      setIsAutoGeneratingSlug(false);
    }
  }, [store]);

  // ✅ NOVO: Função para validar CNPJ
  const validateCNPJ = (cnpj: string): boolean => {
    const cleaned = cnpj.replace(/\D/g, '');

    if (cleaned.length !== 14) return false;

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleaned)) return false;

    // Validar primeiro dígito verificador
    let length = 12;
    let numbers = cleaned.substring(0, length);
    let digits = cleaned.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    // Validar segundo dígito verificador
    length = 13;
    numbers = cleaned.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  };

  // ✅ NOVO: Formatar CNPJ enquanto digita
  const formatDocument = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 5) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
    } else if (cleaned.length <= 8) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
    } else if (cleaned.length <= 12) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
    } else {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
    }
  };

  // ✅ NOVO: Buscar endereço pelo CEP
  const fetchAddressByCEP = async (cep: string) => {
    try {
      const cleanedCEP = cep.replace(/\D/g, '');

      if (cleanedCEP.length !== 8) return;

      const response = await fetch(`https://viacep.com.br/ws/${cleanedCEP}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          contact: {
            ...prev.contact,
            address: {
              ...prev.contact.address,
              street: data.logradouro || '',
              neighborhood: data.bairro || '',
              city: data.localidade || '',
              state: data.uf || '',
              zipCode: cep,
            }
          }
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const generateSlug = (name: string) => {
    if (!name.trim()) return '';

    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
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

    // ✅ NOVO: Validação de CNPJ
    if (formData.document && !validateCNPJ(formData.document)) {
      setError('CNPJ inválido');
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

  // ✅ NOVO: Manipular mudanças no endereço
  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        address: {
          ...prev.contact.address,
          [field]: value
        }
      }
    }));

    // Buscar endereço automaticamente quando CEP estiver completo
    if (field === 'zipCode' && value.replace(/\D/g, '').length === 8) {
      fetchAddressByCEP(value);
    }
  };

  const handleNameChange = (value: string) => {
    handleInputChange('name', value);

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

    if (isAutoGeneratingSlug && value) {
      setIsAutoGeneratingSlug(false);
    }

    if (slug !== store?.slug) {
      checkSlugAvailability(slug);
    } else {
      setSlugAvailable(true);
    }
  };

  // ✅ NOVO: Manipular mudança do CNPJ com formatação
  const handleDocumentChange = (value: string) => {
    const formatted = formatDocument(value);
    handleInputChange('document', formatted);
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
        document: formData.document ? formData.document.replace(/\D/g, '') : undefined, // ✅ NOVO
        logo: formData.logo || undefined, // ✅ NOVO
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        contact: { // ✅ NOVO: Incluir contato inicial
          email: formData.contact.email,
          phone: formData.contact.phone || undefined,
          whatsapp: formData.contact.whatsapp || undefined,
          address: formData.contact.address.street ? formData.contact.address : undefined
        }
      };

      if (store) {
        await storeServiceNew.updateStore(store.id, {
          ...storeData,
          theme: {
            ...store.theme,
            primaryColor: formData.primaryColor,
            secondaryColor: formData.secondaryColor,
            backgroundColor: formData.backgroundColor,
            logo: formData.logo || undefined,
          },
          contact: {
            ...store.contact,
            phone: formData.contact.phone,
            whatsapp: formData.contact.whatsapp,
            email: formData.contact.email,
            address: formData.contact.address.street ? formData.contact.address : undefined
          },
          document: formData.document ? formData.document.replace(/\D/g, '') : undefined // ✅ NOVO
        });
        setSuccess('Loja atualizada com sucesso!');
      } else {
        const storeId = await storeServiceNew.createStore(storeData, user.id);
        setSuccess('Loja criada com sucesso! Redirecionando...');

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
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 p-2"
        >
          <ArrowLeft size={18} />
          <span className="sr-only lg:not-sr-only lg:inline">Voltar</span>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
            {store ? 'Editar Loja' : 'Nova Loja'}
          </h1>
          <p className="text-gray-600 text-sm lg:text-base mt-1 truncate">
            {store ? 'Atualize as informações' : 'Configure sua loja virtual'}
          </p>
        </div>
      </div>

      {/* Mensagens de status */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 lg:p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 lg:p-4">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
        {/* Informações Básicas */}
        <Card className="p-4 lg:p-6">
          <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
            <StoreIcon size={18} className="text-blue-600 flex-shrink-0" />
            <h2 className="text-base lg:text-lg font-semibold text-gray-900">Informações da Loja</h2>
          </div>

          <p className="text-gray-600 text-sm lg:text-base mb-4 lg:mb-6">
            Configure as informações básicas
          </p>

          <div className="space-y-3 lg:space-y-4">
            {/* Nome da Loja */}
            <div className="space-y-1 lg:space-y-2">
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
                className="text-sm lg:text-base"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1 lg:space-y-2">
              <label htmlFor="slug" className="text-sm font-medium text-gray-700">
                URL da Loja *
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
                  easystore.com/
                </span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="minha-loja"
                  disabled={loading}
                  className="flex-1 text-sm lg:text-base"
                  required
                />
              </div>
              {slugAvailable !== null && formData.slug && (
                <p className={`text-xs lg:text-sm ${slugAvailable ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {slugAvailable ? '✓ Slug disponível' : '✗ Slug indisponível'}
                </p>
              )}
              <p className="text-xs lg:text-sm text-gray-500">
                Use letras minúsculas, números e hífens
              </p>
            </div>

            {/* ✅ NOVO: CNPJ */}
            <div className="space-y-1 lg:space-y-2">
              <label htmlFor="document" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText size={14} className="flex-shrink-0" />
                CNPJ (Opcional)
              </label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) => handleDocumentChange(e.target.value)}
                placeholder="00.000.000/0000-00"
                disabled={loading}
                maxLength={18}
                className="text-sm lg:text-base"
              />
              <p className="text-xs lg:text-sm text-gray-500">
                Para lojas com CNPJ - útil para emissão de notas fiscais
              </p>
            </div>

            {/* Descrição */}
            <div className="space-y-1 lg:space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Descrição
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva brevemente sua loja..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-sm lg:text-base"
                disabled={loading}
              />
              <p className="text-xs lg:text-sm text-gray-500">
                {formData.description.length}/500 caracteres
              </p>
            </div>
          </div>
        </Card>

        {/* ✅ NOVO: Logo da Loja */}
        <Card className="p-4 lg:p-6">
          <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
            <Building size={18} className="text-blue-600 flex-shrink-0" />
            <h2 className="text-base lg:text-lg font-semibold text-gray-900">Logo da Loja</h2>
          </div>

          <p className="text-gray-600 text-sm lg:text-base mb-4 lg:mb-6">
            Adicione a logo da sua marca (opcional)
          </p>

          <LogoUpload
            onLogoChange={(url) => {
              setFormData(prev => ({
                ...prev,
                logo: url || ''
              }));
            }}
            existingLogo={formData.logo}
          />
        </Card>

        {/* Cores da Loja */}
        <Card className="p-4 lg:p-6">
          <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
            <Palette size={18} className="text-blue-600 flex-shrink-0" />
            <h2 className="text-base lg:text-lg font-semibold text-gray-900">Cores da Marca</h2>
          </div>

          <p className="text-gray-600 text-sm lg:text-base mb-4 lg:mb-6">
            Personalize as cores da sua loja
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            {/* Cor Primária */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Primária
              </label>
              <div className="space-y-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  disabled={loading}
                  className="w-full h-8 lg:h-10 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
                />
              </div>
            </div>

            {/* Cor Secundária */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Secundária
              </label>
              <div className="space-y-2">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  disabled={loading}
                  className="w-full h-8 lg:h-10 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
                />
              </div>
            </div>

            {/* Cor de Fundo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Fundo
              </label>
              <div className="space-y-2">
                <input
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                  disabled={loading}
                  className="w-full h-8 lg:h-10 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Preview do Tema */}
          <div className="mt-4 lg:mt-6 p-3 lg:p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium text-gray-900 text-sm lg:text-base mb-2 lg:mb-3">Preview</h4>
            <div className="flex gap-1 lg:gap-2">
              <div
                className="h-4 lg:h-6 rounded flex-1"
                style={{ backgroundColor: formData.primaryColor }}
              ></div>
              <div
                className="h-4 lg:h-6 rounded flex-1"
                style={{ backgroundColor: formData.secondaryColor }}
              ></div>
              <div
                className="h-4 lg:h-6 rounded flex-1 border border-gray-300"
                style={{ backgroundColor: formData.backgroundColor }}
              ></div>
            </div>
          </div>
        </Card>

        {/* Informações de Contato */}
        <Card className="p-4 lg:p-6">
          <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
            <Contact size={18} className="text-blue-600 flex-shrink-0" />
            <h2 className="text-base lg:text-lg font-semibold text-gray-900">Contato</h2>
          </div>

          <p className="text-gray-600 text-sm lg:text-base mb-4 lg:mb-6">
            Informações de contato (opcional)
          </p>

          <div className="space-y-3 lg:space-y-4">
            {/* Telefone */}
            <div className="space-y-1 lg:space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone size={14} className="flex-shrink-0" />
                Telefone
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.contact.phone}
                onChange={(e) => handleContactChange('phone', e.target.value)}
                disabled={loading}
                className="text-sm lg:text-base"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-1 lg:space-y-2">
              <label htmlFor="whatsapp" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MessageCircle size={14} className="flex-shrink-0" />
                WhatsApp
              </label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.contact.whatsapp}
                onChange={(e) => handleContactChange('whatsapp', e.target.value)}
                disabled={loading}
                className="text-sm lg:text-base"
              />
            </div>

            {/* Email */}
            <div className="space-y-1 lg:space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail size={14} className="flex-shrink-0" />
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="contato@minhaloja.com"
                value={formData.contact.email}
                onChange={(e) => handleContactChange('email', e.target.value)}
                disabled={loading}
                className="text-sm lg:text-base"
              />
            </div>
          </div>
        </Card>

        {/* ✅ NOVO: Endereço da Loja */}
        <Card className="p-4 lg:p-6">
          <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
            <MapPin size={18} className="text-blue-600 flex-shrink-0" />
            <h2 className="text-base lg:text-lg font-semibold text-gray-900">Endereço da Loja</h2>
          </div>

          <p className="text-gray-600 text-sm lg:text-base mb-4 lg:mb-6">
            Endereço físico da loja (opcional)
          </p>

          <div className="space-y-3 lg:space-y-4">
            {/* CEP */}
            <div className="space-y-1 lg:space-y-2">
              <label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
                CEP
              </label>
              <Input
                id="zipCode"
                placeholder="00000-000"
                value={formData.contact.address.zipCode}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                disabled={loading}
                className="text-sm lg:text-base"
                maxLength={9}
              />
              <p className="text-xs lg:text-sm text-gray-500">
                Digite o CEP para preencher automaticamente
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              {/* Rua */}
              <div className="space-y-1 lg:space-y-2">
                <label htmlFor="street" className="text-sm font-medium text-gray-700">
                  Rua
                </label>
                <Input
                  id="street"
                  placeholder="Nome da rua"
                  value={formData.contact.address.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  disabled={loading}
                  className="text-sm lg:text-base"
                />
              </div>

              {/* Número */}
              <div className="space-y-1 lg:space-y-2">
                <label htmlFor="number" className="text-sm font-medium text-gray-700">
                  Número
                </label>
                <Input
                  id="number"
                  placeholder="Nº"
                  value={formData.contact.address.number}
                  onChange={(e) => handleAddressChange('number', e.target.value)}
                  disabled={loading}
                  className="text-sm lg:text-base"
                />
              </div>
            </div>

            {/* Complemento */}
            <div className="space-y-1 lg:space-y-2">
              <label htmlFor="complement" className="text-sm font-medium text-gray-700">
                Complemento
              </label>
              <Input
                id="complement"
                placeholder="Apto, bloco, etc."
                value={formData.contact.address.complement}
                onChange={(e) => handleAddressChange('complement', e.target.value)}
                disabled={loading}
                className="text-sm lg:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              {/* Bairro */}
              <div className="space-y-1 lg:space-y-2">
                <label htmlFor="neighborhood" className="text-sm font-medium text-gray-700">
                  Bairro
                </label>
                <Input
                  id="neighborhood"
                  placeholder="Bairro"
                  value={formData.contact.address.neighborhood}
                  onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
                  disabled={loading}
                  className="text-sm lg:text-base"
                />
              </div>

              {/* Cidade */}
              <div className="space-y-1 lg:space-y-2">
                <label htmlFor="city" className="text-sm font-medium text-gray-700">
                  Cidade
                </label>
                <Input
                  id="city"
                  placeholder="Cidade"
                  value={formData.contact.address.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  disabled={loading}
                  className="text-sm lg:text-base"
                />
              </div>
            </div>

            {/* Estado */}
            <div className="space-y-1 lg:space-y-2">
              <label htmlFor="state" className="text-sm font-medium text-gray-700">
                Estado
              </label>
              <Input
                id="state"
                placeholder="UF"
                value={formData.contact.address.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                disabled={loading}
                className="text-sm lg:text-base"
                maxLength={2}
              />
            </div>
          </div>
        </Card>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="flex-1 order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || slugAvailable === false}
            className="flex-1 bg-blue-600 hover:bg-blue-700 order-1 sm:order-2"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-sm lg:text-base">
                  {store ? 'Salvando...' : 'Criando...'}
                </span>
              </div>
            ) : (
              <span className="text-sm lg:text-base">
                {store ? 'Salvar' : 'Criar Loja'}
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}