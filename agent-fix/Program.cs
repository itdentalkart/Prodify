// ═══════════════════════════════════════════════════════════════════════════
// Program.cs — Fixed version that properly starts as Windows Service
// ═══════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.EventLog;

namespace DKAgent
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            // ─── Check if running as Windows Service ──────────────────────────
            bool isService = !Environment.UserInteractive;

            // Allow --console flag to run interactively for debugging
            if (args.Contains("--console")) isService = false;

            var builder = Host.CreateDefaultBuilder(args);

            if (isService)
            {
                // Run as Windows Service
                builder.UseWindowsService(options =>
                {
                    options.ServiceName = "DKAgent";
                });
            }

            builder.ConfigureLogging((context, logging) =>
            {
                logging.ClearProviders();

                if (isService)
                {
                    // Log to Windows Event Log when running as service
                    logging.AddEventLog(new EventLogSettings
                    {
                        SourceName = "DK Agent",
                        LogName = "Application",
                    });
                }
                else
                {
                    // Log to console when running interactively
                    logging.AddConsole();
                    logging.SetMinimumLevel(LogLevel.Debug);
                }
            })
            .ConfigureServices((context, services) =>
            {
                // Load config from file
                var config = AgentConfig.Load();

                // ── Key fix: If not enrolled, try to enroll before starting ──
                if (!config.IsEnrolled && !string.IsNullOrEmpty(config.EnrollToken))
                {
                    var enrolled = EnrollmentHelper.TryEnroll(config).GetAwaiter().GetResult();
                    if (enrolled) config.Save();
                }

                services.AddSingleton(config);
                services.AddSingleton<ScreenshotService>();
                services.AddSingleton<TelemetryClient>();
                services.AddSingleton<IdleDetector>();
                services.AddHostedService<AgentWorker>();
            });

            await builder.Build().RunAsync();
        }
    }
}
