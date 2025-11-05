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
  LogOut 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    { href: '/dashboard', icon: BarChart3, label: 'Visão Geral' },
    { href: '/dashboard/stores', icon: Store, label: 'Minhas Lojas' },
    { href: '/dashboard/products', icon: Package, label: 'Produtos' },
    { href: '/dashboard/orders', icon: ShoppingCart, label: 'Pedidos' },
    { href: '/dashboard/settings', icon: Settings, label: 'Configurações' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-sm">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Easy Platform
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {user?.profile?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.profile?.displayName || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={logout}
          >
            <LogOut size={20} className="mr-3" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}