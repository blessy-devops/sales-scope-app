import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body and format dates correctly
    const { startDate: startIso, endDate: endIso } = await req.json();

    if (!startIso || !endIso) {
      return new Response(
        JSON.stringify({ error: 'startDate and endDate parameters are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Format dates to YYYY-MM-DD format that SQL expects
    const startDate = new Date(startIso).toISOString().split('T')[0];
    const endDate = new Date(endIso).toISOString().split('T')[0];

    // Log the parameters being sent to RPC
    console.log('[Attendant Analytics] Chamando RPC com parâmetros:', { start_date: startDate, end_date: endDate });

    // Call the new RPC function to get attendant sales data
    const { data: salesData, error: rpcError } = await supabaseAdmin
      .rpc('get_attendant_sales_by_period', {
        start_date: startDate,
        end_date: endDate
      });

    if (rpcError) {
      console.error('[Attendant Analytics] Erro na chamada RPC:', rpcError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch attendant sales data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[Attendant Analytics] Sucesso! RPC retornou ${(salesData || []).length} linhas.`);

    // Process the RPC data
    const processedSales = salesData || [];

    // Calculate KPIs
    const totalRevenue = processedSales.reduce((sum: number, sale: any) => sum + (parseFloat(sale.total_revenue) || 0), 0);
    const totalSales = processedSales.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate daily series
    const dailyRevenue = new Map();
    processedSales.forEach((sale: any) => {
      const date = sale.sale_date;
      const revenue = parseFloat(sale.total_revenue) || 0;
      dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + revenue);
    });

    const dailySeries = Array.from(dailyRevenue.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate attendant ranking
    const attendantStats = new Map();
    
    processedSales.forEach((sale: any) => {
      const attendantName = sale.attendant_name;
      const stats = attendantStats.get(attendantName) || {
        name: attendantName,
        revenue: 0,
        sales: 0
      };
      
      stats.revenue += parseFloat(sale.total_revenue) || 0;
      stats.sales += 1;
      attendantStats.set(attendantName, stats);
    });

    const attendantRanking = Array.from(attendantStats.values())
      .sort((a, b) => b.revenue - a.revenue);

    // Get recent sales
    const recentSales = processedSales
      .map((sale: any) => ({
        date: sale.sale_date,
        attendantName: sale.attendant_name,
        orderNumber: sale.order_number,
        value: parseFloat(sale.total_revenue) || 0
      }))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20); // Get last 20 sales

    // Return structured response
    const response = {
      kpis: {
        totalRevenue,
        totalSales,
        averageTicket
      },
      dailySeries,
      attendantRanking,
      recentSales
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in get-attendant-sales-analytics:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});