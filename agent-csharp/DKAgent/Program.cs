using DKAgent;
using Microsoft.Extensions.Hosting.WindowsServices;

bool isConsole = args.Contains("--console");

var builder = Host.CreateApplicationBuilder(args);

if (!isConsole)
    builder.Services.AddWindowsService(o => o.ServiceName = "DKAgent");

builder.Services.AddHostedService<AgentWorker>();

// Enroll before starting
var config = AgentConfig.Load();
if (string.IsNullOrEmpty(config.AgentToken) && !string.IsNullOrEmpty(config.EnrollToken))
{
    Console.WriteLine("[DKAgent] Enrolling device...");
    var enrolled = await EnrollmentHelper.EnrollAsync(config);
    if (enrolled)
    {
        Console.WriteLine("[DKAgent] Enrollment successful!");
        config.Save();
    }
    else
    {
        Console.WriteLine("[DKAgent] Enrollment failed - will retry later.");
    }
}

var host = builder.Build();
await host.RunAsync();
