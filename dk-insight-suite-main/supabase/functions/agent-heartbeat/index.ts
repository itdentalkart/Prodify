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
      .select('id, org_id, status')
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
    const { agent_version, os_version, hostname } = body

    // Update device last_seen and status
    const { error: updateError } = await supabase
      .from('devices')
      .update({
        last_seen: new Date().toISOString(),
        status: 'online',
        agent_version: agent_version || undefined,
        os: os_version || undefined,
        hostname: hostname || undefined
      })
      .eq('id', device.id)

    if (updateError) {
      console.error('Failed to update device:', updateError)
    }

    // Log heartbeat telemetry
    await supabase.from('telemetry_events').insert({
      device_id: device.id,
      org_id: device.org_id,
      event_type: 'heartbeat',
      event_time: new Date().toISOString(),
      details: body
    })

    console.log('Heartbeat received for device:', device.id)

    return new Response(
      JSON.stringify({ success: true, server_time: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Heartbeat error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
