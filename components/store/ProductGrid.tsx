'use client';
import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/ui/product-card';
import { Product } from '@/types';
import { productService } from '@/lib/firebase/firestore';

interface ProductGridProps {
  storeId: string;
}

export function ProductGrid({ storeId }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      if (!storeId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Buscando produtos para loja:', storeId);
        
        // ✅ BUSCAR PRODUTOS REAIS DO FIREBASE
        const storeProducts = await productService.getStoreProducts(storeId);
        
        console.log('Produtos encontrados:', storeProducts);
        
        setProducts(storeProducts);
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
        setError('Erro ao carregar produtos da loja');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [storeId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white rounded-lg border animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
            <div className="p-4">
              <div className="w-3/4 h-4 bg-gray-200 rounded mb-2"></div>
              <div className="w-1/2 h-4 bg-gray-200 rounded mb-3"></div>
              <div className="w-1/3 h-6 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-600">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao carregar produtos
          </h3>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📦</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum produto disponível
          </h3>
          <p className="text-gray-600">
            Esta loja ainda não possui produtos cadastrados.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Volte em breve para conferir novidades!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}