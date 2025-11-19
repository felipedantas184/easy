'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  Store,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Tag,
  X,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/helpers';
import { Store as StoreType } from '@/types';
import { storeServiceNew } from '@/lib/firebase/store-service-new';

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ isOpen = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);

  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          const userStores = await storeServiceNew.getUserStores(user.id);
          setStores(userStores);
        } catch (error) {
          console.error('Erro ao carregar dados do dashboard:', error);
        }
      }
    }

    loadData();
  }, [user]);

  const menuItems = [
    {
      href: '/dashboard',
      icon: BarChart3,
      label: 'Visão Geral',
      exact: true
    },
    {
      href: '/dashboard/stores',
      icon: Store,
      label: 'Minhas Lojas',
      subItems: [
        { href: '/dashboard/stores', label: 'Todas as Lojas' },
        ...(stores && stores.length === 0 ? [{ href: '/dashboard/stores/new', label: 'Criar Loja' }] : [])
      ]
    },
    {
      href: '/dashboard/products',
      icon: Package,
      label: 'Produtos',
      subItems: [
        { href: '/dashboard/products', label: 'Todos os Produtos' },
        { href: '/dashboard/products/new', label: 'Adicionar Produto' },
      ]
    },
    {
      href: '/dashboard/orders',
      icon: ShoppingCart,
      label: 'Pedidos'
    },
    {
      href: '/dashboard/coupons',
      icon: Tag,
      label: 'Cupons'
    },
    {
      href: '/dashboard/settings',
      icon: Settings,
      label: 'Configurações'
    },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const hasSubItems = (item: any) => item.subItems && item.subItems.length > 0;

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-sm border-r shadow-xl transform transition-transform duration-300 ease-in-out",
        "lg:translate-x-0 lg:bg-white/80",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200/60">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Easy Platform
                </span>
              </Link>

              {/* Close button for mobile */}
              <button
                onClick={onClose}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200/60 bg-gradient-to-r from-blue-50/50 to-purple-50/50 mx-4 my-4 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold text-lg">
                  {user?.profile?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.profile?.displayName || 'Usuário'}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {user?.email}
                </p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              const hasSubs = hasSubItems(item);
              const isExpanded = expandedItems.includes(item.href);

              return (
                <div key={item.href}>
                  {hasSubs ? (
                    <div
                      onClick={() => toggleExpanded(item.href)}
                      className={cn(
                        "flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group",
                        active
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                          : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon size={20} className={active ? "text-white" : "text-gray-500"} />
                        <span>{item.label}</span>
                      </div>

                      <ChevronRight
                        size={16}
                        className={cn(
                          "transition-transform duration-200",
                          isExpanded ? "rotate-90" : "rotate-0",
                          active ? "text-white" : "text-gray-400"
                        )}
                      />
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                        active
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                          : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon size={20} className={active ? "text-white" : "text-gray-500"} />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  )}

                  {/* Sub-items */}
                  {hasSubs && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems!.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200",
                            isActive(subItem.href, true)
                              ? "bg-blue-100 text-blue-700 font-medium"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                          )}
                        >
                          <div className="w-1 h-1 bg-current rounded-full mr-3 opacity-60"></div>
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200/60">
            <Button
              variant="outline"
              className="w-full justify-start py-3 rounded-xl border-gray-300 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
              onClick={logout}
            >
              <LogOut size={20} className="mr-3" />
              Sair da Plataforma
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}