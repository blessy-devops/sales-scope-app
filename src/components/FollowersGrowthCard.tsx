import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Users, RefreshCw, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FollowersAnalytics {
  goal: number;
  current_growth: number;
  start_of_month_count: number;
  latest_count: number;
}

interface FollowersGrowthCardProps {
  onOpenGoals?: () => void;
}

export function FollowersGrowthCard({ onOpenGoals }: FollowersGrowthCardProps) {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch } = useQuery({
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
    refetchOnWindowFocus: true,
  });

  const handleRefresh = () => {
    refetch();
  };

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
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive mb-3">Erro ao carregar dados</p>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="w-full">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { goal, current_growth } = data || { goal: 0, current_growth: 0 };
  
  // Check if no goal is defined
  if (goal === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Crescimento de Seguidores (Mês)</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Defina suas metas para começar a acompanhar
            </p>
            <Button onClick={onOpenGoals} variant="outline" size="sm" className="w-full">
              <Target className="w-4 h-4 mr-2" />
              Definir Metas
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentage = goal > 0 ? Math.min((current_growth / goal) * 100, 100) : 0;
  const progressValue = Math.max(0, percentage);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Crescimento de Seguidores (Mês)</CardTitle>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
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