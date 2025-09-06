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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'startDate and endDate parameters are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Define São Paulo timezone window
    const startTs = `${startDate} 00:00:00`;
    const endTs = `${endDate} 23:59:59.999`;

    // Query shopify orders filtered by utm_medium containing 'atendimento'
    const { data: orders, error: ordersError } = await supabase
      .from('shopify_orders_gold')
      .select(`
        id,
        order_number,
        total_price,
        utm_medium,
        created_at,
        financial_status
      `)
      .gte('created_at', `${startTs} America/Sao_Paulo`)
      .lte('created_at', `${endTs} America/Sao_Paulo`)
      .ilike('utm_medium', '%atendimento%')
      .eq('financial_status', 'paid')
      .eq('test', false);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orders' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Query all attendants
    const { data: attendants, error: attendantsError } = await supabase
      .from('attendants')
      .select('*');

    if (attendantsError) {
      console.error('Error fetching attendants:', attendantsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch attendants' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process data
    const processedOrders = orders || [];
    const processedAttendants = attendants || [];

    // Calculate KPIs
    const totalRevenue = processedOrders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0);
    const totalSales = processedOrders.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate daily series
    const dailyRevenue = new Map();
    processedOrders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      const revenue = parseFloat(order.total_price) || 0;
      dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + revenue);
    });

    const dailySeries = Array.from(dailyRevenue.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate attendant ranking
    const attendantStats = new Map();
    
    processedOrders.forEach(order => {
      const utmMedium = order.utm_medium || '';
      let assignedAttendant = null;
      
      // Find matching attendant by utm_identifier
      for (const attendant of processedAttendants) {
        if (utmMedium.toLowerCase().includes(attendant.utm_identifier.toLowerCase())) {
          assignedAttendant = attendant;
          break;
        }
      }
      
      if (assignedAttendant) {
        const stats = attendantStats.get(assignedAttendant.id) || {
          name: assignedAttendant.full_name,
          revenue: 0,
          sales: 0
        };
        
        stats.revenue += parseFloat(order.total_price) || 0;
        stats.sales += 1;
        attendantStats.set(assignedAttendant.id, stats);
      }
    });

    const attendantRanking = Array.from(attendantStats.values())
      .sort((a, b) => b.revenue - a.revenue);

    // Get recent sales with attendant names
    const recentSales = processedOrders
      .map(order => {
        const utmMedium = order.utm_medium || '';
        let attendantName = 'Não identificado';
        
        for (const attendant of processedAttendants) {
          if (utmMedium.toLowerCase().includes(attendant.utm_identifier.toLowerCase())) {
            attendantName = attendant.full_name;
            break;
          }
        }
        
        return {
          date: new Date(order.created_at).toISOString().split('T')[0],
          attendantName,
          orderNumber: order.order_number,
          value: parseFloat(order.total_price) || 0
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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