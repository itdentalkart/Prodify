import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Download, 
  Share, 
  Plus, 
  Check, 
  Monitor, 
  Apple, 
  Chrome,
  MoreVertical,
  ArrowDown
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);
    setIsInstalled(isStandaloneMode);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <MainLayout title="Install App" subtitle="Install DK Suite on your device">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Status Card */}
        <Card className={isInstalled ? "border-green-500/50 bg-green-500/5" : "border-primary/30 bg-primary/5"}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Smartphone className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">
              {isInstalled ? 'App Installed!' : 'Install DK Suite'}
            </CardTitle>
            <CardDescription>
              {isInstalled 
                ? 'DK Suite is installed on your device' 
                : 'Add DK Suite to your home screen for quick access'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {isInstalled ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">Successfully Installed</span>
              </div>
            ) : deferredPrompt ? (
              <Button onClick={handleInstallClick} size="lg" className="gap-2">
                <Download className="h-5 w-5" />
                Install Now
              </Button>
            ) : (
              <p className="text-muted-foreground text-sm">
                Follow the instructions below for your device
              </p>
            )}
          </CardContent>
        </Card>

        {/* Installation Instructions */}
        {!isInstalled && (
          <div className="space-y-4">
            {/* iOS Instructions */}
            <Card className={isIOS ? "ring-2 ring-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Apple className="h-5 w-5" />
                    iPhone / iPad
                  </CardTitle>
                  {isIOS && <Badge>Your Device</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium">Tap the Share button</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Share className="h-4 w-4" /> at the bottom of Safari
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium">Scroll down and tap "Add to Home Screen"</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Plus className="h-4 w-4" /> Add to Home Screen
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium">Tap "Add" to confirm</p>
                      <p className="text-sm text-muted-foreground">The app will appear on your home screen</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Android Instructions */}
            <Card className={isAndroid ? "ring-2 ring-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Chrome className="h-5 w-5" />
                    Android
                  </CardTitle>
                  {isAndroid && <Badge>Your Device</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deferredPrompt ? (
                    <div className="text-center py-4">
                      <Button onClick={handleInstallClick} size="lg" className="gap-2">
                        <Download className="h-5 w-5" />
                        Install DK Suite
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">1</div>
                        <div>
                          <p className="font-medium">Tap the menu button</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MoreVertical className="h-4 w-4" /> Three dots at the top right
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">2</div>
                        <div>
                          <p className="font-medium">Tap "Install app" or "Add to Home screen"</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <ArrowDown className="h-4 w-4" /> Install app
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">3</div>
                        <div>
                          <p className="font-medium">Confirm installation</p>
                          <p className="text-sm text-muted-foreground">The app will be added to your home screen</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Desktop Instructions */}
            <Card className={!isIOS && !isAndroid ? "ring-2 ring-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Monitor className="h-5 w-5" />
                    Desktop (Chrome/Edge)
                  </CardTitle>
                  {!isIOS && !isAndroid && <Badge>Your Device</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deferredPrompt ? (
                    <div className="text-center py-4">
                      <Button onClick={handleInstallClick} size="lg" className="gap-2">
                        <Download className="h-5 w-5" />
                        Install DK Suite
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">1</div>
                        <div>
                          <p className="font-medium">Look for the install icon</p>
                          <p className="text-sm text-muted-foreground">
                            In the address bar (right side), you'll see a + or computer icon
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">2</div>
                        <div>
                          <p className="font-medium">Click "Install"</p>
                          <p className="text-sm text-muted-foreground">Confirm the installation in the popup</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">App Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Works Offline</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Fast Loading</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Home Screen Icon</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Full Screen Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">No App Store Needed</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Auto Updates</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
