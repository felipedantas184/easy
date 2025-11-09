// components/ui/badge.tsx - NOVO COMPONENTE
import { cn } from '@/lib/utils/helpers';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ children, variant = 'default', className, style }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full';
  
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-gray-300 text-gray-700',
    success: 'bg-green-100 text-green-800',
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} style={style}>
      {children}
    </div>
  );
}