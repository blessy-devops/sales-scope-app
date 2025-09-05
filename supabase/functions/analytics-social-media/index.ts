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
    
    if (req.method === 'POST') {
      const body = await req.json()
      year = body.year
      month = body.month
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
        // Create São Paulo timezone date range for selected month with explicit offset
        const lastDay = new Date(year, month, 0).getDate() // Last day of month
        const startTsUtc = new Date(`${year}-${month.toString().padStart(2, '0')}-01T00:00:00-03:00`).toISOString()
        const endTsUtc = new Date(`${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}T23:59:59-03:00`).toISOString()
        const monthString = `${year}-${month.toString().padStart(2, '0')}-01`

        console.log('Fetching sales analytics for:', { year, month, monthString })

        // Get user's sales metric preference
        const { data: settingData, error: settingError } = await supabaseAdmin
          .from('dashboard_settings')
          .select('setting_value')
          .eq('setting_key', 'sales_metric_preference')
          .single()

        const metricPreference = settingData?.setting_value || 'subtotal_price'
        const columnToSum = metricPreference === 'total_price' ? 'total_price' : 'subtotal_price'
        
        console.log('Using sales metric:', { metricPreference, columnToSum })

        // Get monthly goal
        const { data: goalData, error: goalError } = await supabaseAdmin
          .from('monthly_goals')
          .select('sales_goal')
          .eq('month', monthString)
          .single()

        if (goalError && goalError.code !== 'PGRST116') {
          console.error('Error fetching sales goal:', goalError)
          return new Response(
            JSON.stringify({ error: goalError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
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

        const goal = goalData?.sales_goal || 0
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

        // Fill all days of the month
        for (let day = 1; day <= lastDay; day++) {
          const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
          const total = dailyMap.get(date) || 0
          dailySeries.push({ date, total })
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