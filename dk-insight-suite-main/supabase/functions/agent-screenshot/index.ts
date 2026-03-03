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

    // Parse multipart form data
    const formData = await req.formData()
    const screenshotFile = formData.get('screenshot') as File
    const timestamp = formData.get('timestamp') as string
    const sessionId = formData.get('session_id') as string

    if (!screenshotFile) {
      return new Response(
        JSON.stringify({ error: 'Screenshot file is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate file path
    const capturedAt = timestamp ? new Date(timestamp) : new Date()
    const dateFolder = capturedAt.toISOString().split('T')[0]
    const fileName = `${capturedAt.getTime()}-${crypto.randomUUID().slice(0, 8)}.jpg`
    const filePath = `${device.org_id}/${device.id}/${dateFolder}/${fileName}`

    console.log('Uploading screenshot:', filePath)

    // Upload to storage
    const fileBuffer = await screenshotFile.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('screenshots')
      .upload(filePath, fileBuffer, {
        contentType: screenshotFile.type || 'image/jpeg',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload failed:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload screenshot' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create screenshot record
    const { data: screenshot, error: dbError } = await supabase
      .from('screenshots')
      .insert({
        device_id: device.id,
        org_id: device.org_id,
        file_path: filePath,
        captured_at: capturedAt.toISOString(),
        session_id: sessionId || null,
        meta: {
          file_size: fileBuffer.byteLength,
          content_type: screenshotFile.type
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Failed to create screenshot record:', dbError)
      // Clean up uploaded file
      await supabase.storage.from('screenshots').remove([filePath])
      return new Response(
        JSON.stringify({ error: 'Failed to save screenshot record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update device last_seen
    await supabase
      .from('devices')
      .update({ last_seen: new Date().toISOString(), status: 'online' })
      .eq('id', device.id)

    console.log('Screenshot saved:', screenshot.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        screenshot_id: screenshot.id,
        file_path: filePath 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Screenshot upload error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
