// components/ui/status-select.tsx
'use client';
import { OrderStatus, PaymentStatus } from '@/types/order';
import { cn } from '@/lib/utils/helpers';
import { ChevronDown } from 'lucide-react';

interface StatusSelectProps {
  value: OrderStatus | PaymentStatus | string;
  onChange: (value: OrderStatus) => void; // ✅ APENAS OrderStatus
  type?: 'order' | 'payment';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const STATUS_CONFIG = {
  order: {
    pending: { label: '⏳ Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    confirmed: { label: '✅ Confirmado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    preparing: { label: '👨‍🍳 Preparando', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    shipped: { label: '🚚 Enviado', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    delivered: { label: '📦 Entregue', color: 'bg-green-100 text-green-800 border-green-200' },
    cancelled: { label: '❌ Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
  },
  payment: {
    pending: { label: '⏳ Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    confirmed: { label: '💳 Pago', color: 'bg-green-100 text-green-800 border-green-200' },
    failed: { label: '⚠️ Falhou', color: 'bg-red-100 text-red-800 border-red-200' },
    refunded: { label: '↩️ Estornado', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  }
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-2',
  lg: 'text-base px-4 py-3'
};

export function StatusSelect({ 
  value, 
  onChange, 
  type = 'order', 
  size = 'md', 
  disabled = false 
}: StatusSelectProps) {
  const config = STATUS_CONFIG[type];
  const currentStatus = config[value as keyof typeof config] || config.pending;

  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as OrderStatus)}
        disabled={disabled}
        className={cn(
          "appearance-none rounded-lg border font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer",
          currentStatus.color,
          SIZE_CLASSES[size],
          disabled 
            ? "opacity-50 cursor-not-allowed" 
            : "hover:shadow-md hover:scale-105",
          "pr-8" // Espaço para a seta
        )}
      >
        {Object.entries(config).map(([statusKey, statusConfig]) => (
          <option 
            key={statusKey} 
            value={statusKey}
            className={cn(
              "bg-white text-gray-900 font-medium",
              statusKey === value && "bg-blue-50 text-blue-900"
            )}
          >
            {statusConfig.label}
          </option>
        ))}
      </select>
      
      {/* Seta customizada */}
      <div className={cn(
        "pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500",
        disabled && "opacity-50"
      )}>
        <ChevronDown size={16} />
      </div>
    </div>
  );
}