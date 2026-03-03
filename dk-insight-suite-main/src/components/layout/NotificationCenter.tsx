import { useState } from 'react';
import { Bell, Check, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotificationCenter, Notification } from '@/hooks/useNotificationCenter';
import { formatDistanceToNow } from 'date-fns';

function NotificationItem({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: Notification; 
  onMarkAsRead: (id: string) => void;
}) {
  return (
    <div 
      className={`flex items-start gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors border-b border-border/50 last:border-0 ${
        notification.read ? 'opacity-60' : ''
      }`}
      onClick={() => onMarkAsRead(notification.id)}
    >
      <span className="text-xl flex-shrink-0">{notification.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {notification.description}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
        </p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      )}
    </div>
  );
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    markAsRead, 
    clearAll,
    refresh 
  } = useNotificationCenter();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={refresh}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={markAllAsRead}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={clearAll}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem 
                key={notification.id} 
                notification={notification} 
                onMarkAsRead={markAsRead}
              />
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}