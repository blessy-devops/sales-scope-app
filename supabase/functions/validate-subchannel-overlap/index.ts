import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  utm_source: string;
  utm_medium: string;
  utm_medium_matching_type: 'exact' | 'contains';
  parent_channel_id: string;
  exclude_sub_channel_id?: string;
}

interface ValidationResult {
  hasConflicts: boolean;
  conflictType: 'error' | 'warning' | 'none';
  message: string;
  conflictingChannels: Array<{
    id: string;
    name: string;
    utm_source: string;
    utm_medium: string;
    utm_medium_matching_type: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const {
      utm_source,
      utm_medium,
      utm_medium_matching_type,
      parent_channel_id,
      exclude_sub_channel_id
    }: ValidationRequest = await req.json();

    if (!utm_source || !utm_medium || !utm_medium_matching_type || !parent_channel_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[SubChannel Validation] Validating:', { utm_source, utm_medium, utm_medium_matching_type, parent_channel_id });

    // Fetch existing sub-channels for the same parent channel
    let query = supabaseAdmin
      .from('sub_channels')
      .select('id, name, utm_source, utm_medium, utm_medium_matching_type')
      .eq('parent_channel_id', parent_channel_id);

    // Exclude current sub-channel if editing
    if (exclude_sub_channel_id) {
      query = query.neq('id', exclude_sub_channel_id);
    }

    const { data: existingSubChannels, error } = await query;

    if (error) {
      console.error('[SubChannel Validation] Error fetching sub-channels:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch existing sub-channels' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const conflicts: any[] = [];
    let worstConflictType: 'error' | 'warning' | 'none' = 'none';
    const conflictMessages: string[] = [];

    const newSource = utm_source.toLowerCase().trim();
    const newMedium = utm_medium.toLowerCase().trim();

    for (const existing of existingSubChannels || []) {
      const existingSource = existing.utm_source.toLowerCase().trim();
      const existingMedium = existing.utm_medium.toLowerCase().trim();

      // Source must match exactly since it's always exact matching
      if (newSource !== existingSource) {
        continue; // No conflict if sources don't match exactly
      }

      // With same source, check medium matching based on utm_medium_matching_type

      // Check for exact vs exact conflicts (medium) - blocking
      if (utm_medium_matching_type === 'exact' && existing.utm_medium_matching_type === 'exact') {
        if (newMedium === existingMedium) {
          conflicts.push(existing);
          worstConflictType = 'error';
          conflictMessages.push(`Conflito EXATO com "${existing.name}": UTM Source e Medium idênticos`);
        }
      }

      // Check for exact vs contains conflicts (medium only) - warning
      if ((utm_medium_matching_type === 'exact' && existing.utm_medium_matching_type === 'contains') ||
          (utm_medium_matching_type === 'contains' && existing.utm_medium_matching_type === 'exact')) {
        
        const hasMediumOverlap = utm_medium_matching_type === 'exact'
          ? existingMedium.includes(newMedium)
          : newMedium.includes(existingMedium);

        if (hasMediumOverlap) {
          conflicts.push(existing);
          if (worstConflictType !== 'error') worstConflictType = 'warning';
          conflictMessages.push(`Possível conflito com "${existing.name}": UTM Medium exato vs contém (mesmo source)`);
        }
      }

      // Check for contains vs contains conflicts (medium only) - warning if high overlap
      if (utm_medium_matching_type === 'contains' && existing.utm_medium_matching_type === 'contains') {
        const mediumOverlap = newMedium.includes(existingMedium) || existingMedium.includes(newMedium);
        
        if (mediumOverlap) {
          conflicts.push(existing);
          if (worstConflictType !== 'error') worstConflictType = 'warning';
          conflictMessages.push(`Sobreposição detectada com "${existing.name}": UTM Medium podem se sobrepor (mesmo source)`);
        }
      }
    }

    const result: ValidationResult = {
      hasConflicts: conflicts.length > 0,
      conflictType: worstConflictType,
      message: conflictMessages.length > 0 
        ? conflictMessages.join('; ') 
        : 'Nenhum conflito detectado',
      conflictingChannels: conflicts
    };

    console.log('[SubChannel Validation] Result:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in validate-subchannel-overlap:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});