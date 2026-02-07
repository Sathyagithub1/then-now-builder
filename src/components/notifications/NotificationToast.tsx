import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
}

export const NotificationToast = () => {
  useEffect(() => {
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const channel = supabase
      .channel('notifications-toast')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          showToast(newNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_message": return "💬";
      case "order_status": return "📦";
      case "quote_received": return "💰";
      case "quote_response": return "✅";
      case "new_review": return "⭐";
      case "payment_update": return "💳";
      default: return "🔔";
    }
  };

  const showToast = (notification: Notification) => {
    toast(notification.title, {
      description: notification.message,
      icon: getNotificationIcon(notification.type),
      duration: 5000,
    });
  };

  return null;
};
