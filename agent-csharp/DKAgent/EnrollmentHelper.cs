using System.Net.Http.Json;
using System.Text.Json;

namespace DKAgent;

public static class EnrollmentHelper
{
    public static async Task<bool> EnrollAsync(AgentConfig config)
    {
        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
            var payload = new
            {
                enrollToken = config.EnrollToken,
                hostname    = Environment.MachineName,
                os          = Environment.OSVersion.ToString(),
                agentVersion= config.AgentVersion,
                deviceType  = "Desktop"
            };
            var res = await http.PostAsJsonAsync($"{config.ServerUrl}/api/agent/enroll", payload);
            if (!res.IsSuccessStatusCode) return false;
            var body = await res.Content.ReadFromJsonAsync<JsonElement>();
            config.AgentToken  = body.GetProperty("agentToken").GetString() ?? "";
            config.DeviceId    = body.GetProperty("deviceId").GetString() ?? "";
            config.EnrollToken = ""; // clear one-time token
            return !string.IsNullOrEmpty(config.AgentToken);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Enroll] Error: {ex.Message}");
            return false;
        }
    }
}
