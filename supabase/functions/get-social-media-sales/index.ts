import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // Parse request body
    const { startDate, endDate, metric } = await req.json()
    
    console.log('Get social media sales request:', { startDate, endDate, metric })

    // Validate required parameters
    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros "startDate" e "endDate" são obrigatórios.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate metric parameter
    if (metric !== 'total_price' && metric !== 'subtotal_price') {
      return new Response(
        JSON.stringify({ error: 'Parâmetro "metric" inválido. Use "total_price" ou "subtotal_price".' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all social media coupon codes
    console.log('Fetching social media coupons...')
    const { data: coupons, error: couponsError } = await supabase
      .from('social_media_coupons')
      .select('coupon_code')

    if (couponsError) {
      console.error('Error fetching coupons:', couponsError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar cupons de social media.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If no coupons found, return empty series
    if (!coupons || coupons.length === 0) {
      console.log('No social media coupons found, returning empty series')
      return new Response(
        JSON.stringify([]),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const couponCodes = coupons.map(c => c.coupon_code)
    console.log('Found coupon codes:', couponCodes)

    // Convert date range to São Paulo timezone boundaries
    const startTs = new Date(`${startDate}T00:00:00-03:00`).toISOString()
    const endTsExclusive = new Date(`${endDate}T23:59:59.999-03:00`).toISOString()
    
    console.log('Querying orders between:', { startTs, endTsExclusive })

    // Query Shopify orders with social media coupons
    const { data: orders, error: ordersError } = await supabase
      .from('shopify_orders_gold')
      .select(`created_at, ${metric}, coupon_code`)
      .gte('created_at', startTs)
      .lt('created_at', endTsExclusive)
      .in('coupon_code', couponCodes)

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar pedidos do Shopify.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Found ${orders?.length || 0} orders with social media coupons`)

    // Aggregate data by date (São Paulo timezone)
    const dailyData = new Map<string, { amount: number; sales_count: number }>()

    orders?.forEach(order => {
      // Convert to São Paulo date
      const saleDate = new Date(order.created_at).toLocaleDateString('en-CA', {
        timeZone: 'America/Sao_Paulo'
      })
      
      const amount = Number(order[metric]) || 0
      const current = dailyData.get(saleDate) || { amount: 0, sales_count: 0 }
      dailyData.set(saleDate, {
        amount: current.amount + amount,
        sales_count: current.sales_count + 1
      })
    })

    // Convert to time series array and sort by date
    const timeSeries = Array.from(dailyData.entries())
      .map(([sale_date, { amount, sales_count }]) => ({ sale_date, amount, sales_count }))
      .sort((a, b) => a.sale_date.localeCompare(b.sale_date))

    console.log('Time series result:', { length: timeSeries.length, total: timeSeries.reduce((sum, item) => sum + item.amount, 0) })

    return new Response(
      JSON.stringify(timeSeries),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in get-social-media-sales function:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})