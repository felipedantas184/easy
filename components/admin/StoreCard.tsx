'use client';
import { Store } from '@/types/store';
import { Button } from '@/components/ui/button';
import { 
  Store as StoreIcon, 
  Edit, 
  Trash2, 
  ExternalLink,
  MoreVertical 
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { storeServiceNew } from '@/lib/firebase/store-service-new';

interface StoreCardProps {
  store: Store;
  onUpdate: () => void;
}

export function StoreCard({ store, onUpdate }: StoreCardProps) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta loja?')) {
      return;
    }

    setLoading(true);
    try {
      await storeServiceNew.deleteStore(store.id);
      onUpdate();
    } catch (error) {
      console.error('Erro ao excluir loja:', error);
      alert('Erro ao excluir loja');
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const storeUrl = `/${store.slug}`;

  return (
    <div className="bg-white rounded-lg border hover:shadow-md transition-shadow">
      {/* Header */}
      <div 
        className="h-4 rounded-t-lg"
        style={{ backgroundColor: store.theme.primaryColor }}
      ></div>
      
      <div className="p-6">
        {/* Store Info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: store.theme.secondaryColor }}
            >
              <StoreIcon size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{store.name}</h3>
              <p className="text-sm text-gray-500">easystore.com/{store.slug}</p>
            </div>
          </div>
          
          {/* Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              disabled={loading}
            >
              <MoreVertical size={16} />
            </Button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md border shadow-lg z-10">
                <Link href={`/dashboard/stores/${store.id}`}>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                    <Edit size={16} />
                    <span>Editar Loja</span>
                  </button>
                </Link>
                <Link href={storeUrl} target="_blank">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                    <ExternalLink size={16} />
                    <span>Ver Loja</span>
                  </button>
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  <span>{loading ? 'Excluindo...' : 'Excluir'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {store.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {store.description}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
          <div>
            <div className="text-sm font-medium text-gray-900">0</div>
            <div className="text-xs text-gray-500">Produtos</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">0</div>
            <div className="text-xs text-gray-500">Pedidos</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {store.isActive ? 'Ativa' : 'Inativa'}
            </div>
            <div className="text-xs text-gray-500">Status</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 mt-4">
          <Link href={storeUrl} target="_blank" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink size={16} className="mr-2" />
              Visitar
            </Button>
          </Link>
          <Link href={`/dashboard/stores/${store.id}`} className="flex-1">
            <Button size="sm" className="w-full">
              <Edit size={16} className="mr-2" />
              Gerenciar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}