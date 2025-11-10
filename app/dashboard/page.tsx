'use client';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Store, Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Store as StoreType, Order } from '@/types';
import { storeServiceNew } from '@/lib/firebase/store-service-new';
import { orderServiceNew } from '@/lib/firebase/firestore-new';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalStores: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
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
            totalProducts: totalProducts, // Você pode implementar a contagem de produtos
            totalOrders: allOrders.length,
            totalRevenue,
          });

        } catch (error) {
          console.error('Erro ao carregar dados do dashboard:', error);
        }
      }
    }

    loadData();
  }, [user]);

  const statsData = [
    { label: 'Lojas Ativas', value: stats.totalStores.toString(), icon: Store, color: 'blue' },
    { label: 'Pedidos', value: stats.totalOrders.toString(), icon: ShoppingCart, color: 'green' },
    { label: 'Receita Total', value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'purple' },
    { label: 'Produtos', value: stats.totalProducts.toString(), icon: Package, color: 'orange' },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Olá, {user?.profile?.displayName || 'Usuário'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Bem-vindo ao painel de controle da sua plataforma Easy.
          </p>
        </div>
        <Link href="/dashboard/stores/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Store className="w-4 h-4 mr-2" />
            Nova Loja
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            purple: 'bg-purple-50 text-purple-600',
            orange: 'bg-orange-50 text-orange-600',
          }[stat.color];

          return (
            <div key={stat.label} className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${colorClasses}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Pedidos Recentes</h2>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum pedido recente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center border-b pb-4 last:border-b-0 last:pb-0">
                  <div>
                    <p className="font-medium">Pedido #{order.id.slice(-8)}</p>
                    <p className="text-sm text-gray-600">{order.customerInfo.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(order.total)}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status === 'pending' && 'Pendente'}
                      {order.status === 'confirmed' && 'Confirmado'}
                      {order.status === 'delivered' && 'Entregue'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/orders">
            <Button variant="outline" className="w-full mt-4">
              Ver Todos os Pedidos
            </Button>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
          <div className="space-y-3">
            <Link href="/dashboard/stores/new">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                <Store className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Criar Nova Loja</p>
                <p className="text-sm text-gray-500">Comece a vender online</p>
              </div>
            </Link>
            
            <Link href="/dashboard/products/new">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer">
                <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Adicionar Produto</p>
                <p className="text-sm text-gray-500">Cadastre novos produtos</p>
              </div>
            </Link>
            
            <Link href="/dashboard/orders">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer">
                <ShoppingCart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Gerenciar Pedidos</p>
                <p className="text-sm text-gray-500">Acompanhe suas vendas</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}