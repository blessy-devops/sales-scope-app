import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'
import { format, subDays } from 'https://esm.sh/date-fns@4.1.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Channel {
  id: string;
  name: string;
  is_active: boolean;
}

interface DailySale {
  id: string;
  channel_id: string;
  sale_date: string;
  amount: number;
}

interface DetectedAnomaly {
  channel_id: string;
  type: 'QUEDA_ABRUPTA' | 'PICO_VENDAS' | 'SEM_VENDAS' | 'META_DISTANTE';
  severity: 'CRITICA' | 'ALTA' | 'MEDIA' | 'INFO';
  message: string;
  current_value: number;
  expected_value: number;
  variation_percentage: number;
  detected_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    console.log('Iniciando detecção de anomalias...');

    // Buscar canais ativos
    const { data: channels, error: channelsError } = await supabaseClient
      .from('channels')
      .select('*')
      .eq('is_active', true);

    if (channelsError) {
      console.error('Erro ao buscar canais:', channelsError);
      throw channelsError;
    }

    console.log(`Encontrados ${channels?.length || 0} canais ativos`);

    // Buscar vendas dos últimos 31 dias
    const today = new Date();
    const thirtyOneDaysAgo = format(subDays(today, 31), 'yyyy-MM-dd');
    
    const { data: sales, error: salesError } = await supabaseClient
      .from('daily_sales')
      .select('*')
      .gte('sale_date', thirtyOneDaysAgo);

    if (salesError) {
      console.error('Erro ao buscar vendas:', salesError);
      throw salesError;
    }

    console.log(`Encontradas ${sales?.length || 0} vendas nos últimos 31 dias`);

    const anomalias: DetectedAnomaly[] = [];
    const ontem = format(subDays(today, 1), 'yyyy-MM-dd');

    // Processar cada canal
    for (const canal of channels || []) {
      console.log(`Processando canal: ${canal.name}`);

      // Pegar vendas dos últimos 30 dias (excluindo hoje)
      const vendas30Dias = (sales || [])
        .filter(sale => 
          sale.channel_id === canal.id && 
          sale.sale_date !== format(today, 'yyyy-MM-dd') &&
          new Date(sale.sale_date) >= subDays(today, 31)
        )
        .map(sale => sale.amount);

      // Pegar venda de ontem
      const vendaOntem = (sales || []).find(sale => 
        sale.channel_id === canal.id && 
        sale.sale_date === ontem
      );

      if (vendas30Dias.length === 0) {
        console.log(`Canal ${canal.name} não tem histórico suficiente`);
        continue;
      }

      const media30Dias = vendas30Dias.reduce((sum, val) => sum + val, 0) / vendas30Dias.length;
      const valorOntem = vendaOntem?.amount || 0;
      const variacaoPercentual = media30Dias > 0 
        ? ((valorOntem - media30Dias) / media30Dias) * 100 
        : 0;

      console.log(`Canal ${canal.name}: valor ontem ${valorOntem}, média 30 dias ${media30Dias}, variação ${variacaoPercentual}%`);

      // Detectar queda abrupta
      if (variacaoPercentual < -30) {
        anomalias.push({
          channel_id: canal.id,
          type: 'QUEDA_ABRUPTA',
          severity: variacaoPercentual < -50 ? 'CRITICA' : 'ALTA',
          message: `${canal.name} caiu ${Math.abs(variacaoPercentual).toFixed(0)}% vs média de 30 dias`,
          current_value: valorOntem,
          expected_value: media30Dias,
          variation_percentage: variacaoPercentual,
          detected_at: ontem
        });
      }

      // Detectar pico de vendas
      if (variacaoPercentual > 100) {
        anomalias.push({
          channel_id: canal.id,
          type: 'PICO_VENDAS',
          severity: 'INFO',
          message: `${canal.name} teve pico de ${variacaoPercentual.toFixed(0)}% acima da média`,
          current_value: valorOntem,
          expected_value: media30Dias,
          variation_percentage: variacaoPercentual,
          detected_at: ontem
        });
      }

      // Detectar ausência de vendas
      if (valorOntem === 0 && media30Dias > 0) {
        anomalias.push({
          channel_id: canal.id,
          type: 'SEM_VENDAS',
          severity: 'ALTA',
          message: `${canal.name} não registrou vendas ontem`,
          current_value: valorOntem,
          expected_value: media30Dias,
          variation_percentage: -100,
          detected_at: ontem
        });
      }
    }

    console.log(`Detectadas ${anomalias.length} anomalias`);

    // Verificar quais anomalias já existem
    if (anomalias.length > 0) {
      const { data: existingAnomalies } = await supabaseClient
        .from('anomaly_logs')
        .select('channel_id, type, detected_at')
        .eq('detected_at', ontem);

      // Filtrar anomalias que ainda não foram salvas
      const newAnomalies = anomalias.filter(anomaly => {
        return !existingAnomalies?.some(existing => 
          existing.channel_id === anomaly.channel_id &&
          existing.type === anomaly.type &&
          existing.detected_at === anomaly.detected_at
        );
      });

      console.log(`${newAnomalies.length} novas anomalias para salvar`);

      // Salvar novas anomalias
      if (newAnomalies.length > 0) {
        const { error: insertError } = await supabaseClient
          .from('anomaly_logs')
          .insert(newAnomalies);

        if (insertError) {
          console.error('Erro ao salvar anomalias:', insertError);
          throw insertError;
        }

        console.log('Anomalias salvas com sucesso');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed_channels: channels?.length || 0,
        detected_anomalies: anomalias.length,
        message: 'Detecção de anomalias concluída'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro na detecção de anomalias:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})