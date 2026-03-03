import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertEmailRequest {
  type: "device_offline" | "device_enrolled" | "screenshot_captured" | "token_used";
  device_hostname?: string;
  device_id?: string;
  org_id: string;
  details?: Record<string, any>;
}

async function sendEmail(to: string[], subject: string, html: string) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "DK Suite <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, device_hostname, device_id, org_id, details }: AlertEmailRequest = await req.json();

    console.log(`Processing alert: ${type} for org ${org_id}`);

    // Get admin emails for the organization
    const { data: adminProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email, display_name, user_id")
      .eq("org_id", org_id);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    if (!adminProfiles || adminProfiles.length === 0) {
      console.log("No profiles found for org");
      return new Response(JSON.stringify({ message: "No recipients found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get admin user IDs
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("user_id", adminProfiles.map(p => p.user_id))
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      throw rolesError;
    }

    const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);
    
    // Check notification preferences for admins
    const { data: notificationPrefs } = await supabase
      .from("notification_preferences")
      .select("user_id, device_offline_email, device_enrolled_email, screenshot_captured_email, token_used_email")
      .eq("org_id", org_id)
      .in("user_id", Array.from(adminUserIds));

    const prefsMap = new Map(notificationPrefs?.map(p => [p.user_id, p]) || []);

    // Filter admins based on their notification preferences
    const eligibleAdminEmails = adminProfiles
      .filter(p => {
        if (!adminUserIds.has(p.user_id)) return false;
        
        const prefs = prefsMap.get(p.user_id);
        // If no preferences set, default to enabled
        if (!prefs) return true;
        
        // Check specific preference based on alert type
        switch (type) {
          case "device_offline": return prefs.device_offline_email !== false;
          case "device_enrolled": return prefs.device_enrolled_email !== false;
          case "screenshot_captured": return prefs.screenshot_captured_email === true;
          case "token_used": return prefs.token_used_email !== false;
          default: return true;
        }
      })
      .map(p => p.email);

    if (eligibleAdminEmails.length === 0) {
      console.log("No eligible admin emails found (preferences disabled)");
      return new Response(JSON.stringify({ message: "No eligible recipients (preferences disabled)" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    const adminEmails = eligibleAdminEmails;

    // Build email content based on type
    let subject = "";
    let htmlContent = "";

    switch (type) {
      case "device_offline":
        subject = `⚠️ Device Offline: ${device_hostname || "Unknown"}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">🔴 Device Went Offline</h2>
            <p>A device in your organization has gone offline:</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Device:</strong> ${device_hostname || "Unknown"}</p>
              <p><strong>Device ID:</strong> ${device_id || "N/A"}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #6b7280;">This is an automated alert from DK Suite.</p>
          </div>
        `;
        break;

      case "device_enrolled":
        subject = `✅ New Device Enrolled: ${device_hostname || "Unknown"}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">🖥️ New Device Enrolled</h2>
            <p>A new device has been enrolled in your organization:</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Device:</strong> ${device_hostname || "Unknown"}</p>
              <p><strong>Device ID:</strong> ${device_id || "N/A"}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #6b7280;">This is an automated alert from DK Suite.</p>
          </div>
        `;
        break;

      case "screenshot_captured":
        subject = `📸 New Screenshot from ${device_hostname || "Unknown"}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">📸 Screenshot Captured</h2>
            <p>A new screenshot has been captured:</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Device:</strong> ${device_hostname || "Unknown"}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #6b7280;">Log in to DK Suite to view the screenshot.</p>
          </div>
        `;
        break;

      case "token_used":
        subject = `🔑 Enrollment Token Used`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">🔑 Enrollment Token Used</h2>
            <p>An enrollment token was used to register a new device:</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Token:</strong> ${details?.token || "N/A"}</p>
              <p><strong>Device:</strong> ${device_hostname || "Unknown"}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #6b7280;">This is an automated alert from DK Suite.</p>
          </div>
        `;
        break;

      default:
        subject = `📢 DK Suite Alert`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Alert Notification</h2>
            <p>You have a new alert from DK Suite.</p>
            <pre>${JSON.stringify(details, null, 2)}</pre>
          </div>
        `;
    }

    // Send email to all admins
    console.log(`Sending email to: ${adminEmails.join(", ")}`);
    
    const emailResponse = await sendEmail(adminEmails, subject, htmlContent);

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-alert-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});