import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isProSubscriber: boolean;
  subscriptionEnd: string | null;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  isProSubscriber: false,
  subscriptionEnd: null,
  checkSubscription: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProSubscriber, setIsProSubscriber] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setIsProSubscriber(data?.subscribed ?? false);
      setSubscriptionEnd(data?.subscription_end ?? null);
    } catch (err) {
      console.error("Subscription check failed:", err);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === "SIGNED_IN" && session?.user) {
          const user = session.user;
          const createdAt = new Date(user.created_at).getTime();
          const now = Date.now();
          if (now - createdAt < 30000) {
            supabase.functions.invoke("send-transactional-email", {
              body: {
                templateName: "welcome",
                recipientEmail: user.email,
                idempotencyKey: `welcome-${user.id}`,
                templateData: {
                  displayName: user.user_metadata?.display_name || user.email?.split("@")[0],
                },
              },
            }).catch(console.error);
          }
          // Check subscription after sign in
          setTimeout(() => checkSubscription(), 0);
        }

        if (event === "SIGNED_OUT") {
          setIsProSubscriber(false);
          setSubscriptionEnd(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        checkSubscription();
      }
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription]);

  // Periodic subscription check every 60s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, isProSubscriber, subscriptionEnd, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};
