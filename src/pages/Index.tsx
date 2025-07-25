import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Target, 
  ShoppingBag, 
  TrendingUp,
  Users,
  DollarSign,
  ArrowRight
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Vendas Hoje',
      value: 'R$ 12.450',
      change: '+12%',
      positive: true,
      icon: DollarSign,
    },
    {
      title: 'Meta do Mês',
      value: '78%',
      change: '+5%',
      positive: true,
      icon: Target,
    },
    {
      title: 'Canais Ativos',
      value: '7',
      change: '+1',
      positive: true,
      icon: ShoppingBag,
    },
    {
      title: 'Conversão',
      value: '3.2%',
      change: '-0.1%',
      positive: false,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard de Vendas</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho das suas vendas vs metas
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="border border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {stat.value}
                      </p>
                      <Badge 
                        variant={stat.positive ? "default" : "destructive"}
                        className="mt-2"
                      >
                        {stat.change}
                      </Badge>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border border-border/50 hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Canais de Venda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Gerencie seus canais de venda e monitore o desempenho
              </p>
              <Button 
                onClick={() => navigate('/channels')}
                className="w-full gap-2"
              >
                Acessar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Metas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Configure e acompanhe suas metas de vendas mensais
              </p>
              <Button 
                onClick={() => navigate('/targets')}
                className="w-full gap-2"
              >
                Acessar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Lançar Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Registre vendas diárias e acompanhe resultados em tempo real
              </p>
              <Button 
                onClick={() => navigate('/sales')}
                className="w-full gap-2"
              >
                Acessar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
