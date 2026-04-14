import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Save, User, Leaf, Vegan, Drumstick, Flame, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import Starfield from "@/components/Starfield";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import WaterSettingsForm from "@/components/WaterSettingsForm";
import NotificationSettingsForm from "@/components/NotificationSettingsForm";
import { useWaterSettings } from "@/hooks/useWaterSettings";
import type { DietType } from "@/lib/schedule";
import { getMascotGender, setMascotGender, type MascotGender } from "@/lib/mascotPrefs";

const diets: Array<{ value: DietType; label: string; icon: typeof Leaf }> = [
  { value: "standard", label: "Standard", icon: Drumstick },
  { value: "vegetarian", label: "Vegetarian", icon: Leaf },
  { value: "vegan", label: "Vegan", icon: Vegan },
  { value: "keto", label: "Keto", icon: Flame },
];

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [diet, setDiet] = useState<DietType>("standard");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { settings: waterSettings, saveSettings: saveWaterSettings, setSettings: setWaterSettings } = useWaterSettings();
  const [mascotPref, setMascotPref] = useState<MascotGender>(getMascotGender());

  const handleMascotGenderChange = useCallback((gender: MascotGender) => {
    setMascotGender(gender);
    setMascotPref(gender);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, preferred_diet")
      .eq("id", user.id)
      .single();
    if (data) {
      setDisplayName(data.display_name || "");
      setAvatarUrl(data.avatar_url);
      setDiet((data.preferred_diet as DietType) || "standard");
    }
    setLoaded(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    setAvatarUrl(newUrl);

    await supabase
      .from("profiles")
      .update({ avatar_url: newUrl, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    trackEvent("avatar_updated");
    toast.success("Avatar updated!");
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const [profileResult, waterResult] = await Promise.all([
      supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          preferred_diet: diet,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id),
      saveWaterSettings(waterSettings),
    ]);

    if (profileResult.error || waterResult) {
      toast.error("Failed to save");
    } else {
      trackEvent("profile_updated", { diet });
      toast.success("Profile saved!");
    }
    setSaving(false);
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Starfield />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-screen px-4 py-12"
      >
        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="font-display text-xl font-bold text-foreground neon-text">Profile Settings</h1>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative group"
              disabled={uploading}
            >
              <div className="h-24 w-24 rounded-full border-2 border-primary/30 overflow-hidden bg-card flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {uploading ? (
                  <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-foreground" />
                )}
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <p className="text-[10px] text-muted-foreground">Tap to change avatar (max 2MB)</p>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={100}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full rounded-xl border border-border bg-card/50 px-3 py-2.5 text-sm text-muted-foreground font-body cursor-not-allowed"
            />
          </div>

          {/* Diet Preference */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Default diet preference</label>
            <div className="grid grid-cols-2 gap-2">
              {diets.map((d) => {
                const Icon = d.icon;
                return (
                  <button
                    key={d.value}
                    onClick={() => setDiet(d.value)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-display font-medium transition-all duration-200 active:scale-95 flex items-center gap-2 ${
                      diet === d.value
                        ? "border-primary/50 bg-primary/10 text-primary glow-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Water Intake Settings */}
          <WaterSettingsForm settings={waterSettings} onChange={setWaterSettings} />

          {/* Notification Preferences */}
          <NotificationSettingsForm
            settings={waterSettings}
            onChange={setWaterSettings}
            mascotGender={mascotPref}
            onMascotGenderChange={handleMascotGenderChange}
          />

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-primary py-3 px-4 font-display font-semibold text-sm text-primary-foreground flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.98] transition-all duration-200 glow-primary disabled:opacity-60"
          >
            {saving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
              />
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>

          {/* Delete Account */}
          <div className="pt-6 border-t border-border">
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <button className="w-full rounded-xl border border-destructive/30 py-3 px-4 font-display text-sm text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account and all associated data including saved shifts, hydration logs, and achievements. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      setDeleting(true);
                      try {
                        const { error } = await supabase.functions.invoke("delete-account");
                        if (error) throw error;
                        await signOut();
                        toast.success("Account deleted successfully");
                        navigate("/");
                      } catch (err: any) {
                        toast.error(err.message || "Failed to delete account");
                      } finally {
                        setDeleting(false);
                      }
                    }}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Deleting..." : "Delete permanently"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Profile;
