import { useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { motion } from "framer-motion";
import { requestNotificationPermission, canSendPushNotifications } from "@/lib/notifications";
import { toast } from "sonner";

interface NotificationToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  nextNotificationTime?: string | null;
}

const NotificationToggle = ({ enabled, onToggle, nextNotificationTime }: NotificationToggleProps) => {
  const [requesting, setRequesting] = useState(false);

  const handleToggle = async () => {
    if (enabled) {
      onToggle(false);
      toast("Notifications paused", { icon: "🔕" });
      return;
    }

    // Request push permission if not granted
    if (!canSendPushNotifications()) {
      setRequesting(true);
      const granted = await requestNotificationPermission();
      setRequesting(false);
      if (!granted) {
        toast.info("Push notifications blocked — you'll still get in-app alerts.", { duration: 4000 });
      }
    }

    onToggle(true);
    toast("Notifications enabled! 🔔", {
      description: "You'll get hydration, meal, and shift alerts.",
      duration: 3000,
    });
  };

  return (
    <motion.button
      onClick={handleToggle}
      disabled={requesting}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-display font-medium transition-all border ${
        enabled
          ? "bg-primary/10 border-primary/40 text-primary glow-primary"
          : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
      }`}
    >
      {requesting ? (
        <div className="h-3.5 w-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      ) : enabled ? (
        <BellRing className="h-3.5 w-3.5" />
      ) : (
        <Bell className="h-3.5 w-3.5" />
      )}
      {enabled ? "Alerts On" : "Alerts Off"}
      {enabled && nextNotificationTime && (
        <span className="text-[10px] text-muted-foreground ml-1">
          Next: {nextNotificationTime}
        </span>
      )}
    </motion.button>
  );
};

export default NotificationToggle;
