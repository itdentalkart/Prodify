import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking for offline devices...");

    // Get devices that were online but are now offline (last_seen > 15 minutes ago)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: offlineDevices, error: devicesError } = await supabase
      .from("devices")
      .select("id, hostname, org_id, last_seen, status")
      .lt("last_seen", fifteenMinutesAgo)
      .neq("status", "offline");

    if (devicesError) {
      console.error("Error fetching devices:", devicesError);
      throw devicesError;
    }

    console.log(`Found ${offlineDevices?.length || 0} devices that went offline`);

    if (!offlineDevices || offlineDevices.length === 0) {
      return new Response(JSON.stringify({ message: "No offline devices found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Update device status to offline
    const deviceIds = offlineDevices.map(d => d.id);
    const { error: updateError } = await supabase
      .from("devices")
      .update({ status: "offline" })
      .in("id", deviceIds);

    if (updateError) {
      console.error("Error updating device status:", updateError);
    }

    // Group devices by org for sending alerts
    const devicesByOrg = offlineDevices.reduce((acc, device) => {
      if (!acc[device.org_id]) {
        acc[device.org_id] = [];
      }
      acc[device.org_id].push(device);
      return acc;
    }, {} as Record<string, typeof offlineDevices>);

    // Send alert emails for each org
    const alertPromises = Object.entries(devicesByOrg).map(async ([orgId, devices]) => {
      // Check notification preferences for this org
      const { data: preferences, error: prefError } = await supabase
        .from("notification_preferences")
        .select("user_id, device_offline_email")
        .eq("org_id", orgId)
        .eq("device_offline_email", true);

      if (prefError) {
        console.error(`Error fetching preferences for org ${orgId}:`, prefError);
        return;
      }

      // If no preferences exist or all have it enabled, send alerts
      const shouldSendAlert = !preferences || preferences.length === 0 || preferences.some(p => p.device_offline_email);

      if (!shouldSendAlert) {
        console.log(`Skipping alerts for org ${orgId} - disabled in preferences`);
        return;
      }

      // Send alert for each offline device
      for (const device of devices) {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              type: "device_offline",
              device_hostname: device.hostname,
              device_id: device.id,
              org_id: device.org_id,
            }),
          });

          if (!response.ok) {
            console.error(`Failed to send alert for device ${device.id}:`, await response.text());
          } else {
            console.log(`Alert sent for device ${device.hostname}`);
          }
        } catch (err) {
          console.error(`Error sending alert for device ${device.id}:`, err);
        }
      }
    });

    await Promise.all(alertPromises);

    return new Response(JSON.stringify({ 
      success: true, 
      offlineDevices: offlineDevices.length,
      message: `Processed ${offlineDevices.length} offline devices`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in check-offline-devices function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
