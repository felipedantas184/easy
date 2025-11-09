'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProductTable } from '@/components/admin/ProductTable';
import { Button } from '@/components/ui/button';
import { storeService } from '@/lib/firebase/firestore';
import { Store } from '@/types/store';
import Link from 'next/link';
import { Plus, Package } from 'lucide-react';
import { useProducts } from '@/hook/use-products';
import { hasActivePromotion } from '@/lib/utils/product-helpers'; // ✅ IMPORTAR HELPER

export default function ProductsPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  
  const { 
    products, 
    loading, 
    error, 
    deleteProduct 
  } = useProducts(selectedStoreId);

  // Carregar lojas do usuário
  useEffect(() => {
    async function loadStores() {
      if (user) {
        try {
          const userStores = await storeService.getUserStores(user.id);
          setStores(userStores);
          
          // Selecionar primeira loja por padrão
          if (userStores.length > 0 && !selectedStoreId) {
            setSelectedStoreId(userStores[0].id);
          }
        } catch (error) {
          console.error('Erro ao carregar lojas:', error);
        }
      }
    }

    loadStores();
  }, [user, selectedStoreId]);

  if (stores.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
            <p className="text-gray-600 mt-1">Gerencie os produtos das suas lojas</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma loja criada
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Você precisa criar uma loja antes de adicionar produtos.
          </p>
          <Link href="/dashboard/stores/new">
            <Button size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Criar Primeira Loja
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os produtos das suas lojas
          </p>
        </div>
        
        <Link href="/dashboard/products/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </Link>
      </div>

      {/* Store Selector */}
      <div className="bg-white rounded-lg border p-6">
        <label htmlFor="store-select" className="block text-sm font-medium text-gray-700 mb-2">
          Selecionar Loja
        </label>
        <select
          id="store-select"
          value={selectedStoreId}
          onChange={(e) => setSelectedStoreId(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Selecione uma loja</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      {selectedStoreId ? (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <ProductTable
            products={products}
            onDelete={deleteProduct}
            loading={loading}
          />

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="text-2xl font-bold text-gray-900">{products.length}</div>
              <div className="text-sm text-gray-600">Total de Produtos</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.hasVariants).length}
              </div>
              <div className="text-sm text-gray-600">Com Variações</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-2xl font-bold text-gray-900">
                {/* ✅ CORREÇÃO: Usar helper para verificar promoções */}
                {products.filter(p => hasActivePromotion(p)).length}
              </div>
              <div className="text-sm text-gray-600">Em Promoção</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-2xl font-bold text-gray-900">
                {new Set(products.map(p => p.category)).size}
              </div>
              <div className="text-sm text-gray-600">Categorias</div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Selecione uma loja
          </h3>
          <p className="text-gray-600">
            Escolha uma loja para visualizar e gerenciar os produtos.
          </p>
        </div>
      )}
    </div>
  );
}