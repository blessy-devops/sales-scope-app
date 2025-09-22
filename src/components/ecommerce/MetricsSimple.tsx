import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsSimpleProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  type?: 'modern' | 'classic';
  icon?: React.ComponentType<{ className?: string }>;
  footer?: React.ReactNode;
  className?: string;
}

export const MetricsSimple: React.FC<MetricsSimpleProps> = ({
  title,
  value,
  subtitle,
  change,
  trend = 'neutral',
  type = 'modern',
  icon: Icon,
  footer,
  className
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'positive':
        return <ArrowUp className="h-3 w-3" />;
      case 'negative':
        return <ArrowDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'positive':
        return 'text-emerald-600';
      case 'negative':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTrendBgColor = () => {
    switch (trend) {
      case 'positive':
        return 'bg-emerald-50 text-emerald-700';
      case 'negative':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <Card className={cn(
      "border-border/50 shadow-sm hover:shadow-md transition-all duration-200",
      type === 'modern' && "bg-gradient-to-br from-background to-muted/20",
      className
    )}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
              <span className="text-sm font-medium text-muted-foreground">
                {title}
              </span>
            </div>
            {change && (
              <Badge 
                variant="outline" 
                className={cn("text-xs px-2 py-1", getTrendBgColor())}
              >
                <div className="flex items-center gap-1">
                  {getTrendIcon()}
                  {change}
                </div>
              </Badge>
            )}
          </div>

          {/* Value */}
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {value}
            </div>
            {subtitle && (
              <div className="text-sm text-muted-foreground">
                {subtitle}
              </div>
            )}
          </div>

          {/* Footer */}
          {footer && (
            <div className="pt-2 border-t border-border/50">
              {footer}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
