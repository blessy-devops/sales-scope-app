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
    // Create Supabase client with service role key for database writes
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

    if (req.method === 'POST') {
      const { follower_goal, sales_goal } = await req.json()

      // Validate input
      if (typeof follower_goal !== 'number' || typeof sales_goal !== 'number') {
        return new Response(
          JSON.stringify({ error: 'follower_goal and sales_goal must be numbers' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Calculate first day of current month
      const now = new Date()
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthString = currentMonth.toISOString().split('T')[0] // YYYY-MM-DD format

      console.log('Upserting goals for month:', monthString)
      console.log('Goals:', { follower_goal, sales_goal })

      // Perform UPSERT operation
      const { data, error } = await supabaseAdmin
        .from('monthly_goals')
        .upsert(
          {
            month: monthString,
            follower_goal,
            sales_goal,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'month'
          }
        )
        .select()

      if (error) {
        console.error('Database error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('Goals saved successfully:', data)

      return new Response(
        JSON.stringify({ data, message: 'Goals saved successfully' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
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