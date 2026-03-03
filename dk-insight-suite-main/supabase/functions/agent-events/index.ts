import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing agent token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const agentToken = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify agent token and get device
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, org_id')
      .eq('agent_token', agentToken)
      .maybeSingle()

    if (deviceError || !device) {
      console.error('Invalid agent token')
      return new Response(
        JSON.stringify({ error: 'Invalid agent token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { event_type, event_time, details } = body

    if (!event_type) {
      return new Response(
        JSON.stringify({ error: 'event_type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Event received:', event_type, 'for device:', device.id)

    // Handle session events
    if (event_type === 'session_start') {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          device_id: device.id,
          session_start: event_time || new Date().toISOString(),
          active_seconds: 0,
          idle_seconds: 0
        })
        .select()
        .single()

      if (sessionError) {
        console.error('Failed to create session:', sessionError)
      } else {
        console.log('Session started:', session.id)
      }

      // Update device status
      await supabase
        .from('devices')
        .update({ last_seen: new Date().toISOString(), status: 'online' })
        .eq('id', device.id)

    } else if (event_type === 'session_end') {
      const sessionId = details?.session_id
      if (sessionId) {
        const { error: updateError } = await supabase
          .from('sessions')
          .update({
            session_end: event_time || new Date().toISOString(),
            active_seconds: details?.active_seconds || 0,
            idle_seconds: details?.idle_seconds || 0
          })
          .eq('id', sessionId)

        if (updateError) {
          console.error('Failed to end session:', updateError)
        }
      }

    } else if (event_type === 'idle_start' || event_type === 'idle_end') {
      // Update device status based on idle state
      const newStatus = event_type === 'idle_start' ? 'idle' : 'online'
      await supabase
        .from('devices')
        .update({ 
          last_seen: new Date().toISOString(), 
          status: newStatus 
        })
        .eq('id', device.id)
    }

    // Log telemetry event
    const { error: telemetryError } = await supabase
      .from('telemetry_events')
      .insert({
        device_id: device.id,
        org_id: device.org_id,
        event_type,
        event_time: event_time || new Date().toISOString(),
        details: details || {}
      })

    if (telemetryError) {
      console.error('Failed to log telemetry:', telemetryError)
    }

    return new Response(
      JSON.stringify({ success: true, server_time: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Event processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
