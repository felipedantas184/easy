'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { DiscountCoupon } from '@/types/discount';
import { storeService } from '@/lib/firebase/firestore';
import { discountService } from '@/lib/firebase/firestore';
import { Store } from '@/types/store';
import { Button } from '@/components/ui/button';
import { CouponTable } from '@/components/admin/CouponTable';
import { CouponForm } from '@/components/admin/CouponForm';
import { Plus, Tag, TrendingDown } from 'lucide-react';

export default function CouponsPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<DiscountCoupon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStores() {
      if (user) {
        try {
          const userStores = await storeService.getUserStores(user.id);
          setStores(userStores);
          if (userStores.length > 0) {
            setSelectedStoreId(userStores[0].id);
          }
        } catch (error) {
          console.error('Erro ao carregar lojas:', error);
        }
      }
    }

    loadStores();
  }, [user]);

  useEffect(() => {
    async function loadCoupons() {
      if (selectedStoreId) {
        try {
          setLoading(true);
          const storeCoupons = await discountService.getStoreCoupons(selectedStoreId);
          setCoupons(storeCoupons);
        } catch (error) {
          console.error('Erro ao carregar cupons:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    loadCoupons();
  }, [selectedStoreId]);

  const handleCouponCreated = () => {
    setShowForm(false);
    setEditingCoupon(null);
    // Recarregar cupons
    if (selectedStoreId) {
      discountService.getStoreCoupons(selectedStoreId).then(setCoupons);
    }
  };

  const handleEditCoupon = (coupon: DiscountCoupon) => {
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) {
      return;
    }

    try {
      await discountService.deleteCoupon(couponId);
      // Recarregar cupons
      const updatedCoupons = await discountService.getStoreCoupons(selectedStoreId);
      setCoupons(updatedCoupons);
    } catch (error) {
      console.error('Erro ao excluir cupom:', error);
      alert('Erro ao excluir cupom');
    }
  };

  const getStats = () => {
    const activeCoupons = coupons.filter(c => c.isActive);
    const expiredCoupons = coupons.filter(c => new Date() > c.validUntil);
    const totalUsage = coupons.reduce((sum, c) => sum + c.usedCount, 0);

    return {
      active: activeCoupons.length,
      expired: expiredCoupons.length,
      totalUsage,
      total: coupons.length,
    };
  };

  const stats = getStats();

  if (stores.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cupons de Desconto</h1>
          <p className="text-gray-600 mt-1">Gerencie cupons e promoções das suas lojas</p>
        </div>

        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma loja criada
          </h3>
          <p className="text-gray-600 mb-6">
            Você precisa criar uma loja para gerenciar cupons.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cupons de Desconto</h1>
          <p className="text-gray-600 mt-1">
            Crie e gerencie cupons de desconto para suas lojas
          </p>
        </div>
        
        {selectedStoreId && (
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cupom
          </Button>
        )}
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
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Cupons</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-50 text-blue-600">
              <Tag size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ativos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.active}</p>
            </div>
            <div className="p-3 rounded-full bg-green-50 text-green-600">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expirados</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.expired}</p>
            </div>
            <div className="p-3 rounded-full bg-red-50 text-red-600">
              <Tag size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Usos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsage}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-50 text-purple-600">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      {selectedStoreId && (
        <div className="bg-white rounded-lg border">
          <CouponTable
            coupons={coupons}
            loading={loading}
            onEdit={handleEditCoupon}
            onDelete={handleDeleteCoupon}
            onRefresh={() => selectedStoreId && discountService.getStoreCoupons(selectedStoreId).then(setCoupons)}
          />
        </div>
      )}

      {/* Coupon Form Modal */}
      {(showForm || editingCoupon) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => { setShowForm(false); setEditingCoupon(null); }} />
            
            {/* Modal */}
            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <CouponForm
                storeId={selectedStoreId}
                coupon={editingCoupon || undefined}
                onSuccess={handleCouponCreated}
                onCancel={() => { setShowForm(false); setEditingCoupon(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}