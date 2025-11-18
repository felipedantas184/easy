// components/ui/order-card.tsx - VERSÃO COM STATUSSELECT
'use client';
import { useState } from 'react';
import { Order, OrderStatus } from '@/types/order';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatusSelect } from '@/components/ui/status-select';
import { 
  ChevronDown, 
  ChevronUp, 
  Truck, 
  Package, 
  CheckCircle, 
  XCircle,
  User,
  Phone,
  MapPin,
  Calendar,
  ShoppingCart,
  CreditCard,
  Edit3,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: Order['status']) => Promise<void>;
  onConfirm: (orderId: string) => Promise<void>;
  onCancel: (orderId: string) => Promise<void>;
}

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', label: 'Pendente' },
  confirmed: { color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', label: 'Confirmado' },
  preparing: { color: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50', label: 'Preparando' },
  shipped: { color: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50', label: 'Enviado' },
  delivered: { color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', label: 'Entregue' },
  cancelled: { color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', label: 'Cancelado' },
};

export function OrderCard({ order, onStatusUpdate, onConfirm, onCancel }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAction = async (action: () => Promise<void>, actionName: string) => {
    setIsActionLoading(actionName);
    try {
      await action();
    } catch (error) {
      console.error(`Erro na ação ${actionName}:`, error);
      alert('Erro ao executar ação. Tente novamente.');
    } finally {
      setIsActionLoading(null);
    }
  };

  // NOVO: Handler para mudança de status via select
  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === order.status) return;
    
    setIsStatusUpdating(true);
    try {
      await onStatusUpdate(order.id, newStatus);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do pedido.');
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleConfirmOrder = () => {
    handleAction(() => onConfirm(order.id), 'confirm');
  };

  const handleCancelOrder = () => {
    if (confirm('Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.')) {
      handleAction(() => onCancel(order.id), 'cancel');
    }
  };

  const getStatusProgress = () => {
    const progressStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
    
    if (!progressStatuses.includes(order.status)) {
      return {
        currentStep: 0,
        totalSteps: STATUS_FLOW.length,
        percentage: 0
      };
    }

    const currentIndex = STATUS_FLOW.indexOf(order.status);
    return {
      currentStep: currentIndex + 1,
      totalSteps: STATUS_FLOW.length,
      percentage: ((currentIndex + 1) / STATUS_FLOW.length) * 100
    };
  };

  const progress = getStatusProgress();

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      {/* Header - Compact View */}
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Left Section */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  #{order.id.slice(-8).toUpperCase()}
                </h3>
                <div className="hidden sm:flex gap-2">
                  <StatusBadge status={order.status} type="order" size="sm" />
                  <StatusBadge status={order.paymentStatus} type="payment" size="sm" />
                </div>
              </div>
              
              {/* Mobile Status Badges */}
              <div className="flex sm:hidden gap-2">
                <StatusBadge status={order.status} type="order" size="sm" />
                <StatusBadge status={order.paymentStatus} type="payment" size="sm" />
              </div>
            </div>

            {/* Customer & Date Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <User size={16} className="text-gray-400" />
                <span className="truncate">{order.customerInfo.name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} className="text-gray-400" />
                <span>{formatDate(order.createdAt)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <ShoppingCart size={16} className="text-gray-400" />
                <span>{order.items.length} item(s)</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-gray-400" />
                <span className="font-semibold text-gray-900">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Progress Indicator */}
            {order.status !== 'cancelled' && (
              <div className="hidden sm:flex flex-col items-end gap-1">
                <div className="text-xs text-gray-500">
                  {progress.currentStep}/{progress.totalSteps}
                </div>
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      STATUS_CONFIG[order.status].color
                    )}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Expand Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 hover:bg-gray-100 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp size={20} className="text-gray-600" />
              ) : (
                <ChevronDown size={20} className="text-gray-600" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200/60 px-4 sm:px-6 py-4 space-y-6 bg-gray-50/50">
          {/* Customer & Order Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User size={18} className="text-gray-400" />
                <h4 className="font-semibold text-gray-900">Informações do Cliente</h4>
              </div>
              
              <div className="bg-white rounded-xl p-4 space-y-3 border border-gray-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{order.customerInfo.name}</p>
                    <p className="text-sm text-gray-600 truncate">{order.customerInfo.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} />
                    <span>{order.customerInfo.phone}</span>
                  </div>
                  
                  {order.customerInfo.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={16} />
                      <span className="truncate">{order.customerInfo.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-gray-400" />
                <h4 className="font-semibold text-gray-900">Itens do Pedido</h4>
              </div>
              
              <div className="bg-white rounded-xl p-4 space-y-3 border border-gray-200/60 max-h-64 overflow-y-auto">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package size={16} className="text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                        {item.variant && (
                          <p className="text-sm text-gray-600 truncate">{item.variant.optionName}</p>
                        )}
                        <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                      <p className="text-xs text-gray-500">{formatPrice(item.price)} un</p>
                    </div>
                  </div>
                ))}
                
                {/* Order Summary */}
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      {formatPrice(order.breakdown?.subtotal || order.total)}
                    </span>
                  </div>
                  
                  {(order.breakdown?.shippingCost || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frete:</span>
                      <span className="font-medium">
                        {formatPrice(order.breakdown?.shippingCost || 0)}
                      </span>
                    </div>
                  )}
                  
                  {(order.breakdown?.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto:</span>
                      <span className="font-medium">
                        -{formatPrice(order.breakdown?.discountAmount || 0)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - VERSÃO COM STATUSSELECT */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200/60">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Criado em {formatDate(order.createdAt)}</span>
              </div>
              {order.updatedAt.getTime() !== order.createdAt.getTime() && (
                <div className="flex items-center gap-2">
                  <Edit3 size={16} />
                  <span>Atualizado em {formatDate(order.updatedAt)}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              {/* Payment Status */}
              {order.status !== 'pending' && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Pagamento:
                </span>
                <StatusSelect
                  value={order.paymentStatus}
                  onChange={(newStatus) => {
                    // Implementar atualização de status de pagamento se necessário
                    console.log('Mudar status de pagamento para:', newStatus);
                  }}
                  type="payment"
                  size="md"
                  disabled={order.paymentStatus === 'refunded'}
                />
              </div>
              )}
              
              {/* Status Select - NOVA IMPLEMENTAÇÃO */}
              {order.status !== 'pending' && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Status:
                </span>
                <div className="relative">
                  <StatusSelect
                    value={order.status}
                    onChange={handleStatusChange}
                    type="order"
                    size="md"
                    disabled={isStatusUpdating || order.status === 'cancelled' || order.status === 'delivered'}
                  />
                  {isStatusUpdating && (
                    <div className="absolute -right-6 top-1/2 transform -translate-y-1/2">
                      <RefreshCw size={16} className="animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Ações Especiais */}
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <Button
                    onClick={handleConfirmOrder}
                    disabled={isActionLoading === 'confirm'}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    {isActionLoading === 'confirm' ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle size={16} className="mr-2" />
                    )}
                    Confirmar
                  </Button>
                )}
                
                {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing') && (
                  <Button
                    variant="outline"
                    onClick={handleCancelOrder}
                    disabled={isActionLoading === 'cancel'}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    size="sm"
                  >
                    {isActionLoading === 'cancel' ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <XCircle size={16} className="mr-2" />
                    )}
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}