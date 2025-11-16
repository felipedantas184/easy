'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Order } from '@/types/order';
import { Store } from '@/types/store';
import { Button } from '@/components/ui/button';
import { OrderCard } from '@/components/ui/order-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  Eye, 
  Package, 
  Search, 
  Filter, 
  Download,
  ShoppingCart,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';
import { orderServiceNew } from '@/lib/firebase/order-service-new';
import { storeServiceNew } from '@/lib/firebase/store-service-new';
import { Input } from '@/components/ui/input';

export default function OrdersPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Carregar estatísticas
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const confirmed = orders.filter(o => o.status === 'confirmed').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const revenue = orders
      .filter(o => o.paymentStatus === 'confirmed')
      .reduce((sum, order) => sum + order.total, 0);

    return { total, pending, confirmed, delivered, revenue };
  }, [orders]);

  // Filtrar pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
      
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  const confirmOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await orderServiceNew.confirmOrder(selectedStoreId, orderId);
      const updatedOrders = await orderServiceNew.getStoreOrders(selectedStoreId);
      setOrders(updatedOrders);
    } catch (error) {
      console.error('Erro ao confirmar pedido:', error);
      alert('Erro ao confirmar pedido');
    } finally {
      setActionLoading(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este pedido? O estoque será restaurado.')) {
      return;
    }

    setActionLoading(orderId);
    try {
      await orderServiceNew.cancelOrder(selectedStoreId, orderId);
      const updatedOrders = await orderServiceNew.getStoreOrders(selectedStoreId);
      setOrders(updatedOrders);
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      alert('Erro ao cancelar pedido');
    } finally {
      setActionLoading(null);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setActionLoading(orderId);
    try {
      await orderServiceNew.updateOrderStatus(selectedStoreId, orderId, newStatus);
      const updatedOrders = await orderServiceNew.getStoreOrders(selectedStoreId);
      setOrders(updatedOrders);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do pedido');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    async function loadStores() {
      if (user) {
        try {
          const userStores = await storeServiceNew.getUserStores(user.id);
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
    async function loadOrders() {
      if (selectedStoreId) {
        try {
          setLoading(true);
          const storeOrders = await orderServiceNew.getStoreOrders(selectedStoreId);
          // Ordenar por data (mais recentes primeiro)
          const sortedOrders = storeOrders.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(sortedOrders);
        } catch (error) {
          console.error('Erro ao carregar pedidos:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    loadOrders();
  }, [selectedStoreId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  if (stores.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600 mt-1">Gerencie os pedidos das suas lojas</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Nenhuma loja criada
          </h3>
          <p className="text-gray-600 mb-6 text-lg">
            Você precisa criar uma loja para receber pedidos.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Criar Primeira Loja
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600 text-lg">
            Gerencie e acompanhe os pedidos das suas lojas
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="border-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Store Selector */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <label htmlFor="store-select" className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Loja
            </label>
            <select
              id="store-select"
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
              <div className="text-sm text-gray-600">Confirmados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
              <div className="text-sm text-gray-600">Entregues</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por cliente, email ou ID do pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="preparing">Preparando</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregue</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          
          {/* Payment Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os pagamentos</option>
              <option value="pending">Pagamento Pendente</option>
              <option value="confirmed">Pago</option>
              <option value="failed">Falhou</option>
              <option value="refunded">Estornado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {selectedStoreId && (
        <div className="space-y-6">
          {loading ? (
            // Loading Skeleton
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border p-6 animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                      <div className="w-48 h-6 bg-gray-200 rounded"></div>
                      <div className="w-32 h-4 bg-gray-200 rounded"></div>
                      <div className="w-64 h-4 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-24 h-8 bg-gray-200 rounded ml-4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {orders.length === 0 ? 'Nenhum pedido encontrado' : 'Nenhum pedido corresponde aos filtros'}
              </h3>
              <p className="text-gray-600">
                {orders.length === 0 
                  ? 'Esta loja ainda não recebeu pedidos.'
                  : 'Tente ajustar os filtros de busca.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={updateOrderStatus}
                  onConfirm={confirmOrder}
                  onCancel={cancelOrder}
                  loading={actionLoading === order.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}