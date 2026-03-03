// ═══════════════════════════════════════════════════════════════════════════
// AgentConfig.cs — Fixed version for local Ubuntu server
// Replace the existing AgentConfig.cs in your DKAgent project with this file
// ═══════════════════════════════════════════════════════════════════════════

using System;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace DKAgent
{
    public class AgentConfig
    {
        // ─── Config file path ─────────────────────────────────────────────────
        [JsonIgnore]
        public static string ConfigPath =>
            Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
                "DKAgent",
                "config.json"
            );

        // ─── Server URL ───────────────────────────────────────────────────────
        // Change this to your Ubuntu server IP!
        // Example: "http://192.168.1.100:3000"
        public string ServerUrl { get; set; } = "http://192.168.1.100:3000";

        // ─── Device identity (filled after enrollment) ────────────────────────
        public string DeviceId    { get; set; } = string.Empty;
        public string AgentToken  { get; set; } = string.Empty;
        public string AgentVersion { get; set; } = "1.0.0";

        // ─── Monitoring config ────────────────────────────────────────────────
        public int ScreenshotIntervalSec { get; set; } = 300;
        public int HeartbeatIntervalSec  { get; set; } = 60;   // ← was 300, now 60s for faster detection
        public int IdleThresholdSec      { get; set; } = 300;
        public string WorkingHours       { get; set; } = "09:00-18:00";

        // ─── Enrollment token (only needed once, cleared after enrollment) ────
        public string EnrollToken { get; set; } = string.Empty;

        // ─── API endpoints ────────────────────────────────────────────────────
        // NOTE: Local server does NOT need /functions/v1 prefix
        [JsonIgnore]
        public string EnrollEndpoint     => "/agent-enroll";
        [JsonIgnore]
        public string HeartbeatEndpoint  => "/agent-heartbeat";
        [JsonIgnore]
        public string ScreenshotEndpoint => "/agent-screenshot";
        [JsonIgnore]
        public string EventsEndpoint     => "/agent-events";

        // ─── Is enrolled? ──────────────────────────────────────────────────────
        [JsonIgnore]
        public bool IsEnrolled => !string.IsNullOrEmpty(AgentToken);

        // ─── Load from file ────────────────────────────────────────────────────
        public static AgentConfig Load()
        {
            try
            {
                if (File.Exists(ConfigPath))
                {
                    var json = File.ReadAllText(ConfigPath);
                    return JsonSerializer.Deserialize<AgentConfig>(json)
                           ?? new AgentConfig();
                }
            }
            catch (Exception ex)
            {
                // Log but don't crash — use defaults
                Console.Error.WriteLine($"Config load error: {ex.Message}");
            }
            return new AgentConfig();
        }

        // ─── Save to file ──────────────────────────────────────────────────────
        public void Save()
        {
            try
            {
                var dir = Path.GetDirectoryName(ConfigPath)!;
                Directory.CreateDirectory(dir);

                var json = JsonSerializer.Serialize(this, new JsonSerializerOptions
                {
                    WriteIndented = true
                });
                File.WriteAllText(ConfigPath, json);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Config save error: {ex.Message}");
            }
        }
    }
}
