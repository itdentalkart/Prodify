import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Copy, Check, Monitor, Apple, Terminal, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SERVER_URL = import.meta.env.VITE_API_URL || "http://192.168.11.90:3000";

function CopyBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="relative">
      <pre className="bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-green-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">{code}</pre>
      <button onClick={copy} className="absolute top-2 right-2 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors">
        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-white/60" />}
      </button>
    </div>
  );
}

function Step({ n, title, desc, children }: { n: number; title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary">{n}</div>
      <div className="flex-1 space-y-2 pb-4">
        <p className="font-medium text-sm">{title}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
        {children}
      </div>
    </div>
  );
}

export default function AgentDownload() {
  const winRun = "# PowerShell (Administrator)\n.\\install-windows.ps1";
  const linuxRun = "chmod +x install-linux.sh\nsudo ./install-linux.sh";
  const macRun = "chmod +x install-mac.sh\nsudo ./install-mac.sh";
  const winRm = "Stop-Service -Name \"DKAgent\" -Force\nsc.exe delete \"DKAgent\"\nRemove-Item \"$env:ProgramFiles\\DKAgent\" -Recurse -Force\nRemove-Item \"$env:ProgramData\\DKAgent\" -Recurse -Force";
  const macRm = "sudo launchctl unload /Library/LaunchDaemons/com.dk.agent.plist\nsudo rm -rf /usr/local/bin/dkagent /etc/dkagent";
  const linuxRm = "sudo systemctl stop dkagent && sudo systemctl disable dkagent\nsudo rm -f /etc/systemd/system/dkagent.service\nsudo rm -rf /usr/local/bin/dkagent /etc/dkagent";

  return (
    <MainLayout title="Agent Installation" subtitle="Deploy DK monitoring agent on Windows, macOS or Linux">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Install Agent</CardTitle>
            <CardDescription>
              Download the installer. Get enrollment token from <strong>Devices page → Generate Token</strong> before running.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="windows">
              <TabsList className="mb-5">
                <TabsTrigger value="windows" className="gap-2"><Monitor className="h-4 w-4" />Windows</TabsTrigger>
                <TabsTrigger value="mac" className="gap-2"><Apple className="h-4 w-4" />macOS</TabsTrigger>
                <TabsTrigger value="linux" className="gap-2"><Terminal className="h-4 w-4" />Linux</TabsTrigger>
              </TabsList>

              <TabsContent value="windows" className="space-y-1">
                <Step n={1} title="Download installer">
                  <div className="flex gap-3 flex-wrap mt-1">
                    <a href={SERVER_URL + "/downloads/DKAgent-Setup.exe"} download="DKAgent-Setup.exe">
                      <Button className="gap-2">
                        <Download className="h-4 w-4" />DKAgent-Setup.exe
                        <span className="text-xs opacity-70 ml-1">recommended</span>
                      </Button>
                    </a>
                    <a href={SERVER_URL + "/downloads/install-windows.bat"} download="install-windows.bat">
                      <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />install-windows.bat
                      </Button>
                    </a>
                  </div>
                </Step>
                <Step n={2} title="Get enrollment token" desc="Devices page → Generate Token → copy the token" />
                <Step n={3} title="Setup.exe will ask for token automatically — or for .bat run:">
                  <CopyBlock code={winRun} />
                </Step>
                <Step n={4} title="Device appears in dashboard within 1 minute" desc="Windows 10/11 · Admin rights required" />
              </TabsContent>

              <TabsContent value="mac" className="space-y-1">
                <Step n={1} title="Download installer">
                  <div className="mt-1">
                    <a href={SERVER_URL + "/downloads/install-mac.sh"} download="install-mac.sh">
                      <Button className="gap-2"><Download className="h-4 w-4" />install-mac.sh</Button>
                    </a>
                  </div>
                </Step>
                <Step n={2} title="Get enrollment token" desc="Devices page → Generate Token → copy the token" />
                <Step n={3} title="Open Terminal and run">
                  <CopyBlock code={macRun} />
                </Step>
                <Step n={4} title="Device appears in dashboard within 1 minute" desc="macOS 12+ · sudo access required" />
              </TabsContent>

              <TabsContent value="linux" className="space-y-1">
                <Step n={1} title="Download installer">
                  <div className="mt-1">
                    <a href={SERVER_URL + "/downloads/install-linux.sh"} download="install-linux.sh">
                      <Button className="gap-2"><Download className="h-4 w-4" />install-linux.sh</Button>
                    </a>
                  </div>
                </Step>
                <Step n={2} title="Get enrollment token" desc="Devices page → Generate Token → copy the token" />
                <Step n={3} title="Open Terminal and run">
                  <CopyBlock code={linuxRun} />
                </Step>
                <Step n={4} title="Device appears in dashboard within 1 minute" desc="Ubuntu 20+ · Debian 11+ · RHEL 8+ · systemd required" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-400">
              <Trash2 className="h-4 w-4" />Uninstall Agent
            </CardTitle>
            <CardDescription>Remove completely. Then delete device from Devices page to free the license.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="win-rm">
              <TabsList className="mb-4">
                <TabsTrigger value="win-rm" className="gap-2"><Monitor className="h-3.5 w-3.5" />Windows</TabsTrigger>
                <TabsTrigger value="mac-rm" className="gap-2"><Apple className="h-3.5 w-3.5" />macOS</TabsTrigger>
                <TabsTrigger value="linux-rm" className="gap-2"><Terminal className="h-3.5 w-3.5" />Linux</TabsTrigger>
              </TabsList>
              <TabsContent value="win-rm"><CopyBlock code={winRm} /></TabsContent>
              <TabsContent value="mac-rm"><CopyBlock code={macRm} /></TabsContent>
              <TabsContent value="linux-rm"><CopyBlock code={linuxRm} /></TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}