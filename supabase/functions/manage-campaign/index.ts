import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CampaignData {
  action: 'create' | 'update';
  id?: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  utm_campaign: string;
  utm_source?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
  goal_revenue?: number;
  goal_sales?: number;
  goal_sessions?: number;
  goal_conversion_rate?: number;
  goal_average_ticket?: number;
  goal_cps?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body: CampaignData = await req.json();

    // Validate required fields
    if (!body.action || !body.name || !body.start_date || !body.end_date || !body.utm_campaign) {
      console.error('Missing required fields:', body);
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate dates
    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);
    
    if (endDate < startDate) {
      return new Response(
        JSON.stringify({ error: 'End date must be after start date' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare campaign data
    const campaignData = {
      name: body.name,
      description: body.description || null,
      start_date: body.start_date,
      end_date: body.end_date,
      utm_campaign: body.utm_campaign,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_content: body.utm_content || null,
      utm_term: body.utm_term || null,
      goal_revenue: body.goal_revenue || null,
      goal_sales: body.goal_sales || null,
      goal_sessions: body.goal_sessions || null,
      goal_conversion_rate: body.goal_conversion_rate || null,
      goal_average_ticket: body.goal_average_ticket || null,
      goal_cps: body.goal_cps || null,
    };

    let result;

    if (body.action === 'create') {
      console.log('Creating campaign:', campaignData);
      
      const { data, error } = await supabaseClient
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) {
        console.error('Error creating campaign:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      result = data;
    } else if (body.action === 'update') {
      if (!body.id) {
        return new Response(
          JSON.stringify({ error: 'Campaign ID is required for update' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log('Updating campaign:', body.id, campaignData);
      
      const { data, error } = await supabaseClient
        .from('campaigns')
        .update(campaignData)
        .eq('id', body.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating campaign:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      result = data;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Campaign operation successful:', result);

    return new Response(
      JSON.stringify({ data: result }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});