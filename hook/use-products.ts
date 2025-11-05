import { useState, useEffect } from 'react';
import { productService } from '@/lib/firebase/firestore';
import { Product } from '@/types';

export function useProducts(storeId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storeId) {
      loadProducts();
    }
  }, [storeId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const productsData = await productService.getStoreProducts(storeId);
      setProducts(productsData);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setError('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      const productId = await productService.createProduct(productData, storeId);
      await loadProducts(); // Recarregar lista
      return productId;
    } catch (err) {
      console.error('Erro ao criar produto:', err);
      throw err;
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      await productService.updateProduct(productId, updates);
      await loadProducts(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      throw err;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await productService.deleteProduct(productId);
      await loadProducts(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao deletar produto:', err);
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: loadProducts,
  };
}