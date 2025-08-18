import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SalesAnalytics {
  goal: number;
  current_sales_total: number;
}

export function SalesCouponsCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-analytics'],
    queryFn: async (): Promise<SalesAnalytics> => {
      const { data, error } = await supabase.functions.invoke('analytics-social-media/sales');
      
      if (error) {
        console.error('Error fetching sales analytics:', error);
        throw new Error(error.message || 'Failed to fetch sales analytics');
      }
      
      return data;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas com Cupom (Mês)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded w-24 mb-2"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas com Cupom (Mês)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  const { goal, current_sales_total } = data || { goal: 0, current_sales_total: 0 };
  const percentage = goal > 0 ? Math.min((current_sales_total / goal) * 100, 100) : 0;
  const progressValue = Math.max(0, percentage);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Vendas com Cupom (Mês)</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">
          {formatCurrency(current_sales_total)} de {formatCurrency(goal)}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {percentage.toFixed(1)}% da meta atingida
        </p>
        <Progress value={progressValue} className="w-full" />
      </CardContent>
    </Card>
  );
}