import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Instagram, 
  TrendingUp, 
  Users, 
  ShoppingCart,
  Target,
  ArrowRight
} from 'lucide-react';

const SocialMedia = () => {
  const kpis = [
    {
      id: 'followers',
      title: 'Seguidores Totais',
      description: 'Total de seguidores no Instagram',
      icon: Users,
      value: '0',
      change: '+0%',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'growth',
      title: 'Crescimento Mensal',
      description: 'Novos seguidores neste mês',
      icon: TrendingUp,
      value: '0',
      change: '+0%',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      id: 'sales',
      title: 'Vendas via Social Media',
      description: 'Total de vendas vindas das redes sociais',
      icon: ShoppingCart,
      value: 'R$ 0',
      change: '+0%',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      id: 'goals',
      title: 'Meta do Mês',
      description: 'Progresso das metas mensais',
      icon: Target,
      value: '0%',
      change: 'Meta: 0',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl">
            <Instagram className="w-6 h-6 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Análise de Social Media
            </h1>
            <p className="text-muted-foreground text-lg">
              Acompanhe o desempenho das suas redes sociais e vendas
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const IconComponent = kpi.icon;
          
          return (
            <Card 
              key={kpi.id}
              className="group relative overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${kpi.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                    <IconComponent className={`w-6 h-6 ${kpi.iconColor}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Em breve
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">
                    {kpi.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {kpi.description}
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-foreground">
                    {kpi.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {kpi.change}
                  </div>
                </div>
              </CardContent>
              
              {/* Background Gradient Overlay */}
              <div className={`
                absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none
                ${kpi.color}
              `} />
            </Card>
          );
        })}
      </div>

      {/* Coming Soon Info */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Funcionalidade em Desenvolvimento</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Esta seção está sendo desenvolvida para trazer análises completas das suas redes sociais, 
                incluindo métricas de seguidores, performance de cupons e conversão de vendas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialMedia;