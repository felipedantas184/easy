'use client';
import { DiscountCoupon } from '@/types/discount';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Copy, Eye, EyeOff, Calendar } from 'lucide-react';
import { DiscountValidator } from '@/lib/discount/discount-validator';

interface CouponTableProps {
  coupons: DiscountCoupon[];
  loading?: boolean;
  onEdit: (coupon: DiscountCoupon) => void;
  onDelete: (couponId: string) => void;
  onRefresh: () => void;
}

export function CouponTable({ coupons, loading, onEdit, onDelete, onRefresh }: CouponTableProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const isExpired = (coupon: DiscountCoupon) => {
    return new Date() > coupon.validUntil;
  };

  const isActive = (coupon: DiscountCoupon) => {
    return coupon.isActive && !isExpired(coupon);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (coupon: DiscountCoupon) => {
    if (!coupon.isActive) return 'bg-gray-100 text-gray-800';
    if (isExpired(coupon)) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (coupon: DiscountCoupon) => {
    if (!coupon.isActive) return 'Inativo';
    if (isExpired(coupon)) return 'Expirado';
    return 'Ativo';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
            <div className="w-24 h-6 bg-gray-200 rounded"></div>
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
            <div className="w-20 h-6 bg-gray-200 rounded"></div>
            <div className="w-16 h-6 bg-gray-200 rounded ml-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎫</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum cupom criado
        </h3>
        <p className="text-gray-600 mb-4">
          Crie seu primeiro cupom de desconto para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cupom
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Desconto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Validade
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Usos
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {coupons.map((coupon) => (
            <tr key={coupon.id} className="hover:bg-gray-50">
              {/* Código do Cupom */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-semibold text-gray-900">
                    {coupon.code}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(coupon.code)}
                  >
                    <Copy size={14} />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {coupon.description}
                </p>
              </td>

              {/* Desconto */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {DiscountValidator.formatCouponDescription(coupon)}
                </div>
                {coupon.minOrderValue && (
                  <div className="text-xs text-gray-500">
                    Mín: R$ {coupon.minOrderValue.toFixed(2)}
                  </div>
                )}
              </td>

              {/* Validade */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-1 text-sm text-gray-900">
                  <Calendar size={14} />
                  <span>até {formatDate(coupon.validUntil)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  desde {formatDate(coupon.validFrom)}
                </div>
              </td>

              {/* Usos */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {coupon.usedCount}
                  {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                </div>
                {coupon.usageLimit && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full" 
                      style={{ width: `${(coupon.usedCount / coupon.usageLimit) * 100}%` }}
                    ></div>
                  </div>
                )}
              </td>

              {/* Status */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(coupon)}`}>
                  {getStatusText(coupon)}
                </span>
              </td>

              {/* Ações */}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(coupon)}
                  >
                    <Edit size={14} />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(coupon.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}