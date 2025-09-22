import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

interface MetricsChartProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
  chartData?: Array<{ date: string; value: number }>;
  className?: string;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({
  title,
  value,
  subtitle,
  change,
  trend = 'neutral',
  icon: Icon,
  chartData = [],
  className
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
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

  return (
    <Card className={cn("border-border/50 shadow-sm hover:shadow-md transition-all duration-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
          </div>
          {change && (
            <Badge 
              variant={trend === 'positive' ? 'default' : trend === 'negative' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                {change}
              </div>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {value}
            </div>
            {subtitle && (
              <div className="text-sm text-muted-foreground">
                {subtitle}
              </div>
            )}
          </div>
          
          {chartData.length > 0 && (
            <div className="h-20 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    hide
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [value, '']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={trend === 'positive' ? 'hsl(var(--emerald-600))' : trend === 'negative' ? 'hsl(var(--red-500))' : 'hsl(var(--primary))'}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
