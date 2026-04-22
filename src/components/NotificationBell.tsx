// =============================================
// NOTIFICATION BELL — header dropdown, realtime updates
// =============================================

import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { requestNotificationPermission } from '@/lib/notifications';

export default function NotificationBell() {
  const { items, unreadCount, markAllRead, markRead } = useNotifications();
  const navigate = useNavigate();

  // Ask for browser permission on mount (silent if already decided)
  useEffect(() => { requestNotificationPermission(); }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <p className="font-semibold text-sm">Notifications</p>
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={markAllRead}>
              <CheckCheck className="h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No notifications yet</p>
          ) : (
            <div className="divide-y">
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { markRead(n.id); if (n.link) navigate(n.link); }}
                  className={`w-full text-left p-3 hover:bg-muted/60 transition-colors ${!n.is_read ? 'bg-accent/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
