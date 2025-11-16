'use client';
import { useState } from 'react';
import { Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ChevronDown, ChevronUp, Eye, Truck, Package, CheckCircle, XCircle } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: Order['status']) => void;
  onConfirm: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  loading?: boolean;
}

export function OrderCard({ order, onStatusUpdate, onConfirm, onCancel, loading = false }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getNextAction = (currentStatus: Order['status']) => {
    const actions = {
      pending: { label: 'Confirmar Pedido', action: () => onConfirm(order.id), color: 'bg-green-600 hover:bg-green-700' },
      confirmed: { label: 'Em Preparação', action: () => onStatusUpdate(order.id, 'preparing'), color: 'bg-blue-600 hover:bg-blue-700' },
      preparing: { label: 'Marcar como Enviado', action: () => onStatusUpdate(order.id, 'shipped'), color: 'bg-purple-600 hover:bg-purple-700' },
      shipped: { label: 'Marcar como Entregue', action: () => onStatusUpdate(order.id, 'delivered'), color: 'bg-indigo-600 hover:bg-indigo-700' },
    };
    return actions[currentStatus as keyof typeof actions];
  };

  const nextAction = getNextAction(order.status);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Pedido #{order.id.slice(-8)}
              </h3>
              <div className="flex space-x-2">
                <StatusBadge status={order.status} type="order" size="sm" />
                <StatusBadge status={order.paymentStatus} type="payment" size="sm" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900">{order.customerInfo.name}</p>
                <p className="text-gray-600">{order.customerInfo.email}</p>
              </div>
              <div>
                <p className="text-gray-600">
                  {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-right md:text-left">
                <p className="text-2xl font-bold text-gray-900">{formatPrice(order.total)}</p>
                <p className="text-sm text-gray-600">{order.items.length} item(s)</p>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4 flex-shrink-0"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200/60 px-6 py-4 space-y-4">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Informações do Cliente</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Nome:</strong> {order.customerInfo.name}</p>
                <p><strong>Email:</strong> {order.customerInfo.email}</p>
                <p><strong>Telefone:</strong> {order.customerInfo.phone}</p>
                {order.customerInfo.address && (
                  <p><strong>Endereço:</strong> {order.customerInfo.address}</p>
                )}
              </div>
            </div>
            
            {/* Order Items */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Itens do Pedido</h4>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      {item.variant && (
                        <p className="text-sm text-gray-600">Variação: {item.variant.optionName}</p>
                      )}
                      <p className="text-sm text-gray-500">Quantidade: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                      <p className="text-sm text-gray-500">{formatPrice(item.price)} cada</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200/60">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Package size={16} />
              <span>ID: {order.id}</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {order.status === 'pending' && (
                <>
                  <Button
                    onClick={() => onConfirm(order.id)}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Confirmar Pedido
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onCancel(order.id)}
                    disabled={loading}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <XCircle size={16} className="mr-2" />
                    Cancelar
                  </Button>
                </>
              )}
              
              {nextAction && order.status !== 'delivered' && order.status !== 'cancelled' && (
                <Button
                  onClick={nextAction.action}
                  disabled={loading}
                  className={nextAction.color}
                >
                  <Truck size={16} className="mr-2" />
                  {nextAction.label}
                </Button>
              )}
              
              {order.status === 'delivered' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle size={20} />
                  <span className="font-medium">Pedido entregue com sucesso</span>
                </div>
              )}
              
              {order.status === 'cancelled' && (
                <div className="flex items-center space-x-2 text-red-600">
                  <XCircle size={20} />
                  <span className="font-medium">Pedido cancelado</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}