import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FollowersAnalytics {
  goal: number;
  current_growth: number;
  start_of_month_count: number;
  latest_count: number;
}

export function FollowersGrowthCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['followers-analytics'],
    queryFn: async (): Promise<FollowersAnalytics> => {
      const { data, error } = await supabase.functions.invoke('analytics-social-media/followers');
      
      if (error) {
        console.error('Error fetching followers analytics:', error);
        throw new Error(error.message || 'Failed to fetch followers analytics');
      }
      
      return data;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Crescimento de Seguidores (Mês)</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
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
          <CardTitle className="text-sm font-medium">Crescimento de Seguidores (Mês)</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  const { goal, current_growth } = data || { goal: 0, current_growth: 0 };
  const percentage = goal > 0 ? Math.min((current_growth / goal) * 100, 100) : 0;
  const progressValue = Math.max(0, percentage);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Crescimento de Seguidores (Mês)</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">
          {current_growth.toLocaleString()} de {goal.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {percentage.toFixed(1)}% da meta atingida
        </p>
        <Progress value={progressValue} className="w-full" />
      </CardContent>
    </Card>
  );
}