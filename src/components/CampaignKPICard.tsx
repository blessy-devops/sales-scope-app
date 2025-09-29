import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CampaignKPI } from '@/types/campaign';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Target,
  Percent,
  Calculator
} from 'lucide-react';

interface CampaignKPICardProps {
  kpi: CampaignKPI;
}

const getIcon = (iconName: string) => {
  const icons = {
    revenue: DollarSign,
    sales: ShoppingCart,
    sessions: Users,
    conversion: Target,
    ticket: Calculator,
    cps: Percent,
  };
  
  const IconComponent = icons[iconName as keyof typeof icons] || Target;
  return <IconComponent className="h-4 w-4" />;
};

const formatValue = (value: number, format: CampaignKPI['format']) => {
  switch (format) {
    case 'currency':
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
    default:
      return value.toLocaleString('pt-BR');
  }
};

export function CampaignKPICard({ kpi }: CampaignKPICardProps) {
  const { label, value, goal, percentage, format, icon } = kpi;
  
  const hasGoal = goal !== undefined && goal > 0;
  const progressPercentage = hasGoal ? Math.min((value / goal) * 100, 100) : 0;
  const performancePercentage = percentage || (hasGoal ? (value / goal) * 100 : 0);
  
  const isPositive = performancePercentage >= 100;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {getIcon(icon)}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatValue(value, format)}
        </div>
        
        {hasGoal && (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 mb-1">
              <span>Meta: {formatValue(goal, format)}</span>
              <div className="flex items-center gap-1">
                <TrendIcon className={`h-3 w-3 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                  {performancePercentage.toFixed(0)}%
                </span>
              </div>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2"
            />
          </>
        )}
        
        {!hasGoal && percentage !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            <TrendIcon className={`h-3 w-3 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {performancePercentage.toFixed(1)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}