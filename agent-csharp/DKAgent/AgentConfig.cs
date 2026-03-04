using System.Text.Json;

namespace DKAgent;

public class AgentConfig
{
    public string ServerUrl { get; set; } = "http://192.168.11.90:3000";
    public string DeviceId { get; set; } = "";
    public string AgentToken { get; set; } = "";
    public string EnrollToken { get; set; } = "";
    public string AgentVersion { get; set; } = "1.0.0";
    public int ScreenshotIntervalSec { get; set; } = 300;
    public int HeartbeatIntervalSec { get; set; } = 60;
    public int IdleThresholdSec { get; set; } = 300;
    public string WorkingHours { get; set; } = "09:00-18:00";

    private static readonly string ConfigPath =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
                     "DKAgent", "config.json");

    public static AgentConfig Load()
    {
        if (!File.Exists(ConfigPath))
            return new AgentConfig();
        var json = File.ReadAllText(ConfigPath);
        return JsonSerializer.Deserialize<AgentConfig>(json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? new AgentConfig();
    }

    public void Save()
    {
        Directory.CreateDirectory(Path.GetDirectoryName(ConfigPath)!);
        File.WriteAllText(ConfigPath,
            JsonSerializer.Serialize(this, new JsonSerializerOptions { WriteIndented = true }));
    }
}
