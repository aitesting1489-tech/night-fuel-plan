import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (!res.ok) {
          setStatus("invalid");
        } else if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already_unsubscribed");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("error");
      }
    };

    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus("success");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already_unsubscribed");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl p-8 text-center border border-border">
        <p className="text-2xl mb-4">🌙</p>
        <h1 className="text-xl font-bold text-foreground font-serif mb-4">
          {status === "success" && "You've been unsubscribed"}
          {status === "already_unsubscribed" && "Already unsubscribed"}
          {status === "valid" && "Unsubscribe from emails"}
          {status === "invalid" && "Invalid link"}
          {status === "error" && "Something went wrong"}
          {status === "loading" && "Checking..."}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {status === "success" && "You won't receive any more app emails from Circadia."}
          {status === "already_unsubscribed" && "You're already unsubscribed from Circadia emails."}
          {status === "valid" && "Click below to stop receiving app emails from Circadia."}
          {status === "invalid" && "This unsubscribe link is invalid or has expired."}
          {status === "error" && "Please try again later or contact support."}
          {status === "loading" && "Validating your unsubscribe link..."}
        </p>
        {status === "valid" && (
          <button
            onClick={handleUnsubscribe}
            disabled={submitting}
            className="bg-primary text-primary-foreground font-bold py-3 px-6 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Processing..." : "Confirm Unsubscribe"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
