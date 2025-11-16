import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  color = 'blue' 
}: StatsCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
  };

  const trendColors = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {description && (
                <p className="text-xs text-gray-500">{description}</p>
              )}
              {trend && (
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${trendColors[trend.isPositive ? 'positive' : 'negative']}`}>
                  <span>{trend.isPositive ? '↑' : '↓'}</span>
                  <span className="ml-1">{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg`}>
              <Icon size={24} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}