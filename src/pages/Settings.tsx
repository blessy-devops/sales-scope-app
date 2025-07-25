import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Save, Settings as SettingsIcon } from 'lucide-react';

interface DashboardConfig {
  showRealizadoGlobal: boolean;
  showMetaGlobal: boolean;
  showGapPercent: boolean;
  showGapValue: boolean;
  showMetaDiariaOriginal: boolean;
  showMetaDiariaAjustada: boolean;
  showChart: boolean;
  showChannelGrid: boolean;
}

const Settings = () => {
  const { toast } = useToast();
  
  const [config, setConfig] = useState<DashboardConfig>({
    showRealizadoGlobal: true,
    showMetaGlobal: true,
    showGapPercent: true,
    showGapValue: true,
    showMetaDiariaOriginal: true,
    showMetaDiariaAjustada: true,
    showChart: true,
    showChannelGrid: true,
  });

  const [loading, setLoading] = useState(false);

  const handleConfigChange = (key: keyof DashboardConfig, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveConfiguration = async () => {
    setLoading(true);
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aqui você salvaria no Supabase ou localStorage
      localStorage.setItem('dashboardConfig', JSON.stringify(config));
      
      toast({
        title: 'Configurações salvas',
        description: 'Suas preferências foram atualizadas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const configItems = [
    {
      key: 'showRealizadoGlobal' as const,
      label: 'Realizado Global',
      description: 'Mostra o total de vendas realizadas no mês atual'
    },
    {
      key: 'showMetaGlobal' as const,
      label: 'Meta Global',
      description: 'Mostra a meta total definida para o mês'
    },
    {
      key: 'showGapPercent' as const,
      label: 'GAP %',
      description: 'Mostra a diferença percentual entre realizado e meta'
    },
    {
      key: 'showGapValue' as const,
      label: 'GAP R$',
      description: 'Mostra a diferença em reais entre realizado e meta'
    },
    {
      key: 'showMetaDiariaOriginal' as const,
      label: 'Meta Diária Original',
      description: 'Meta total dividida pelos dias do mês'
    },
    {
      key: 'showMetaDiariaAjustada' as const,
      label: 'Meta Diária Ajustada',
      description: 'Meta ajustada pelos dias restantes do mês'
    },
    {
      key: 'showChart' as const,
      label: 'Gráfico de Evolução',
      description: 'Gráfico de linha mostrando evolução das vendas'
    },
    {
      key: 'showChannelGrid' as const,
      label: 'Grid de Canais',
      description: 'Cards com desempenho individual de cada canal'
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Dashboard Configuration */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Elementos do Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {configItems.map((item, index) => (
              <div key={item.key}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor={item.key} className="text-base font-medium">
                      {item.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <Switch
                    id={item.key}
                    checked={config[item.key]}
                    onCheckedChange={(checked) => handleConfigChange(item.key, checked)}
                  />
                </div>
                {index < configItems.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
            
            <div className="pt-4">
              <Button 
                onClick={saveConfiguration}
                disabled={loading}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Integration Settings */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Integrações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                <h3 className="font-medium mb-2">Supabase Database</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Para ativar funcionalidades como atualização em tempo real, 
                  backup automático e sincronização entre dispositivos, 
                  conecte sua conta Supabase.
                </p>
                <Button variant="outline" disabled>
                  Conectar Supabase
                </Button>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                <h3 className="font-medium mb-2">Notificações Push</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Receba alertas sobre metas, prazos e atualizações importantes.
                </p>
                <Button variant="outline" disabled>
                  Configurar Notificações
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;