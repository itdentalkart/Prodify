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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { enroll_token, hostname, os, device_type, ip_address, agent_version } = await req.json()

    console.log('Enrollment request:', { enroll_token, hostname, os, device_type })

    if (!enroll_token || !hostname) {
      return new Response(
        JSON.stringify({ error: 'enroll_token and hostname are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify enrollment token
    const { data: tokenData, error: tokenError } = await supabase
      .from('enrollment_tokens')
      .select('*')
      .eq('token', enroll_token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (tokenError || !tokenData) {
      console.error('Token validation failed:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired enrollment token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check license availability
    const { data: licenseOk } = await supabase.rpc('check_device_license', { p_org_id: tokenData.org_id })
    if (!licenseOk) {
      return new Response(
        JSON.stringify({ error: 'No available device licenses. Contact your administrator to purchase more licenses.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate agent token
    const agentToken = crypto.randomUUID() + '-' + crypto.randomUUID()

    // Create device record
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .insert({
        org_id: tokenData.org_id,
        hostname,
        os,
        device_type: device_type || 'Desktop',
        ip_address,
        agent_version,
        agent_token: agentToken,
        status: 'online',
        last_seen: new Date().toISOString()
      })
      .select()
      .single()

    if (deviceError) {
      console.error('Failed to create device:', deviceError)
      return new Response(
        JSON.stringify({ error: 'Failed to register device' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark token as used
    await supabase
      .from('enrollment_tokens')
      .update({ 
        used_at: new Date().toISOString(),
        used_by_device_id: device.id
      })
      .eq('id', tokenData.id)

    // Log enrollment
    await supabase.from('audit_logs').insert({
      org_id: tokenData.org_id,
      user_id: tokenData.created_by,
      action: 'DEVICE_ENROLLED',
      resource_type: 'device',
      resource_id: device.id,
      details: { hostname, os, device_type }
    })

    // Send email alert (fire and forget)
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          type: 'device_enrolled',
          device_hostname: hostname,
          device_id: device.id,
          org_id: tokenData.org_id,
        }),
      });
    } catch (emailError) {
      console.error('Failed to send alert email:', emailError);
      // Don't fail enrollment if email fails
    }

    console.log('Device enrolled successfully:', device.id)

    return new Response(
      JSON.stringify({
        success: true,
        device_id: device.id,
        agent_token: agentToken,
        config: {
          screenshot_interval_sec: 300,
          heartbeat_interval_sec: 300,
          idle_threshold_sec: 300
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Enrollment error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
