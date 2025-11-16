import { cn } from "@/lib/utils/helpers";

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'payment';
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  order: {
    pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    preparing: { label: 'Preparando', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    shipped: { label: 'Enviado', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800 border-green-200' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
  },
  payment: {
    pending: { label: 'Pagamento Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    confirmed: { label: 'Pago', color: 'bg-green-100 text-green-800 border-green-200' },
    failed: { label: 'Falhou', color: 'bg-red-100 text-red-800 border-red-200' },
    refunded: { label: 'Estornado', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  },
} as const;

// Tipos de status automaticamente inferidos
type OrderStatus = keyof typeof statusConfig.order;
type PaymentStatus = keyof typeof statusConfig.payment;

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function StatusBadge({ status, type = 'order', size = 'md' }: StatusBadgeProps) {
  const config = 
    (statusConfig[type] as Record<string, { label: string; color: string }>)?.[status] ||
    { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200' };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border',
        sizeClasses[size],
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
