'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { Product } from '@/types';
import { getProductPrice, getProductComparePrice, hasActivePromotion } from '@/lib/utils/product-helpers'; // ✅ IMPORTAR HELPERS

interface ProductTableProps {
  products: Product[];
  onDelete: (productId: string) => void;
  loading?: boolean;
}

export function ProductTable({ products, onDelete, loading = false }: ProductTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    setDeletingId(productId);
    try {
      await onDelete(productId);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
              <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📦</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum produto cadastrado
        </h3>
        <p className="text-gray-600 mb-6">
          Comece adicionando seu primeiro produto à loja.
        </p>
        <Link href="/dashboard/products/new">
          <Button>Adicionar Primeiro Produto</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preço
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              // ✅ USAR HELPERS para obter preços
              const productPrice = getProductPrice(product);
              const productComparePrice = getProductComparePrice(product);
              const hasPromotion = hasActivePromotion(product);
              
              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  {/* Produto */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={product.images[0]?.url || '/images/placeholder-product.jpg'}
                          alt={product.images[0]?.alt || product.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1 w-full max-w-xs">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Categoria */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.category}</div>
                  </td>

                  {/* Preço */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(productPrice)}
                    </div>
                    {hasPromotion && productComparePrice && (
                      <div className="text-sm text-gray-500 line-through">
                        {formatPrice(productComparePrice)}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {product.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    {product.hasVariants && (
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                        Variações
                      </span>
                    )}
                    {hasPromotion && (
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">
                        Promoção
                      </span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Link href={`/${product.storeId}/products/${product.id}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <Eye size={16} />
                        </Button>
                      </Link>

                      <Link href={`/dashboard/products/${product.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit size={16} />
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}