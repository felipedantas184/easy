'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { VariantManager } from '@/components/admin/VariantManager';
import { InventoryManager } from '@/components/admin/InventoryManager';
import { productService, storeService } from '@/lib/firebase/firestore';
import { Store } from '@/types/store';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant, ProductImage } from '@/types';
import { createDefaultVariant, getProductTotalStock } from '@/lib/utils/product-helpers';

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
}

interface ProductFormData {
  storeId: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  hasVariants: boolean;
  variants: ProductVariant[];
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  seo: {
    title: string;
    description: string;
  };
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    storeId: '',
    name: '',
    description: '',
    category: '',
    images: [],
    hasVariants: false,
    variants: [createDefaultVariant()],
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    seo: {
      title: '',
      description: ''
    }
  });

  // Carregar lojas do usuário
  useEffect(() => {
    async function loadStores() {
      if (user) {
        try {
          const userStores = await storeService.getUserStores(user.id);
          setStores(userStores);

          if (product && !formData.storeId) {
            setFormData(prev => ({ ...prev, storeId: product.storeId }));
          } else if (userStores.length > 0 && !formData.storeId) {
            setFormData(prev => ({ ...prev, storeId: userStores[0].id }));
          }
        } catch (error) {
          console.error('Erro ao carregar lojas:', error);
        }
      }
    }

    loadStores();
  }, [user, product, formData.storeId]);

  // Preencher form se editing
  useEffect(() => {
    if (product) {
      const imageUrls = product.images.map(img => img.url);
      
      setFormData({
        storeId: product.storeId,
        name: product.name,
        description: product.description,
        category: product.category,
        images: imageUrls,
        hasVariants: product.hasVariants,
        variants: product.variants,
        weight: product.weight?.toString() || '',
        dimensions: {
          length: product.dimensions?.length?.toString() || '',
          width: product.dimensions?.width?.toString() || '',
          height: product.dimensions?.height?.toString() || ''
        },
        seo: {
          title: product.seo?.title || '',
          description: product.seo?.description || ''
        }
      });
    }
  }, [product]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.storeId) {
      newErrors.storeId = 'Selecione uma loja';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do produto é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Categoria é obrigatória';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'Adicione pelo menos uma imagem';
    }

    // Validação de variações
    if (formData.variants.length === 0) {
      newErrors.variants = 'É necessário pelo menos uma variação';
    } else {
      for (const variant of formData.variants) {
        if (variant.options.length === 0) {
          newErrors.variants = 'Cada variação deve ter pelo menos uma opção';
          break;
        }
        
        for (const option of variant.options) {
          if (!option.name.trim()) {
            newErrors.variants = 'Todas as opções devem ter um nome';
          }
          if (option.price <= 0) {
            newErrors.variants = 'Todas as opções devem ter um preço maior que zero';
          }
          if (option.stock < 0) {
            newErrors.variants = 'Estoque não pode ser negativo';
          }
          if (!option.sku.trim()) {
            newErrors.variants = 'Todas as opções devem ter um SKU';
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const productImages: ProductImage[] = formData.images.map((url, index) => ({
        id: `img-${Date.now()}-${index}`,
        url,
        alt: formData.name,
        isPrimary: index === 0,
        order: index
      }));

      const productData: Omit<Product, 'id'> = {
        storeId: formData.storeId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        images: productImages,
        hasVariants: formData.hasVariants,
        variants: formData.variants,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        dimensions: formData.dimensions.length ? {
          length: parseFloat(formData.dimensions.length),
          width: parseFloat(formData.dimensions.width),
          height: parseFloat(formData.dimensions.height)
        } : undefined,
        seo: formData.seo.title ? {
          title: formData.seo.title,
          description: formData.seo.description
        } : undefined,
        isActive: true,
        createdAt: product?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      if (product) {
        await productService.updateProduct(product.id, productData);
      } else {
        await productService.createProduct(productData, formData.storeId);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/products');
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      setErrors({ submit: 'Erro ao salvar produto. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVariantsChange = (variants: ProductVariant[]) => {
    setFormData(prev => ({
      ...prev,
      variants,
    }));
  };

  const toggleVariants = () => {
    if (formData.hasVariants) {
      // Desativando variações - voltar para variação padrão
      setFormData(prev => ({
        ...prev,
        hasVariants: false,
        variants: [createDefaultVariant()]
      }));
    } else {
      // Ativando variações - manter as variações atuais
      setFormData(prev => ({
        ...prev,
        hasVariants: true,
      }));
    }
  };

  const totalStock = getProductTotalStock({
    id: 'temp',
    storeId: formData.storeId,
    name: formData.name,
    description: formData.description,
    images: [],
    category: formData.category,
    isActive: true,
    hasVariants: formData.hasVariants,
    variants: formData.variants,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Product);

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {errors.submit}
        </div>
      )}

      {/* Informações Básicas */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Informações do Produto</h2>
          <p className="text-gray-600 mt-1">Preencha as informações básicas do produto</p>
        </div>

        {/* Seleção de Loja */}
        <div className="space-y-2">
          <label htmlFor="storeId" className="text-sm font-medium">
            Loja *
          </label>
          <select
            id="storeId"
            value={formData.storeId}
            onChange={(e) => setFormData(prev => ({ ...prev, storeId: e.target.value }))}
            disabled={loading || !!product}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          >
            <option value="">Selecione uma loja</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          {errors.storeId && (
            <p className="text-sm text-red-600">{errors.storeId}</p>
          )}
        </div>

        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nome do Produto *
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Camiseta Básica"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Categoria *
            </label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              placeholder="Ex: Roupas, Eletrônicos"
              disabled={loading}
            />
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category}</p>
            )}
          </div>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Descrição *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descreva o produto em detalhes..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            disabled={loading}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Imagens */}
        <div className="space-y-4">
          <label className="text-sm font-medium">
            Imagens do Produto *
          </label>
          <ImageUpload
            onImagesChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
            existingImages={formData.images}
          />
          {errors.images && (
            <p className="text-sm text-red-600">{errors.images}</p>
          )}
        </div>
      </div>

      {/* Variações e Preços */}
      <div className="space-y-6 pt-8 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Variações e Preços</h2>
            <p className="text-gray-600 mt-1">
              Configure as opções de variação, preços e estoque
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Estoque Total: <strong>{totalStock}</strong> unidades
            </div>
          </div>
        </div>

        {/* Checkbox para variações */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="hasVariants"
            checked={formData.hasVariants}
            onChange={toggleVariants}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="hasVariants" className="text-sm font-medium text-gray-900">
            Este produto tem variações (tamanhos, cores, etc.)
          </label>
        </div>

        {/* Gerenciador de Variações */}
        <VariantManager
          variants={formData.variants}
          hasVariants={formData.hasVariants}
          onChange={handleVariantsChange}
        />
        
        {errors.variants && (
          <p className="text-sm text-red-600">{errors.variants}</p>
        )}
      </div>

      {/* Configurações Avançadas */}
      <div className="space-y-6 pt-8 border-t">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-left"
        >
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configurações Avançadas</h2>
            <p className="text-gray-600 mt-1">
              Peso, dimensões e SEO (opcional)
            </p>
          </div>
          <div className="text-gray-400">
            {showAdvanced ? '▲' : '▼'}
          </div>
        </button>

        {showAdvanced && (
          <div className="space-y-6">
            {/* Gestão de Estoque e Envio */}
            <InventoryManager
              formData={formData}
              onChange={setFormData}
              totalStock={totalStock}
            />

            {/* SEO */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Otimização para Buscas (SEO)</h3>
              
              <div className="space-y-2">
                <label htmlFor="seoTitle" className="text-sm font-medium">
                  Título SEO (opcional)
                </label>
                <Input
                  id="seoTitle"
                  value={formData.seo.title}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    seo: { ...prev.seo, title: e.target.value }
                  }))}
                  placeholder="Deixe em branco para usar o nome do produto"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="seoDescription" className="text-sm font-medium">
                  Descrição SEO (opcional)
                </label>
                <textarea
                  id="seoDescription"
                  value={formData.seo.description}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    seo: { ...prev.seo, description: e.target.value }
                  }))}
                  placeholder="Deixe em branco para usar a descrição do produto"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex space-x-4 pt-6 border-t">
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
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{product ? 'Salvando...' : 'Criar Produto'}</span>
            </div>
          ) : (
            product ? 'Salvar Alterações' : 'Criar Produto'
          )}
        </Button>
      </div>
    </form>
  );
}