'use client';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/ui/stats-card';
import Link from 'next/link';
import { Store, Package, ShoppingCart, Users, TrendingUp, ArrowUpRight, Eye, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Store as StoreType, Order } from '@/types';
import { storeServiceNew } from '@/lib/firebase/store-service-new';
import { orderServiceNew } from '@/lib/firebase/firestore-new';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStores: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    monthlyGrowth: 12.5, // Mock data - você pode calcular isso
  });

  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          setLoading(true);
          const userStores = await storeServiceNew.getUserStores(user.id);
          setStores(userStores);

          // Carregar pedidos recentes e estatísticas
          let allOrders: Order[] = [];
          let totalRevenue = 0;
          let totalProducts = 0;

          for (const store of userStores) {
            const storeOrders = await orderServiceNew.getStoreOrders(store.id);
            allOrders = [...allOrders, ...storeOrders];
            
            // Calcular revenue
            storeOrders.forEach(order => {
              if (order.paymentStatus === 'confirmed') {
                totalRevenue += order.total;
              }
            });
          }

          // Ordenar por data e pegar os 5 mais recentes
          const sortedOrders = allOrders.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ).slice(0, 5);

          setRecentOrders(sortedOrders);

          setStats({
            totalStores: userStores.length,
            totalProducts: totalProducts,
            totalOrders: allOrders.length,
            totalRevenue,
            monthlyGrowth: 12.5,
          });

        } catch (error) {
          console.error('Erro ao carregar dados do dashboard:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    loadData();
  }, [user]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Olá, {user?.profile?.displayName || 'Usuário'}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Bem-vindo ao painel de controle da sua plataforma Easy.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard/stores/new">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Nova Loja
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
              <Eye className="w-4 h-4 mr-2" />
              Ver Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Lojas Ativas"
          value={stats.totalStores.toString()}
          description={`+${stats.monthlyGrowth}% este mês`}
          icon={Store}
          color="blue"
          trend={{ value: stats.monthlyGrowth, isPositive: true }}
        />
        
        <StatsCard
          title="Total de Pedidos"
          value={stats.totalOrders.toString()}
          description="Todos os tempos"
          icon={ShoppingCart}
          color="green"
        />
        
        <StatsCard
          title="Receita Total"
          value={formatPrice(stats.totalRevenue)}
          description="Receita confirmada"
          icon={TrendingUp}
          color="purple"
        />
        
        <StatsCard
          title="Produtos Ativos"
          value={stats.totalProducts.toString()}
          description="Em todas as lojas"
          icon={Package}
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Orders & Quick Actions */}
        <div className="xl:col-span-2 space-y-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200/60">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Pedidos Recentes</h2>
                <Link href="/dashboard/orders">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    Ver Todos
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="p-6">
              {recentOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium mb-2">Nenhum pedido recente</p>
                  <p className="text-gray-500 text-sm">Seus pedidos aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200/60 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 group">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                          #{order.id.slice(-4)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                            {order.customerInfo.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-lg">{formatPrice(order.total)}</p>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Stores */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200/60">
              <h2 className="text-xl font-semibold text-gray-900">Ações Rápidas</h2>
            </div>
            <div className="p-6 space-y-4">
              <Link href="/dashboard/stores/new">
                <div className="group p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer text-center">
                  <Store className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
                  <p className="font-semibold text-gray-900 group-hover:text-blue-900">Criar Nova Loja</p>
                  <p className="text-sm text-gray-500 mt-1">Comece a vender online</p>
                </div>
              </Link>
              
              <Link href="/dashboard/products/new">
                <div className="group p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50/50 transition-all duration-200 cursor-pointer text-center">
                  <Package className="w-8 h-8 text-gray-400 group-hover:text-green-500 mx-auto mb-3 transition-colors" />
                  <p className="font-semibold text-gray-900 group-hover:text-green-900">Adicionar Produto</p>
                  <p className="text-sm text-gray-500 mt-1">Cadastre novos produtos</p>
                </div>
              </Link>
              
              <Link href="/dashboard/orders">
                <div className="group p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50/50 transition-all duration-200 cursor-pointer text-center">
                  <ShoppingCart className="w-8 h-8 text-gray-400 group-hover:text-purple-500 mx-auto mb-3 transition-colors" />
                  <p className="font-semibold text-gray-900 group-hover:text-purple-900">Gerenciar Pedidos</p>
                  <p className="text-sm text-gray-500 mt-1">Acompanhe suas vendas</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Stores */}
          {stores.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200/60">
                <h2 className="text-xl font-semibold text-gray-900">Suas Lojas</h2>
              </div>
              <div className="p-6 space-y-4">
                {stores.slice(0, 3).map((store) => (
                  <Link key={store.id} href={`/dashboard/stores/${store.id}`}>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                        {store.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {store.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {store.slug}.easyplatform.com
                        </p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </Link>
                ))}
                
                {stores.length > 3 && (
                  <Link href="/dashboard/stores">
                    <Button variant="outline" className="w-full border-gray-300 hover:border-blue-300 hover:bg-blue-50">
                      Ver Todas as Lojas ({stores.length})
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}