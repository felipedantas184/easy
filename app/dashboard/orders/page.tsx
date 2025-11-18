// app/dashboard/orders/page.tsx - VERSÃO ATUALIZADA
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Order, OrderStatus, PaymentStatus } from '@/types/order';
import { Store } from '@/types/store';
import { Button } from '@/components/ui/button';
import { OrderCard } from '@/components/ui/order-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Package,
  Search,
  Download,
  ShoppingCart,
  RefreshCw,
} from 'lucide-react';
import { orderServiceNew } from '@/lib/firebase/order-service-new';
import { storeServiceNew } from '@/lib/firebase/store-service-new';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/helpers';

type FilterType = 'all' | OrderStatus | PaymentStatus;

export default function OrdersPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [paymentFilter, setPaymentFilter] = useState<FilterType>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  // CORREÇÃO: Função para carregar pedidos com tratamento de erro adequado
  const loadOrders = async (storeId: string) => {
    if (!storeId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Carregando pedidos para store:', storeId);
      const storeOrders = await orderServiceNew.getStoreOrders(storeId);
      console.log('📦 Pedidos carregados:', storeOrders.length);
      setOrders(storeOrders);
    } catch (error) {
      console.error('❌ Erro ao carregar pedidos:', error);
      setError('Erro ao carregar pedidos. Tente novamente.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrders = async () => {
    if (!selectedStoreId) return;

    setRefreshing(true);
    try {
      const storeOrders = await orderServiceNew.getStoreOrders(selectedStoreId);
      setOrders(storeOrders);
      setError(null);
    } catch (error) {
      console.error('Erro ao atualizar pedidos:', error);
      setError('Erro ao atualizar pedidos.');
    } finally {
      setRefreshing(false);
    }
  };

  // CORREÇÃO: Carregar lojas primeiro, depois pedidos
  useEffect(() => {
    async function loadUserStores() {
      if (user) {
        try {
          console.log('🏪 Carregando lojas do usuário...');
          const userStores = await storeServiceNew.getUserStores(user.id);
          setStores(userStores);

          if (userStores.length > 0) {
            const firstStoreId = userStores[0].id;
            setSelectedStoreId(firstStoreId);
            console.log('✅ Loja selecionada:', firstStoreId);
            // Carregar pedidos após selecionar a loja
            await loadOrders(firstStoreId);
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error('Erro ao carregar lojas:', error);
          setError('Erro ao carregar lojas.');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    loadUserStores();
  }, [user]);

  // CORREÇÃO: Carregar pedidos quando a loja selecionada mudar
  useEffect(() => {
    if (selectedStoreId) {
      loadOrders(selectedStoreId);
    }
  }, [selectedStoreId]);


  // Carregar estatísticas
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const confirmed = orders.filter(o => o.status === 'confirmed').length;
    const preparing = orders.filter(o => o.status === 'preparing').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;

    const revenue = orders
      .filter(o => o.paymentStatus === 'confirmed')
      .reduce((sum, order) => sum + order.total, 0);

    const today = new Date();
    const todayOrders = orders.filter(order =>
      new Date(order.createdAt).toDateString() === today.toDateString()
    );

    return {
      total,
      pending,
      confirmed,
      preparing,
      shipped,
      delivered,
      cancelled,
      revenue,
      today: todayOrders.length
    };
  }, [orders]);

  // Filtrar pedidos
  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      const matchesSearch =
        order.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item =>
          item.productName.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });

    // Filtro por tempo
    if (timeFilter !== 'all') {
      const now = new Date();
      result = result.filter(order => {
        const orderDate = new Date(order.createdAt);
        switch (timeFilter) {
          case 'today':
            return orderDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Ordenar por data (mais recentes primeiro)
    return result.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, searchTerm, statusFilter, paymentFilter, timeFilter]);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      await orderServiceNew.updateOrderStatus(selectedStoreId, orderId, newStatus);
      await refreshOrders();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await orderServiceNew.confirmOrder(selectedStoreId, orderId);
      await refreshOrders();
    } catch (error) {
      console.error('Erro ao confirmar pedido:', error);
      throw error;
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este pedido? O estoque será restaurado.')) {
      return;
    }

    try {
      await orderServiceNew.cancelOrder(selectedStoreId, orderId);
      await refreshOrders();
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      throw error;
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
    refreshOrders();
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

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-gray-300 hover:bg-gray-50"
            onClick={refreshOrders}
            disabled={refreshing || !selectedStoreId}
          >
            <RefreshCw size={16} className={cn("mr-2", refreshing && "animate-spin")} />
            Atualizar
          </Button>
          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshOrders}
                  className="text-red-800 hover:bg-red-100"
                >
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Store Selector & Stats */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <label htmlFor="store-select" className="block text-sm font-medium text-gray-700 mb-2">
              Loja Selecionada
            </label>
            <select
              id="store-select"
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-full lg:w-auto"
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-blue-600 font-medium">Total</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-yellow-600 font-medium">Pendentes</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{stats.confirmed}</div>
              <div className="text-xs text-blue-600 font-medium">Confirmados</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{stats.preparing}</div>
              <div className="text-xs text-purple-600 font-medium">Preparando</div>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <div className="text-xl font-bold text-indigo-600">{stats.shipped}</div>
              <div className="text-xs text-indigo-600 font-medium">Enviados</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{stats.delivered}</div>
              <div className="text-xs text-green-600 font-medium">Entregues</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">{stats.cancelled}</div>
              <div className="text-xs text-red-600 font-medium">Cancelados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por cliente, produto, email ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterType)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              onChange={(e) => setPaymentFilter(e.target.value as FilterType)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os pagamentos</option>
              <option value="pending">Pagamento Pendente</option>
              <option value="confirmed">Pago</option>
              <option value="failed">Falhou</option>
              <option value="refunded">Estornado</option>
            </select>
          </div>

          {/* Time Filter */}
          <div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todo período</option>
              <option value="today">Hoje</option>
              <option value="week">Última semana</option>
              <option value="month">Último mês</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
          {searchTerm && ` para "${searchTerm}"`}
        </div>
        <div className="text-sm text-gray-600">
          Faturamento: <span className="font-semibold text-green-600">{formatPrice(stats.revenue)}</span>
        </div>
      </div>

      {/* Orders List */}
      {selectedStoreId && (
        <div className="space-y-4">
          {loading ? (
            // Loading Skeleton - MOSTRAR APENAS QUANDO loading=true
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
          ) : error ? (
            // Error State
            <div className="bg-white rounded-2xl border-2 border-dashed border-red-300 p-12 text-center">
              <Package className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Erro ao carregar pedidos
              </h3>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
              <Button
                onClick={refreshOrders}
                className="bg-red-600 hover:bg-red-700"
              >
                Tentar Novamente
              </Button>
            </div>
          ) : filteredOrders.length === 0 ? (
            // Empty State
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {orders.length === 0 ? 'Nenhum pedido encontrado' : 'Nenhum pedido corresponde aos filtros'}
              </h3>
              <p className="text-gray-600 mb-6">
                {orders.length === 0
                  ? 'Esta loja ainda não recebeu pedidos. Os pedidos aparecerão aqui automaticamente.'
                  : 'Tente ajustar os filtros de busca ou limpar a pesquisa.'
                }
              </p>
              {(searchTerm || statusFilter !== 'all' || paymentFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPaymentFilter('all');
                    setTimeFilter('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          ) : (
            // Orders List - SÓ MOSTRA QUANDO NÃO ESTÁ LOADING E TEM PEDIDOS
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={handleStatusUpdate}
                  onConfirm={handleConfirmOrder}
                  onCancel={handleCancelOrder}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}