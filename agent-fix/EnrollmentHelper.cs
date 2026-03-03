// ═══════════════════════════════════════════════════════════════════════════
// EnrollmentHelper.cs — Handles device enrollment at service startup
// NEW FILE: Add this to your DKAgent project
// ═══════════════════════════════════════════════════════════════════════════

using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace DKAgent
{
    public static class EnrollmentHelper
    {
        public static async Task<bool> TryEnroll(AgentConfig config)
        {
            try
            {
                Console.WriteLine($"Enrolling with server: {config.ServerUrl}");

                using var http = new HttpClient
                {
                    BaseAddress = new Uri(config.ServerUrl),
                    Timeout = TimeSpan.FromSeconds(30)
                };

                var payload = new
                {
                    enroll_token  = config.EnrollToken,
                    hostname      = Environment.MachineName,
                    os            = Environment.OSVersion.ToString(),
                    device_type   = "Desktop",
                    ip_address    = GetLocalIP(),
                    agent_version = config.AgentVersion,
                };

                var response = await http.PostAsJsonAsync(config.EnrollEndpoint, payload);

                if (!response.IsSuccessStatusCode)
                {
                    var body = await response.Content.ReadAsStringAsync();
                    Console.Error.WriteLine($"Enrollment failed [{response.StatusCode}]: {body}");
                    return false;
                }

                var result = await response.Content.ReadFromJsonAsync<EnrollResponse>();
                if (result == null) return false;

                config.DeviceId   = result.device_id;
                config.AgentToken = result.agent_token;
                config.EnrollToken = string.Empty; // Clear one-time token

                // Apply server config if provided
                if (result.config != null)
                {
                    config.ScreenshotIntervalSec = result.config.screenshot_interval_sec;
                    config.HeartbeatIntervalSec  = result.config.heartbeat_interval_sec;
                    config.IdleThresholdSec      = result.config.idle_threshold_sec;
                }

                Console.WriteLine($"✅ Enrolled! DeviceId: {config.DeviceId}");
                return true;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Enrollment exception: {ex.Message}");
                return false;
            }
        }

        private static string GetLocalIP()
        {
            try
            {
                var host = System.Net.Dns.GetHostEntry(System.Net.Dns.GetHostName());
                foreach (var ip in host.AddressList)
                {
                    if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                        return ip.ToString();
                }
            }
            catch { }
            return "unknown";
        }

        private class EnrollResponse
        {
            public string device_id   { get; set; } = string.Empty;
            public string agent_token { get; set; } = string.Empty;
            public EnrollConfig? config { get; set; }
        }

        private class EnrollConfig
        {
            public int screenshot_interval_sec { get; set; } = 300;
            public int heartbeat_interval_sec  { get; set; } = 60;
            public int idle_threshold_sec      { get; set; } = 300;
        }
    }
}
