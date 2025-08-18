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
    // Create Supabase client with service role key
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

    if (path === 'sales-metric') {
      if (req.method === 'GET') {
        // GET /sales-metric - fetch current setting
        console.log('Fetching sales metric preference')
        
        const { data, error } = await supabaseAdmin
          .from('dashboard_settings')
          .select('setting_value')
          .eq('setting_key', 'sales_metric_preference')
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching sales metric preference:', error)
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const value = data?.setting_value || 'subtotal_price'
        console.log('Sales metric preference:', value)

        return new Response(
          JSON.stringify({ value }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (req.method === 'POST') {
        const body = await req.json()
        
        // Support both direct POST and invoke-style with action
        if (body.action === 'get') {
          // Handle GET action via POST for supabase.functions.invoke compatibility
          console.log('Fetching sales metric preference via POST action')
          
          const { data, error } = await supabaseAdmin
            .from('dashboard_settings')
            .select('setting_value')
            .eq('setting_key', 'sales_metric_preference')
            .single()

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching sales metric preference:', error)
            return new Response(
              JSON.stringify({ error: error.message }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }

          const value = data?.setting_value || 'subtotal_price'
          console.log('Sales metric preference:', value)

          return new Response(
            JSON.stringify({ value }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        if (body.action === 'update' || body.value) {
          // POST /sales-metric - update setting
          const value = body.value
          
          if (!value || !['subtotal_price', 'total_price'].includes(value)) {
            return new Response(
              JSON.stringify({ error: 'Invalid value. Must be "subtotal_price" or "total_price"' }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }

          console.log('Updating sales metric preference to:', value)

          const { error } = await supabaseAdmin
            .from('dashboard_settings')
            .upsert({
              setting_key: 'sales_metric_preference',
              setting_value: value,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'setting_key'
            })

          if (error) {
            console.error('Error updating sales metric preference:', error)
            return new Response(
              JSON.stringify({ error: error.message }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }

          console.log('Sales metric preference updated successfully')

          return new Response(
            JSON.stringify({ success: true, value }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ error: 'Invalid action or missing value' }),
          { 
            status: 400, 
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