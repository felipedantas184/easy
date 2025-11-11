'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ProductForm } from '@/components/admin/ProductForm';
import { Product } from '@/types/products';
import { productServiceNew } from '@/lib/firebase/firestore-new';
import { storeServiceNew } from '@/lib/firebase/store-service-new';

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStoreAndProduct();
    }
  }, [user, productId]);

  const loadStoreAndProduct = async () => {
    try {
      // 1️⃣ Buscar lojas do usuário
      const userStores = await storeServiceNew.getUserStores(user!.id);

      if (!userStores || userStores.length === 0) {
        console.warn('Nenhuma loja encontrada para este usuário.');
        setLoading(false);
        return;
      }

      // 2️⃣ Considerar a primeira loja
      const firstStoreId = userStores[0].id;
      setStoreId(firstStoreId);

      // 3️⃣ Buscar o produto com base em storeId + productId
      const productData = await productServiceNew.getProduct(firstStoreId, productId);
      setProduct(productData);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="bg-white rounded-lg border p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="w-1/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produto Não Encontrado</h1>
          <p className="text-gray-600 mt-1">
            O produto que você está tentando editar não existe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Editar Produto</h1>
        <p className="text-gray-600 mt-1">
          Faça alterações no produto "{product.name}"
        </p>
      </div>
      
      <div className="bg-white rounded-lg border p-6">
        <ProductForm product={product} onSuccess={loadStoreAndProduct} />
      </div>
    </div>
  );
}
