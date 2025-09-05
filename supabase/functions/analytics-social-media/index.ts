import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for database reads
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    // Get parameters from either query string (GET) or body (POST)
    let year: number, month: number
    let requestData: any = {}
    
    if (req.method === 'POST') {
      requestData = await req.json()
      year = requestData.year
      month = requestData.month
    } else {
      year = parseInt(url.searchParams.get('year') || '')
      month = parseInt(url.searchParams.get('month') || '')
    }

    // Default to current month/year if not provided
    const now = new Date()
    if (!year || isNaN(year)) year = now.getFullYear()
    if (!month || isNaN(month)) month = now.getMonth() + 1

    if (req.method === 'GET' || req.method === 'POST') {
      if (path === 'followers') {
        // Create date range for selected month
        const startOfMonth = new Date(year, month - 1, 1)
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)
        const monthString = startOfMonth.toISOString().split('T')[0]

        console.log('Fetching followers analytics for:', { year, month, monthString })

        // Get monthly goal
        const { data: goalData, error: goalError } = await supabaseAdmin
          .from('monthly_goals')
          .select('follower_goal')
          .eq('month', monthString)
          .single()

        if (goalError && goalError.code !== 'PGRST116') {
          console.error('Error fetching goal:', goalError)
          return new Response(
            JSON.stringify({ error: goalError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Get start of month followers count
        const { data: startData, error: startError } = await supabaseAdmin
          .from('instagram_metrics')
          .select('followers_count, created_at')
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString())
          .order('created_at', { ascending: true })
          .limit(1)

        // Get latest followers count within the month
        const { data: latestData, error: latestError } = await supabaseAdmin
          .from('instagram_metrics')
          .select('followers_count, created_at')
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)

        // Get all metrics for daily series
        const { data: dailyData, error: dailyError } = await supabaseAdmin
          .from('instagram_metrics')
          .select('followers_count, created_at')
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString())
          .order('created_at', { ascending: true })

        if (startError || latestError || dailyError) {
          console.error('Error fetching metrics:', { startError, latestError, dailyError })
          return new Response(
            JSON.stringify({ error: 'Error fetching Instagram metrics' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const goal = goalData?.follower_goal || 0
        const startOfMonthCount = startData?.[0]?.followers_count || 0
        const latestCount = latestData?.[0]?.followers_count || 0
        const currentGrowth = latestCount - startOfMonthCount

        // Build daily series
        const dailySeries = []
        const dailyMap = new Map()
        
        // Group by date and get last value of each day
        if (dailyData) {
          for (const record of dailyData) {
            const date = new Date(record.created_at).toISOString().split('T')[0]
            dailyMap.set(date, record.followers_count)
          }
        }

        // Fill all days of the month
        let lastKnownCount = startOfMonthCount
        for (let day = 1; day <= endOfMonth.getDate(); day++) {
          const date = new Date(year, month - 1, day).toISOString().split('T')[0]
          const count = dailyMap.get(date) || lastKnownCount
          dailySeries.push({ date, followers_count: count })
          lastKnownCount = count
        }

        console.log('Followers analytics:', { goal, startOfMonthCount, latestCount, currentGrowth, dailySeriesLength: dailySeries.length })

        return new Response(
          JSON.stringify({
            goal,
            current_growth: currentGrowth,
            start_of_month_count: startOfMonthCount,
            latest_count: latestCount,
            daily_series: dailySeries
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (path === 'sales') {
        // Handle both legacy (year/month) and new (startDate/endDate) parameters
        let startTsUtc: string;
        let endTsUtc: string;
        
        if (requestData.startDate && requestData.endDate) {
          // New date range format
          startTsUtc = requestData.startDate;
          endTsUtc = requestData.endDate;
          console.log('Fetching sales analytics for period:', { startDate: startTsUtc, endDate: endTsUtc });
        } else {
          // Legacy month format (use extracted year/month from earlier)
          const lastDay = new Date(year, month, 0).getDate();
          startTsUtc = new Date(`${year}-${month.toString().padStart(2, '0')}-01T00:00:00-03:00`).toISOString();
          endTsUtc = new Date(`${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}T23:59:59-03:00`).toISOString();
          console.log('Fetching sales analytics for month:', { year, month });
        }

        // Get user's sales metric preference
        const { data: settingData, error: settingError } = await supabaseAdmin
          .from('dashboard_settings')
          .select('setting_value')
          .eq('setting_key', 'sales_metric_preference')
          .single()

        const metricPreference = settingData?.setting_value || 'subtotal_price'
        const columnToSum = metricPreference === 'total_price' ? 'total_price' : 'subtotal_price'
        
        console.log('Using sales metric:', { metricPreference, columnToSum })

        // Get prorated goal for the period
        let totalGoal = 0;
        
        if (requestData.startDate && requestData.endDate) {
          // Calculate prorated goal for custom period
          const startDate = new Date(startTsUtc);
          const endDate = new Date(endTsUtc);
          
          // Get all months within the range
          const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
          const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          
          while (currentDate <= endMonth) {
            const monthString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-01`;
            
            const { data: goalData } = await supabaseAdmin
              .from('monthly_goals')
              .select('sales_goal')
              .eq('month', monthString)
              .maybeSingle();
            
            if (goalData?.sales_goal) {
              // Calculate days of this month that fall within our period
              const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
              const daysInMonth = monthEnd.getDate();
              
              const periodStart = new Date(Math.max(startDate.getTime(), monthStart.getTime()));
              const periodEnd = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));
              const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              
              const proratedGoal = (goalData.sales_goal / daysInMonth) * daysInPeriod;
              totalGoal += proratedGoal;
            }
            
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
        } else {
          // Legacy: single month goal
          const monthString = `${year}-${month.toString().padStart(2, '0')}-01`;
          const { data: goalData, error: goalError } = await supabaseAdmin
            .from('monthly_goals')
            .select('sales_goal')
            .eq('month', monthString)
            .maybeSingle();

          if (goalError && goalError.code !== 'PGRST116') {
            console.error('Error fetching sales goal:', goalError);
          }
          
          totalGoal = goalData?.sales_goal || 0;
        }

        // Get all social media coupon codes
        const { data: couponsData, error: couponsError } = await supabaseAdmin
          .from('social_media_coupons')
          .select('coupon_code')

        if (couponsError) {
          console.error('Error fetching coupons:', couponsError)
          return new Response(
            JSON.stringify({ error: couponsError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const coupons = couponsData?.map(c => c.coupon_code.toLowerCase()) || []
        console.log('Found social media coupons:', coupons.length)

        // Get Shopify orders with social media coupons (case-insensitive)
        let shopifySalesData = []
        if (coupons.length > 0) {
          // Build case-insensitive OR condition for coupon codes
          let query = supabaseAdmin
            .from('shopify_orders_gold')
            .select(`${columnToSum} as amount, created_at, coupon_code`)
            .gte('created_at', startTsUtc)
            .lte('created_at', endTsUtc)
            .eq('financial_status', 'paid')
            .eq('test', false)

          // Filter by any of the coupon codes (case-insensitive)
          const orFilters = coupons.map(code => `coupon_code.ilike.${code}`).join(',')
          query = query.or(orFilters)

          const { data: shopifyData, error: shopifyError } = await query

          if (shopifyError) {
            console.error('Error fetching Shopify sales:', shopifyError)
            return new Response(
              JSON.stringify({ error: shopifyError.message }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
          
          shopifySalesData = (shopifyData || []).map(sale => ({
            order_created_at: sale.created_at,
            amount: Number(sale.amount) || 0
          }))
        }

        // Get legacy social_media_sales data
        const { data: legacySalesData, error: legacySalesError } = await supabaseAdmin
          .from('social_media_sales')
          .select(`order_created_at, ${columnToSum} as amount`)
          .gte('order_created_at', startTsUtc)
          .lte('order_created_at', endTsUtc)

        if (legacySalesError) {
          console.error('Error fetching legacy social media sales:', legacySalesError)
          return new Response(
            JSON.stringify({ error: legacySalesError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const formattedLegacySales = (legacySalesData || []).map(sale => ({
          order_created_at: sale.order_created_at,
          amount: Number(sale.amount) || 0
        }))

        // Unify both datasets
        const unifiedSalesData = [...shopifySalesData, ...formattedLegacySales]

        console.log('Unified sales data:', { 
          shopifyRecords: shopifySalesData.length,
          legacyRecords: formattedLegacySales.length,
          totalRecords: unifiedSalesData.length,
          couponsCount: coupons.length 
        })

        const goal = totalGoal
        const currentSalesTotal = unifiedSalesData.reduce((sum, sale) => {
          return sum + sale.amount
        }, 0)

        // Build daily series grouped by São Paulo date
        const dailySeries = []
        const dailyMap = new Map()
        
        // Group unified sales by São Paulo date
        for (const sale of unifiedSalesData) {
          // Convert UTC timestamp to São Paulo date
          const spDate = new Date(sale.order_created_at).toLocaleDateString('en-CA', { 
            timeZone: 'America/Sao_Paulo' 
          })
          const current = dailyMap.get(spDate) || 0
          dailyMap.set(spDate, current + sale.amount)
        }

        // Fill all days of the period
        const periodStart = new Date(startTsUtc);
        const periodEnd = new Date(endTsUtc);
        
        // Convert to São Paulo date for iteration
        const startDateSP = new Date(periodStart.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }));
        const endDateSP = new Date(periodEnd.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }));
        
        for (let d = new Date(startDateSP); d <= endDateSP; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          if (!dailyMap.has(dateStr)) {
            dailyMap.set(dateStr, 0);
          }
          dailySeries.push({
            date: dateStr,
            total: dailyMap.get(dateStr) || 0
          });
        }

        console.log('Sales analytics:', { goal, currentSalesTotal, metricUsed: metricPreference, dailySeriesLength: dailySeries.length })

        return new Response(
          JSON.stringify({
            goal,
            current_sales_total: currentSalesTotal,
            daily_series: dailySeries,
            metric_used: metricPreference
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})