import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useNotifications,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
} from '@/hooks/useNotifications';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  Brain,
  BookOpen,
  Award,
  ShoppingBag,
  Users,
  FileText,
  Zap,
  Info,
  MessageSquare,
  CheckCheck,
} from 'lucide-react';

const TYPE_ICONS: Record<string, React.ElementType> = {
  plan_generated: Brain,
  module_published: BookOpen,
  evaluation_due: FileText,
  certificate_issued: Award,
  marketplace_purchase: ShoppingBag,
  team_invite: Users,
  dossier_status: FileText,
  ai_job_complete: Zap,
  system: Info,
  mention: MessageSquare,
};

const TYPE_COLORS: Record<string, string> = {
  plan_generated: 'text-purple-500',
  module_published: 'text-blue-500',
  evaluation_due: 'text-orange-500',
  certificate_issued: 'text-yellow-500',
  marketplace_purchase: 'text-green-500',
  team_invite: 'text-cyan-500',
  dossier_status: 'text-pink-500',
  ai_job_complete: 'text-primary',
  system: 'text-muted-foreground',
  mention: 'text-accent',
};

function timeAgo(date: string, fr: boolean): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return fr ? "À l'instant" : 'Just now';
  if (mins < 60) return fr ? `Il y a ${mins} min` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return fr ? `Il y a ${hrs}h` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return fr ? `Il y a ${days}j` : `${days}d ago`;
  return new Date(date).toLocaleDateString(fr ? 'fr-MA' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export const NotificationCenter = () => {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const handleClick = (n: { id: string; link: string | null; read: boolean }) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="text-sm font-semibold">
            {fr ? 'Notifications' : 'Notifications'}
          </h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-3 w-3" />
              {fr ? 'Tout lire' : 'Mark all read'}
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {fr ? 'Aucune notification' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] || Info;
                const color = TYPE_COLORS[n.type] || 'text-muted-foreground';
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex items-start gap-3 w-full text-start px-4 py-3 transition-colors hover:bg-muted/50 ${
                      !n.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className={`mt-0.5 ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${!n.read ? 'font-semibold' : ''}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground/60 mt-1">
                        {timeAgo(n.created_at, fr)}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
