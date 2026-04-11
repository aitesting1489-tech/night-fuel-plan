import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ShiftSetup from "@/components/ShiftSetup";
import ShiftDashboard from "@/components/ShiftDashboard";
import NightOffDashboard from "@/components/NightOffDashboard";
import Starfield from "@/components/Starfield";
import AuthPage from "@/pages/Auth";
import { LogOut, Save, History, Settings, Mail, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { useNavigate } from "react-router-dom";
import type { DietType } from "@/lib/schedule";
import type { ShiftMode } from "@/components/ShiftSetup";

interface SavedShift {
  id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  diet: string;
  mode: string;
  created_at: string;
}

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [guest, setGuest] = useState(false);
  const [shift, setShift] = useState<{ start: string; end: string; diet: DietType; name: string; mode: ShiftMode } | null>(null);
  const [savedShifts, setSavedShifts] = useState<SavedShift[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    const handler = () => setGuest(true);
    window.addEventListener("circadia-guest", handler);
    return () => window.removeEventListener("circadia-guest", handler);
  }, []);

  useEffect(() => {
    if (user) loadSavedShifts();
  }, [user]);

  const loadSavedShifts = async () => {
    const { data } = await supabase
      .from("saved_shifts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setSavedShifts(data as SavedShift[]);
  };

  const saveCurrentShift = async () => {
    if (!user || !shift) return;
    const { error } = await supabase.from("saved_shifts").insert({
      user_id: user.id,
      shift_name: shift.name,
      start_time: shift.start,
      end_time: shift.end,
      diet: shift.diet,
      mode: shift.mode,
    });
    if (error) {
      toast.error("Failed to save shift");
    } else {
      trackEvent("shift_saved");
      toast.success("Shift saved!");
      loadSavedShifts();
    }
  };

  const loadShift = (s: SavedShift) => {
    setShift({
      start: s.start_time,
      end: s.end_time,
      diet: s.diet as DietType,
      name: s.shift_name,
      mode: s.mode as ShiftMode,
    });
    setShowHistory(false);
  };

  const deleteShift = async (id: string) => {
    await supabase.from("saved_shifts").delete().eq("id", id);
    loadSavedShifts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !guest) {
    return (
      <>
        <Starfield />
        <AuthPage />
      </>
    );
  }

  return (
    <>
      <Starfield />

      {/* Hamburger menu */}
      {user && !shift && (
        <div ref={menuRef} className="fixed top-4 left-4 z-30">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {menuOpen && (
            <div className="absolute top-12 left-0 w-56 rounded-xl bg-card border border-border p-2 space-y-1 dreamy-blur shadow-lg shadow-primary/5 animate-scale-in">
              {savedShifts.length > 0 && (
                <button
                  onClick={() => { setShowHistory(!showHistory); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-display text-foreground hover:bg-primary/5 transition-colors"
                >
                  <History className="h-4 w-4 text-muted-foreground" />
                  Saved Shifts
                </button>
              )}
              <button
                onClick={() => { navigate("/profile"); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-display text-foreground hover:bg-primary/5 transition-colors"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                Profile Settings
              </button>
              <button
                onClick={() => { navigate("/contact"); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-display text-foreground hover:bg-primary/5 transition-colors"
              >
                <Mail className="h-4 w-4 text-muted-foreground" />
                Contact
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-display text-destructive hover:bg-destructive/5 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}

      {/* Saved shifts dropdown */}
      {showHistory && (
        <div className="fixed top-16 left-4 z-30 w-72 rounded-xl bg-card border border-border p-3 space-y-2 dreamy-blur shadow-lg">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Shifts</p>
          {savedShifts.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg bg-background/50 p-2">
              <button onClick={() => loadShift(s)} className="text-left flex-1">
                <p className="text-xs font-display font-semibold text-foreground">{s.shift_name || `${s.start_time}–${s.end_time}`}</p>
                <p className="text-[10px] text-muted-foreground">{s.diet} · {s.mode}</p>
              </button>
              <button
                onClick={() => deleteShift(s.id)}
                className="text-muted-foreground hover:text-destructive text-xs ml-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {!shift ? (
        <ShiftSetup onGenerate={(start, end, diet, shiftName, mode) => setShift({ start, end, diet, name: shiftName, mode })} />
      ) : shift.mode === "night-off" ? (
        <NightOffDashboard
          bedtime={shift.start}
          diet={shift.diet}
          onBack={() => setShift(null)}
        />
      ) : (
        <>
          <ShiftDashboard
            startTime={shift.start}
            endTime={shift.end}
            diet={shift.diet}
            shiftName={shift.name}
            onBack={() => setShift(null)}
          />
          {user && (
            <div className="fixed bottom-6 right-6 z-30">
              <button
                onClick={saveCurrentShift}
                className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg glow-primary hover:brightness-110 active:scale-95 transition-all"
              >
                <Save className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Index;
