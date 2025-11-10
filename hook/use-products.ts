// hook/use-products.ts
import { useState, useEffect } from 'react';
import { productServiceNew } from '@/lib/firebase/firestore-new';
import { Product } from '@/types';

export function useProducts(storeId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storeId) {
      loadProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [storeId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const productsData = await productServiceNew.getStoreProducts(storeId);
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
      const productId = await productServiceNew.createProduct(productData, storeId);
      await loadProducts();
      return productId;
    } catch (err) {
      console.error('Erro ao criar produto:', err);
      throw err;
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      await productServiceNew.updateProduct(storeId, productId, updates);
      await loadProducts();
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      throw err;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await productServiceNew.deleteProduct(storeId, productId);
      await loadProducts();
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