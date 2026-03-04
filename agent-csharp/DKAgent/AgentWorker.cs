using System.Net.Http.Json;
using System.Runtime.InteropServices;
using System.Drawing;
using System.Drawing.Imaging;

namespace DKAgent;

public class AgentWorker : BackgroundService
{
    private AgentConfig _config = AgentConfig.Load();
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(30) };
    private DateTime _lastScreenshot = DateTime.MinValue;
    private DateTime _lastHeartbeat  = DateTime.MinValue;

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        Console.WriteLine($"[DKAgent] Starting. Server: {_config.ServerUrl}");

        while (!ct.IsCancellationRequested)
        {
            try
            {
                _config = AgentConfig.Load();

                // Retry enrollment if needed
                if (string.IsNullOrEmpty(_config.AgentToken) && !string.IsNullOrEmpty(_config.EnrollToken))
                {
                    await EnrollmentHelper.EnrollAsync(_config);
                    _config.Save();
                }

                if (!string.IsNullOrEmpty(_config.AgentToken))
                {
                    var now = DateTime.UtcNow;

                    if ((now - _lastHeartbeat).TotalSeconds >= _config.HeartbeatIntervalSec)
                    {
                        await SendHeartbeatAsync();
                        _lastHeartbeat = now;
                    }

                    if ((now - _lastScreenshot).TotalSeconds >= _config.ScreenshotIntervalSec)
                    {
                        await CaptureAndSendScreenshotAsync();
                        _lastScreenshot = now;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AgentWorker] Error: {ex.Message}");
            }

            await Task.Delay(10_000, ct);
        }
    }

    private void SetAuthHeader()
    {
        _http.DefaultRequestHeaders.Remove("Authorization");
        _http.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.AgentToken}");
    }

    private async Task SendHeartbeatAsync()
    {
        try
        {
            SetAuthHeader();
            var payload = new
            {
                deviceId    = _config.DeviceId,
                status      = "online",
                ipAddress   = GetLocalIp(),
                agentVersion= _config.AgentVersion,
                os          = Environment.OSVersion.ToString()
            };
            var res = await _http.PostAsJsonAsync($"{_config.ServerUrl}/api/agent/heartbeat", payload);
            Console.WriteLine($"[Heartbeat] {(res.IsSuccessStatusCode ? "OK" : res.StatusCode)}");
        }
        catch (Exception ex) { Console.WriteLine($"[Heartbeat] {ex.Message}"); }
    }

    private async Task CaptureAndSendScreenshotAsync()
    {
        try
        {
            SetAuthHeader();
            var bytes = CaptureScreen();
            if (bytes == null) return;

            using var content = new MultipartFormDataContent();
            content.Add(new ByteArrayContent(bytes), "screenshot", "screenshot.jpg");
            content.Add(new StringContent(_config.DeviceId), "deviceId");
            content.Add(new StringContent(DateTime.UtcNow.ToString("o")), "capturedAt");

            var res = await _http.PostAsync($"{_config.ServerUrl}/api/agent/screenshot", content);
            Console.WriteLine($"[Screenshot] {(res.IsSuccessStatusCode ? "OK" : res.StatusCode)}");
        }
        catch (Exception ex) { Console.WriteLine($"[Screenshot] {ex.Message}"); }
    }

    private static byte[]? CaptureScreen()
    {
        try
        {
            var bounds = System.Windows.Forms.Screen.PrimaryScreen?.Bounds
                         ?? new Rectangle(0, 0, 1920, 1080);
            using var bmp = new Bitmap(bounds.Width, bounds.Height);
            using var g   = Graphics.FromImage(bmp);
            g.CopyFromScreen(bounds.Location, Point.Empty, bounds.Size);
            using var ms  = new MemoryStream();
            var encoder   = GetJpegEncoder();
            var encParams = new EncoderParameters(1);
            encParams.Param[0] = new EncoderParameter(Encoder.Quality, 60L);
            bmp.Save(ms, encoder, encParams);
            return ms.ToArray();
        }
        catch { return null; }
    }

    private static ImageCodecInfo GetJpegEncoder() =>
        ImageCodecInfo.GetImageEncoders().First(c => c.MimeType == "image/jpeg");

    private static string GetLocalIp()
    {
        try
        {
            return System.Net.Dns.GetHostAddresses(System.Net.Dns.GetHostName())
                .FirstOrDefault(a => a.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                ?.ToString() ?? "unknown";
        }
        catch { return "unknown"; }
    }

    [DllImport("user32.dll")] static extern bool GetLastInputInfo(ref LASTINPUTINFO info);
    [StructLayout(LayoutKind.Sequential)] struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }
}
