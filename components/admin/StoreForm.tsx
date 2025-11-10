'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { STORE_SLUG_REGEX } from '@/lib/utils/constants';
import { Store, CreateStoreData } from '@/types/store';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { storeServiceNew } from '@/lib/firebase/store-service-new';

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
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        slug: store.slug,
        description: store.description || '',
        primaryColor: store.theme.primaryColor,
        secondaryColor: store.theme.secondaryColor,
      });
    }
  }, [store]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome da loja é obrigatório';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug é obrigatório';
    } else if (!STORE_SLUG_REGEX.test(formData.slug)) {
      newErrors.slug = 'Slug deve conter apenas letras minúsculas, números e hífens';
    } else if (slugAvailable === false) {
      newErrors.slug = 'Este slug já está em uso';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Descrição muito longa (máx. 500 caracteres)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || !STORE_SLUG_REGEX.test(slug)) {
      setSlugAvailable(null);
      return;
    }

    try {
      const available = await storeServiceNew.isSlugAvailable(slug);
      setSlugAvailable(available);
      
      if (errors.slug && available) {
        setErrors(prev => ({ ...prev, slug: '' }));
      }
    } catch (error) {
      console.error('Erro ao verificar slug:', error);
    }
  };

  const handleSlugChange = (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    setFormData(prev => ({ ...prev, slug }));
    
    if (slug !== store?.slug) {
      checkSlugAvailability(slug);
    } else {
      setSlugAvailable(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) {
      return;
    }

    setLoading(true);
    setErrors({});

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
        await storeServiceNew.updateStore(store.id, storeData);
      } else {
        // Criar nova loja
        const storeId = await storeServiceNew.createStore(storeData, user.id);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/stores');
      }
    } catch (error) {
      console.error('Erro ao salvar loja:', error);
      setErrors({ submit: 'Erro ao salvar loja. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {errors.submit}
        </div>
      )}

      {/* Nome da Loja */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nome da Loja *
        </label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Minha Loja Online"
          disabled={loading}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <label htmlFor="slug" className="text-sm font-medium">
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
          />
        </div>
        {errors.slug && (
          <p className="text-sm text-red-600">{errors.slug}</p>
        )}
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
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descreva brevemente sua loja..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          disabled={loading}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description}</p>
        )}
        <p className="text-sm text-gray-500">
          {formData.description.length}/500 caracteres
        </p>
      </div>

      {/* Cores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="primaryColor" className="text-sm font-medium">
            Cor Primária
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              id="primaryColor"
              value={formData.primaryColor}
              onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
              disabled={loading}
              className="w-12 h-12 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
            />
            <Input
              value={formData.primaryColor}
              onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="secondaryColor" className="text-sm font-medium">
            Cor Secundária
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              id="secondaryColor"
              value={formData.secondaryColor}
              onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
              disabled={loading}
              className="w-12 h-12 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
            />
            <Input
              value={formData.secondaryColor}
              onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-3">Preview do Tema</h4>
        <div className="space-y-2">
          <div 
            className="h-4 rounded"
            style={{ backgroundColor: formData.primaryColor }}
          ></div>
          <div 
            className="h-4 rounded"
            style={{ backgroundColor: formData.secondaryColor }}
          ></div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || slugAvailable === false}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{store ? 'Salvando...' : 'Criando...'}</span>
            </div>
          ) : (
            store ? 'Salvar Alterações' : 'Criar Loja'
          )}
        </Button>
      </div>
    </form>
  );
}