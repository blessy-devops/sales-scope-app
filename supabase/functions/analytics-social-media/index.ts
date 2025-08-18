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

    if (req.method === 'GET') {
      if (path === 'followers') {
        // Get current month's goal
        const now = new Date()
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthString = currentMonth.toISOString().split('T')[0]

        console.log('Fetching followers analytics for month:', monthString)

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
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const { data: startData, error: startError } = await supabaseAdmin
          .from('instagram_metrics')
          .select('followers_count')
          .gte('created_at', startOfMonth.toISOString())
          .order('created_at', { ascending: true })
          .limit(1)

        // Get latest followers count
        const { data: latestData, error: latestError } = await supabaseAdmin
          .from('instagram_metrics')
          .select('followers_count')
          .order('created_at', { ascending: false })
          .limit(1)

        if (startError || latestError) {
          console.error('Error fetching metrics:', { startError, latestError })
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

        console.log('Followers analytics:', { goal, startOfMonthCount, latestCount, currentGrowth })

        return new Response(
          JSON.stringify({
            goal,
            current_growth: currentGrowth,
            start_of_month_count: startOfMonthCount,
            latest_count: latestCount
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (path === 'sales') {
        // Get current month's goal and sales
        const now = new Date()
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthString = currentMonth.toISOString().split('T')[0]

        console.log('Fetching sales analytics for month:', monthString)

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

        // Get current month's sales total
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

        const { data: salesData, error: salesError } = await supabaseAdmin
          .from('social_media_sales')
          .select('total_price')
          .gte('order_created_at', startOfMonth.toISOString())
          .lte('order_created_at', endOfMonth.toISOString())

        if (salesError) {
          console.error('Error fetching sales:', salesError)
          return new Response(
            JSON.stringify({ error: salesError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const goal = goalData?.sales_goal || 0
        const currentSalesTotal = salesData?.reduce((sum, sale) => sum + Number(sale.total_price), 0) || 0

        console.log('Sales analytics:', { goal, currentSalesTotal })

        return new Response(
          JSON.stringify({
            goal,
            current_sales_total: currentSalesTotal
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