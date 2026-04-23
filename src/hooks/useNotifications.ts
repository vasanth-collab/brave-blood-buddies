// =============================================
// useNotifications — fetch + realtime + browser push
// =============================================

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { AppNotification } from '@/types';
import { showBrowserNotification } from '@/lib/notifications';

export function useNotifications() {
  const { authUser } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) { setItems([]); setLoading(false); return; }

    let active = true;
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (active) {
          setItems((data ?? []) as AppNotification[]);
          setLoading(false);
        }
      });

    const channel = supabase
      .channel(`notif-${authUser.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${authUser.id}` },
        (payload) => {
          const n = payload.new as AppNotification;
          setItems((prev) => [n, ...prev].slice(0, 30));
          showBrowserNotification(n.title, n.message, n.link ?? undefined);
        }
      )
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [authUser]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (!authUser) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', authUser.id).eq('is_read', false);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  return { items, unreadCount, loading, markAllRead, markRead };
}
