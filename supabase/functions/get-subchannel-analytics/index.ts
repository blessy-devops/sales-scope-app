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
    
    // Get year and month for target lookup
    const startDateObj = new Date(startDate);
    const year = startDateObj.getFullYear();
    const month = startDateObj.getMonth() + 1;

    console.log('[SubChannel Analytics] Fetching data for period:', { startDate, endDate, year, month });

    // Fetch all sub-channels with their targets
    const { data: subChannels, error: subChannelError } = await supabaseAdmin
      .from('sub_channels')
      .select(`
        id,
        name,
        utm_source,
        utm_medium,
        parent_channel_id,
        channels!inner(name, is_active)
      `)
      .eq('channels.is_active', true);

    if (subChannelError) {
      console.error('[SubChannel Analytics] Error fetching sub-channels:', subChannelError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch sub-channels' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[SubChannel Analytics] Found ${(subChannels || []).length} sub-channels`);

    // Fetch targets for all sub-channels
    const subChannelIds = (subChannels || []).map(sc => sc.id);
    const { data: targets, error: targetsError } = await supabaseAdmin
      .from('sales_targets')
      .select('sub_channel_id, target_amount')
      .in('sub_channel_id', subChannelIds)
      .eq('year', year)
      .eq('month', month);

    if (targetsError) {
      console.error('[SubChannel Analytics] Error fetching targets:', targetsError);
    }

    // Create a map of sub-channel targets
    const targetMap = new Map();
    (targets || []).forEach(target => {
      targetMap.set(target.sub_channel_id, target.target_amount);
    });

    // Get sales data for each sub-channel from Shopify orders
    const analyticsData = [];
    
    for (const subChannel of subChannels || []) {
      console.log(`[SubChannel Analytics] Processing sub-channel: ${subChannel.name} (UTM: ${subChannel.utm_source}/${subChannel.utm_medium})`);

      // Query Shopify orders for this specific sub-channel
      const { data: salesData, error: salesError } = await supabaseAdmin
        .from('shopify_orders_gold')
        .select('total_price, id')
        .eq('utm_source', subChannel.utm_source)
        .eq('utm_medium', subChannel.utm_medium)
        .eq('financial_status', 'paid')
        .eq('test', false)
        .is('cancelled_at', null)
        .gte('created_at', `${startDate}T00:00:00-03:00`)
        .lte('created_at', `${endDate}T23:59:59-03:00`);

      if (salesError) {
        console.error(`[SubChannel Analytics] Error fetching sales for ${subChannel.name}:`, salesError);
        continue;
      }

      const orders = salesData || [];
      const totalSales = orders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0);
      const orderCount = orders.length;
      const target = targetMap.get(subChannel.id) || 0;
      const attainment = target > 0 ? (totalSales / target) * 100 : 0;

      console.log(`[SubChannel Analytics] ${subChannel.name}: Sales=${totalSales}, Orders=${orderCount}, Target=${target}, Attainment=${attainment.toFixed(1)}%`);

      analyticsData.push({
        name: subChannel.name,
        meta: target,
        realized: totalSales,
        attainment: attainment,
        orderCount: orderCount,
        channelName: subChannel.channels?.name || 'Unknown'
      });
    }

    // Sort by attainment percentage (descending)
    analyticsData.sort((a, b) => b.attainment - a.attainment);

    console.log(`[SubChannel Analytics] Returning ${analyticsData.length} sub-channel analytics`);

    return new Response(
      JSON.stringify(analyticsData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in get-subchannel-analytics:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});