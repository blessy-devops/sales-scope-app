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
        // Get startDate and endDate from request
        const startDate = requestData.startDate
        const endDate = requestData.endDate

        if (!startDate || !endDate) {
          return new Response(
            JSON.stringify({ error: 'startDate and endDate parameters are required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        console.log('Fetching followers analytics for period:', { startDate, endDate })

        // Get monthly goal using startDate to determine the month
        const startDateObj = new Date(startDate)
        const monthString = `${startDateObj.getFullYear()}-${(startDateObj.getMonth() + 1).toString().padStart(2, '0')}-01`
        
        const { data: goalData, error: goalError } = await supabaseAdmin
          .from('monthly_goals')
          .select('follower_goal')
          .eq('month', monthString)
          .maybeSingle()

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

        // Get start count - most recent followers_count before or on startDate
        const { data: startData, error: startError } = await supabaseAdmin
          .from('instagram_metrics')
          .select('followers_count, created_at')
          .lte('created_at', startDate + 'T23:59:59.999Z')
          .order('created_at', { ascending: false })
          .limit(1)

        // Get end count - most recent followers_count before or on endDate
        const { data: endData, error: endError } = await supabaseAdmin
          .from('instagram_metrics')
          .select('followers_count, created_at')
          .lte('created_at', endDate + 'T23:59:59.999Z')
          .order('created_at', { ascending: false })
          .limit(1)

        // Get daily series - all metrics within the date range
        const { data: dailyData, error: dailyError } = await supabaseAdmin
          .from('instagram_metrics')
          .select('followers_count, created_at')
          .gte('created_at', startDate + 'T00:00:00.000Z')
          .lte('created_at', endDate + 'T23:59:59.999Z')
          .order('created_at', { ascending: true })

        if (startError || endError || dailyError) {
          console.error('Error fetching metrics:', { startError, endError, dailyError })
          return new Response(
            JSON.stringify({ error: 'Error fetching Instagram metrics' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const goal = goalData?.follower_goal || 0
        const startCount = startData?.[0]?.followers_count || 0
        const endCount = endData?.[0]?.followers_count || 0

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

        // Convert dailyMap to array format
        for (const [date, followers_count] of dailyMap.entries()) {
          dailySeries.push({ date, followers_count })
        }

        console.log('Followers analytics:', { goal, startCount, endCount, dailySeriesLength: dailySeries.length })

        return new Response(
          JSON.stringify({
            goal,
            startCount,
            endCount,
            dailySeries
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (path === 'sales') {
        // Validate columnToSum parameter if provided in request
        if (requestData.columnToSum && requestData.columnToSum !== 'total_price' && requestData.columnToSum !== 'subtotal_price') {
          return new Response(
            JSON.stringify({ error: 'Parâmetro "columnToSum" inválido. Use "total_price" ou "subtotal_price".' }),
            {
              status: 400, // Bad Request
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

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

        // Get user's sales metric preference (unless overridden by request)
        let columnToSum = requestData.columnToSum;
        
        if (!columnToSum) {
          const { data: settingData, error: settingError } = await supabaseAdmin
            .from('dashboard_settings')
            .select('setting_value')
            .eq('setting_key', 'sales_metric_preference')
            .single()

          const metricPreference = settingData?.setting_value || 'subtotal_price'
          columnToSum = metricPreference === 'total_price' ? 'total_price' : 'subtotal_price'
        }
        
        // Final validation to ensure columnToSum is always valid
        if (columnToSum !== 'total_price' && columnToSum !== 'subtotal_price') {
          return new Response(
            JSON.stringify({ error: 'Parâmetro "columnToSum" inválido. Use "total_price" ou "subtotal_price".' }),
            {
              status: 400, // Bad Request
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        console.log('Using sales metric:', { columnToSum })

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

        // Use the new unified function for clean data access
        const { data: unifiedSalesData, error: salesError } = await supabaseAdmin
          .rpc('get_social_media_sales_unified', {
            start_date: new Date(startTsUtc).toISOString().split('T')[0],
            end_date: new Date(endTsUtc).toISOString().split('T')[0]
          })

        if (salesError) {
          console.error('Error fetching unified sales:', salesError)
          return new Response(
            JSON.stringify({ error: salesError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const formattedSalesData = (unifiedSalesData || []).map((sale: any) => ({
          sale_date: sale.sale_date,
          amount: Number(sale[columnToSum]) || 0
        }))

        console.log('Unified sales data:', { 
          totalRecords: formattedSalesData.length
        })

        const goal = totalGoal
        const currentSalesTotal = formattedSalesData.reduce((sum: number, sale: any) => {
          return sum + sale.amount
        }, 0)

        // Build daily series - data is already grouped by São Paulo date in the VIEW
        const dailySeries = []
        const dailyMap = new Map()
        
        // Group sales by date (already in São Paulo timezone from VIEW)
        for (const sale of formattedSalesData) {
          const dateStr = sale.sale_date
          const current = dailyMap.get(dateStr) || 0
          dailyMap.set(dateStr, current + sale.amount)
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

        console.log('Sales analytics:', { goal, currentSalesTotal, metricUsed: columnToSum, dailySeriesLength: dailySeries.length })

        return new Response(
          JSON.stringify({
            goal,
            current_sales_total: currentSalesTotal,
            daily_series: dailySeries,
            metric_used: columnToSum
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