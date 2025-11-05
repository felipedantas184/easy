'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { VariantManager } from '@/components/admin/VariantManager';
import { productService, storeService } from '@/lib/firebase/firestore';
import { Store } from '@/types/store';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant } from '@/types';

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    storeId: '',
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    category: '',
    images: [] as string[],
    hasVariants: false,
    variants: [] as ProductVariant[],
  });

  // Carregar lojas do usuário
  useEffect(() => {
    async function loadStores() {
      if (user) {
        try {
          const userStores = await storeService.getUserStores(user.id);
          setStores(userStores);

          // Se editing product, set storeId
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
      setFormData({
        storeId: product.storeId,
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        comparePrice: product.comparePrice?.toString() || '',
        category: product.category,
        images: product.images,
        hasVariants: product.hasVariants,
        variants: product.variants,
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

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Preço deve ser maior que zero';
    }

    if (formData.comparePrice && parseFloat(formData.comparePrice) <= parseFloat(formData.price)) {
      newErrors.comparePrice = 'Preço de comparação deve ser maior que o preço de venda';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Categoria é obrigatória';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'Adicione pelo menos uma imagem';
    }

    if (formData.hasVariants) {
      let hasValidVariants = false;

      for (const variant of formData.variants) {
        if (variant.options.length > 0) {
          hasValidVariants = true;
          break;
        }
      }

      if (!hasValidVariants) {
        newErrors.variants = 'Adicione pelo menos uma opção nas variações';
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
      const productData: Omit<Product, 'id'> = {
        storeId: formData.storeId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
        category: formData.category.trim(),
        images: formData.images,
        hasVariants: formData.hasVariants,
        variants: formData.variants,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (product) {
        // Editar produto existente
        await productService.updateProduct(product.id, productData);
      } else {
        // Criar novo produto
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


  const toggleVariants = () => {
    setFormData(prev => ({
      ...prev,
      hasVariants: !prev.hasVariants,
      // Se desativando variações, limpar a lista
      variants: !prev.hasVariants ? prev.variants : [],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {errors.submit}
        </div>
      )}

      {/* Seleção de Loja */}
      <div className="space-y-2">
        <label htmlFor="storeId" className="text-sm font-medium">
          Loja *
        </label>
        <select
          id="storeId"
          value={formData.storeId}
          onChange={(e) => setFormData(prev => ({ ...prev, storeId: e.target.value }))}
          disabled={loading || !!product} // Não permitir mudar loja ao editar
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

      {/* Preços */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium">
            Preço de Venda *
          </label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            placeholder="0.00"
            disabled={loading}
          />
          {errors.price && (
            <p className="text-sm text-red-600">{errors.price}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="comparePrice" className="text-sm font-medium">
            Preço Original (opcional)
          </label>
          <Input
            id="comparePrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.comparePrice}
            onChange={(e) => setFormData(prev => ({ ...prev, comparePrice: e.target.value }))}
            placeholder="0.00"
            disabled={loading}
          />
          {errors.comparePrice && (
            <p className="text-sm text-red-600">{errors.comparePrice}</p>
          )}
          <p className="text-sm text-gray-500">
            Preço antes do desconto (riscado)
          </p>
        </div>
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

      {/* Variações */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">
              Variações do Produto
            </label>
            <p className="text-sm text-gray-500">
              Adicione variações como tamanhos, cores, etc.
            </p>
          </div>
          <Button
            type="button"
            variant={formData.hasVariants ? "default" : "outline"}
            onClick={toggleVariants}
            disabled={loading}
          >
            {formData.hasVariants ? 'Variações Ativas' : 'Adicionar Variações'}
          </Button>
        </div>

        {formData.hasVariants && (
          <>
            <VariantManager
              variants={formData.variants}
              onChange={(variants) => setFormData(prev => ({ ...prev, variants }))}
            />
            {errors.variants && (
              <p className="text-sm text-red-600">{errors.variants}</p>
            )}
          </>
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
              <span>{product ? 'Salvando...' : 'Criando Produto...'}</span>
            </div>
          ) : (
            product ? 'Salvar Alterações' : 'Criar Produto'
          )}
        </Button>
      </div>
    </form>
  );
}