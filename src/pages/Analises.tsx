import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Calendar,
  Users,
  Target,
  ArrowRight,
  Clock,
  Activity
} from 'lucide-react';

const Analises = () => {
  const navigate = useNavigate();

  const reports = [
    {
      id: 'performance-diaria',
      title: 'Performance Diária por Canal',
      description: 'Análise detalhada do desempenho de vendas por canal de venda',
      icon: TrendingUp,
      available: true,
      path: '/analises/performance-diaria',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'sazonalidade',
      title: 'Análise de Sazonalidade por Canal',
      description: 'Analise padrões de vendas por dia da semana e do mês',
      icon: Activity,
      available: true,
      path: '/analises/sazonalidade',
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      id: 'comparativo-mensal',
      title: 'Comparativo Mensal',
      description: 'Compare o desempenho entre diferentes períodos mensais',
      icon: BarChart3,
      available: false,
      path: '/analises/comparativo-mensal',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      id: 'distribuicao-vendas',
      title: 'Distribuição de Vendas',
      description: 'Visualize a distribuição percentual das vendas por canal',
      icon: PieChart,
      available: false,
      path: '/analises/distribuicao-vendas',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      id: 'tendencias',
      title: 'Análise de Tendências',
      description: 'Identifique padrões e tendências nas suas vendas',
      icon: LineChart,
      available: false,
      path: '/analises/tendencias',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      id: 'calendario-vendas',
      title: 'Calendário de Vendas',
      description: 'Visualização em calendário das vendas diárias',
      icon: Calendar,
      available: false,
      path: '/analises/calendario-vendas',
      color: 'bg-gradient-to-br from-teal-500 to-teal-600',
      iconBg: 'bg-teal-100 dark:bg-teal-900/30',
      iconColor: 'text-teal-600 dark:text-teal-400'
    },
    {
      id: 'analise-metas',
      title: 'Análise de Metas',
      description: 'Acompanhe o progresso e alcance das suas metas',
      icon: Target,
      available: false,
      path: '/analises/analise-metas',
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400'
    }
  ];

  const handleCardClick = (report: typeof reports[0]) => {
    if (report.available) {
      navigate(report.path);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Central de Análises
        </h1>
        <p className="text-muted-foreground text-lg">
          Acesse relatórios e análises detalhadas do seu desempenho de vendas
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const IconComponent = report.icon;
          
          return (
            <Card 
              key={report.id}
              className={`
                group relative overflow-hidden border transition-all duration-300 hover:shadow-lg
                ${report.available 
                  ? 'cursor-pointer hover:border-primary/50 hover:-translate-y-1' 
                  : 'opacity-75 cursor-not-allowed'
                }
              `}
              onClick={() => handleCardClick(report)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${report.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                    <IconComponent className={`w-6 h-6 ${report.iconColor}`} />
                  </div>
                  {report.available ? (
                    <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Disponível
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      Em breve
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {report.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                    {report.description}
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {report.available ? (
                      <Button 
                        size="sm" 
                        className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        Acessar Relatório
                        <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        disabled
                        className="cursor-not-allowed"
                      >
                        Em Desenvolvimento
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
              
              {/* Background Gradient Overlay */}
              {report.available && (
                <div className={`
                  absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none
                  ${report.color}
                `} />
              )}
            </Card>
          );
        })}
      </div>
      
      {/* Footer Info */}
      <Card className="mt-8 bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Novos Relatórios em Desenvolvimento</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Estamos trabalhando constantemente para trazer novos insights e análises para seu negócio. 
                Os relatórios marcados como "Em breve" estarão disponíveis nas próximas atualizações.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analises;