import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Droplets, Flame, Users, Globe, UserPlus, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Starfield from "@/components/Starfield";

type SortMetric = "volume" | "streak";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  friend_code: string;
  weekly_volume_ml: number;
  current_streak: number;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [myProfile, setMyProfile] = useState<{ display_name: string; friend_code: string; opted_in: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortMetric>("volume");
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    // Ensure leaderboard profile exists
    const { data: profile } = await supabase
      .from("leaderboard_profiles")
      .select("display_name, friend_code, opted_in")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Anonymous";
      await supabase.from("leaderboard_profiles").insert({ user_id: user.id, display_name: displayName });
      const { data: newProfile } = await supabase
        .from("leaderboard_profiles")
        .select("display_name, friend_code, opted_in")
        .eq("user_id", user.id)
        .single();
      setMyProfile(newProfile);
    } else {
      setMyProfile(profile);
    }

    // Load leaderboard stats
    const { data: stats } = await supabase.rpc("get_leaderboard_stats");
    if (stats) setEntries(stats as LeaderboardEntry[]);

    // Load friends
    const { data: friendRows } = await supabase
      .from("friend_connections")
      .select("friend_user_id, user_id")
      .or(`user_id.eq.${user.id},friend_user_id.eq.${user.id}`);

    if (friendRows) {
      const friendIds = friendRows.map((r) =>
        r.user_id === user.id ? r.friend_user_id : r.user_id
      );
      setFriends(friendIds);
    }

    setLoading(false);
  };

  const addFriend = async () => {
    if (!user || !friendCodeInput.trim()) return;
    setAdding(true);

    // Find user by friend code
    const { data: target } = await supabase
      .from("leaderboard_profiles")
      .select("user_id")
      .eq("friend_code", friendCodeInput.trim().toLowerCase())
      .maybeSingle();

    if (!target) {
      toast({ title: "Not found", description: "No user with that friend code.", variant: "destructive" });
      setAdding(false);
      return;
    }

    if (target.user_id === user.id) {
      toast({ title: "That's you!", description: "You can't add yourself.", variant: "destructive" });
      setAdding(false);
      return;
    }

    const { error } = await supabase.from("friend_connections").insert({
      user_id: user.id,
      friend_user_id: target.user_id,
    });

    if (error?.code === "23505") {
      toast({ title: "Already friends", description: "You're already connected!" });
    } else if (error) {
      toast({ title: "Error", description: "Could not add friend.", variant: "destructive" });
    } else {
      toast({ title: "Friend added! 🎉", description: "They'll appear on your friends leaderboard." });
      setFriendCodeInput("");
      loadData();
    }
    setAdding(false);
  };

  const copyFriendCode = () => {
    if (myProfile?.friend_code) {
      navigator.clipboard.writeText(myProfile.friend_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleOptIn = async () => {
    if (!user || !myProfile) return;
    const newVal = !myProfile.opted_in;
    await supabase.from("leaderboard_profiles").update({ opted_in: newVal }).eq("user_id", user.id);
    setMyProfile({ ...myProfile, opted_in: newVal });
    if (newVal) loadData();
  };

  if (!user) {
    navigate("/");
    return null;
  }

  const sorted = [...entries].sort((a, b) =>
    sortBy === "volume"
      ? b.weekly_volume_ml - a.weekly_volume_ml
      : b.current_streak - a.current_streak
  );

  const friendEntries = sorted.filter(
    (e) => friends.includes(e.user_id) || e.user_id === user.id
  );

  const renderRank = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  const renderTable = (data: LeaderboardEntry[]) => (
    <div className="space-y-2">
      {data.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No entries yet. Start hydrating!</p>
      ) : (
        data.map((entry, i) => (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
              entry.user_id === user.id
                ? "bg-primary/10 border-primary/30"
                : "bg-card/60 border-border/40"
            }`}
          >
            <span className="text-lg font-bold w-10 text-center">{renderRank(i)}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {entry.display_name}
                {entry.user_id === user.id && (
                  <span className="text-xs text-muted-foreground ml-1">(you)</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-blue-400">
                <Droplets className="w-4 h-4" />
                <span>{(entry.weekly_volume_ml / 1000).toFixed(1)}L</span>
              </div>
              <div className="flex items-center gap-1 text-orange-400">
                <Flame className="w-4 h-4" />
                <span>{entry.current_streak}d</span>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground px-4 py-6 max-w-lg mx-auto">
      <Starfield />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h1 className="text-xl font-bold">Leaderboard</h1>
        </div>

        {/* Opt-in toggle & friend code */}
        {myProfile && (
          <div className="bg-card/60 backdrop-blur rounded-xl border border-border/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Show me on leaderboard</span>
              <button
                onClick={toggleOptIn}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  myProfile.opted_in ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    myProfile.opted_in ? "left-6" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Your code:</span>
              <code className="bg-muted/50 px-2 py-1 rounded text-sm font-mono">{myProfile.friend_code}</code>
              <button onClick={copyFriendCode} className="text-muted-foreground hover:text-foreground">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Add friend */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter friend code..."
            value={friendCodeInput}
            onChange={(e) => setFriendCodeInput(e.target.value)}
            className="bg-card/60 border-border/40"
          />
          <Button onClick={addFriend} disabled={adding || !friendCodeInput.trim()} size="sm">
            <UserPlus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Sort toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("volume")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
              sortBy === "volume" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-muted/30 text-muted-foreground"
            }`}
          >
            <Droplets className="w-3.5 h-3.5" /> Weekly Volume
          </button>
          <button
            onClick={() => setSortBy("streak")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
              sortBy === "streak" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-muted/30 text-muted-foreground"
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Streak
          </button>
        </div>

        {/* Tabs */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="global">
            <TabsList className="w-full bg-card/60">
              <TabsTrigger value="global" className="flex-1 gap-1">
                <Globe className="w-4 h-4" /> Global
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex-1 gap-1">
                <Users className="w-4 h-4" /> Friends ({friends.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="global" className="mt-4">
              {renderTable(sorted)}
            </TabsContent>
            <TabsContent value="friends" className="mt-4">
              {renderTable(friendEntries)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
