import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Monitor, 
  Camera, 
  BarChart3, 
  Users, 
  Settings, 
  Shield,
  Activity,
  Download,
  LogOut,
  Clock,
  Target,
  Globe,
  TrendingUp,
  Smartphone,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Devices', href: '/devices', icon: Monitor },
  { name: 'Screenshots', href: '/screenshots', icon: Camera },
  { name: 'Timeline', href: '/timeline', icon: Clock },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Productivity', href: '/productivity', icon: TrendingUp },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Apps & URLs', href: '/apps-urls', icon: Globe },
  { name: 'Sessions', href: '/sessions', icon: BarChart3 },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Audit Logs', href: '/audit', icon: Shield },
  { name: 'Agent Download', href: '/agent-download', icon: Download },
  { name: 'Install Mobile App', href: '/install', icon: Smartphone },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const superAdminNav = [
  { name: 'Super Admin', href: '/super-admin', icon: Crown },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const { isSuperAdmin } = useUserRole();
  const navItems = isSuperAdmin ? [...superAdminNav, ...navigation] : navigation;

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Monitor className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">DK Suite</h1>
            <p className="text-xs text-muted-foreground">Productivity Monitor</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-primary'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-sidebar-border p-4">
          <div className="glass-card rounded-lg p-3">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.user_metadata?.display_name || 'Admin'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
