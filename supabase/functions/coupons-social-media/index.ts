import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { action, coupon_code, description, id } = await req.json();
      
      if (action === 'list') {
        console.log('Fetching all coupons');
        
        const { data: coupons, error } = await supabaseAdmin
          .from('social_media_coupons')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching coupons:', error);
          throw error;
        }

        return new Response(JSON.stringify({ coupons }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'create') {
        console.log('Creating new coupon:', { coupon_code, description });

        if (!coupon_code) {
          return new Response(JSON.stringify({ error: 'Coupon code is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: coupon, error } = await supabaseAdmin
          .from('social_media_coupons')
          .insert({
            coupon_code: coupon_code.trim(),
            description: description?.trim() || null
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating coupon:', error);
          throw error;
        }

        return new Response(JSON.stringify({ coupon }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'delete') {
        console.log('Deleting coupon with ID:', id);

        if (!id) {
          return new Response(JSON.stringify({ error: 'Coupon ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabaseAdmin
          .from('social_media_coupons')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting coupon:', error);
          throw error;
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in coupons-social-media function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});