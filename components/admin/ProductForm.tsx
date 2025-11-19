'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { VariantManager } from '@/components/admin/VariantManager';
import { InventoryManager } from '@/components/admin/InventoryManager';
import { Store } from '@/types/store';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant, ProductImage } from '@/types';
import { createDefaultVariant, getProductTotalStock } from '@/lib/utils/product-helpers';
import { productServiceNew, storeServiceNew } from '@/lib/firebase/firestore-new';
import { generateSEOTitle, generateSEODescription, checkSEOOptimization } from '@/lib/utils/seo-helpers';

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
  const [autoSEO, setAutoSEO] = useState(true); // ✅ NOVO: Controle para SEO automático

  const [formData, setFormData] = useState<ProductFormData>({
    storeId: '',
    name: '',
    description: '',
    category: '',
    images: [],
    hasVariants: false,
    variants: [createDefaultVariant()],
    weight: '1',
    dimensions: {
      length: '10',
      width: '20',
      height: '15'
    },
    seo: {
      title: '',
      description: ''
    }
  });

  // ✅ NOVO: Efeito para preencher SEO automaticamente
  useEffect(() => {
    if (autoSEO && (formData.name || formData.description)) {
      const newTitle = generateSEOTitle(formData.name);
      const newDescription = generateSEODescription(formData.description);

      setFormData(prev => ({
        ...prev,
        seo: {
          title: newTitle,
          description: newDescription
        }
      }));
    }
  }, [formData.name, formData.description, autoSEO]);

  // ✅ NOVO: Verificação de otimização SEO
  const seoOptimization = checkSEOOptimization(formData.seo.title, formData.seo.description);

  // Carregar lojas do usuário
  useEffect(() => {
    async function loadStores() {
      if (user) {
        try {
          const userStores = await storeServiceNew.getUserStores(user.id);
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
    async function loadProduct() {
      if (product) {
        try {
          const productData = await productServiceNew.getProduct(product.storeId, product.id);
          if (productData) {
            const imageUrls = productData.images.map(img => img.url);

            setFormData({
              storeId: productData.storeId,
              name: productData.name,
              description: productData.description,
              category: productData.category,
              images: imageUrls,
              hasVariants: productData.hasVariants,
              variants: productData.variants,
              weight: productData.weight?.toString() || '',
              dimensions: {
                length: productData.dimensions?.length?.toString() || '',
                width: productData.dimensions?.width?.toString() || '',
                height: productData.dimensions?.height?.toString() || ''
              },
              seo: {
                title: productData.seo?.title || '',
                description: productData.seo?.description || ''
              }
            });

            // ✅ NOVO: Desativar SEO automático se já tiver dados SEO personalizados
            if (productData.seo?.title || productData.seo?.description) {
              setAutoSEO(false);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar produto:', error);
        }
      }
    }

    loadProduct();
  }, [product]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.storeId) {
      newErrors.storeId = 'Selecione uma loja';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do produto é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Descrição deve ter pelo menos 10 caracteres';
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
        await productServiceNew.updateProduct(formData.storeId, product.id, productData);
      } else {
        await productServiceNew.createProduct(productData, formData.storeId);
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
    const variantsWithIds = variants.map(variant => ({
      ...variant,
      id: variant.id || `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    setFormData(prev => ({
      ...prev,
      variants: variantsWithIds,
    }));
  };

  const toggleVariants = () => {
    if (formData.hasVariants) {
      setFormData(prev => ({
        ...prev,
        hasVariants: false,
        variants: [createDefaultVariant()]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        hasVariants: true,
      }));
    }
  };

  // ✅ NOVO: Função para atualizar manualmente o SEO
  const handleUpdateSEO = () => {
    const newTitle = generateSEOTitle(formData.name);
    const newDescription = generateSEODescription(formData.description);

    setFormData(prev => ({
      ...prev,
      seo: {
        title: newTitle,
        description: newDescription
      }
    }));
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
        <div className="space-y-2 md:space-y-3">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Informações do Produto
          </h2>

          <p className="text-gray-600 text-sm md:text-base">
            Preencha as informações básicas para cadastrar o produto.
          </p>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Variações e Preços</h2>
            <p className="text-gray-600 mt-1">
              Configure as opções de variação, preços e estoque
            </p>
          </div>

          {/* Estoque Total */}
          <div className="flex items-center">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md border">
              Estoque Total: <strong>{totalStock}</strong> unidades
            </span>
          </div>
        </div>

        {/* Checkbox - responsivo e bonito */}
        <div className="mt-4 flex items-start md:items-center gap-3">
          <input
            type="checkbox"
            id="hasVariants"
            checked={formData.hasVariants}
            onChange={toggleVariants}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded 
               focus:ring-blue-500 cursor-pointer"
          />

          <label
            htmlFor="hasVariants"
            className="text-sm font-medium text-gray-900 leading-5 cursor-pointer"
          >
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

            {/* SEO - MELHORADO */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Otimização para Buscas (SEO)</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoSEO"
                    checked={autoSEO}
                    onChange={(e) => setAutoSEO(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="autoSEO" className="text-sm text-gray-700">
                    Preencher automaticamente
                  </label>
                  {!autoSEO && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUpdateSEO}
                    >
                      Gerar SEO
                    </Button>
                  )}
                </div>
              </div>

              {/* Indicadores de Otimização */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg border ${seoOptimization.title.isValid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                  }`}>
                  <div className="text-sm font-medium mb-1">Título SEO</div>
                  <div className={`text-xs ${seoOptimization.title.isValid ? 'text-green-700' : 'text-yellow-700'}`}>
                    {formData.seo.title.length}/60 caracteres • {seoOptimization.title.message}
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${seoOptimization.description.isValid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                  }`}>
                  <div className="text-sm font-medium mb-1">Descrição SEO</div>
                  <div className={`text-xs ${seoOptimization.description.isValid ? 'text-green-700' : 'text-yellow-700'}`}>
                    {formData.seo.description.length}/160 caracteres • {seoOptimization.description.message}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="seoTitle" className="text-sm font-medium">
                  Título SEO
                </label>
                <Input
                  id="seoTitle"
                  value={formData.seo.title}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    seo: { ...prev.seo, title: e.target.value }
                  }))}
                  placeholder="Título otimizado para buscas..."
                  disabled={loading || autoSEO}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="seoDescription" className="text-sm font-medium">
                  Descrição SEO
                </label>
                <textarea
                  id="seoDescription"
                  value={formData.seo.description}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    seo: { ...prev.seo, description: e.target.value }
                  }))}
                  placeholder="Descrição otimizada para buscas..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  disabled={loading || autoSEO}
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