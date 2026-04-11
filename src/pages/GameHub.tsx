import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Swords, Users, Trophy, Plus, Play, RefreshCw, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getMascotGender } from "@/lib/mascotPrefs";
import mascotBat from "@/assets/mascot-bat.png";
import mascotBatFemale from "@/assets/mascot-bat-female.png";
import Starfield from "@/components/Starfield";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Challenge = {
  id: string;
  challenger_id: string;
  opponent_id: string;
  game_type: string;
  challenger_score: number | null;
  opponent_score: number | null;
  status: string;
  created_at: string;
  expires_at: string;
};

type GameSession = {
  id: string;
  player1_id: string;
  player2_id: string | null;
  game_type: string;
  player1_score: number;
  player2_score: number;
  status: string;
  created_at: string;
};

type TournamentEntry = {
  user_id: string;
  best_score: number;
  attempts: number;
};

type Tournament = {
  id: string;
  week_start: string;
  game_type: string;
  status: string;
};

const GAME_LABELS: Record<string, string> = { catch: "💧 Hydration Catch", flight: "🦇 Noctis Flight" };
const GAME_ROUTES: Record<string, string> = { catch: "/noctis/catch", flight: "/noctis/flight" };

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff).toISOString().slice(0, 10);
}

const GameHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const gender = getMascotGender();
  const mascotImg = gender === "girl" ? mascotBatFemale : mascotBat;

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tournamentEntries, setTournamentEntries] = useState<TournamentEntry[]>([]);
  const [friends, setFriends] = useState<{ id: string; name: string }[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<"catch" | "flight">("catch");

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch challenges, sessions, friends, and tournament in parallel
    const [challengeRes, sessionRes, friendRes] = await Promise.all([
      supabase.from("game_challenges").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("game_sessions").select("*").in("status", ["waiting", "active"]).order("created_at", { ascending: false }),
      supabase.from("friend_connections").select("friend_user_id, user_id").or(`user_id.eq.${user.id},friend_user_id.eq.${user.id}`),
    ]);

    if (challengeRes.data) setChallenges(challengeRes.data as Challenge[]);
    if (sessionRes.data) setSessions(sessionRes.data as GameSession[]);

    // Get friend IDs and their profiles
    const friendIds = (friendRes.data || []).map(r => r.user_id === user.id ? r.friend_user_id : r.user_id);
    if (friendIds.length > 0) {
      const { data: lps } = await supabase.from("leaderboard_profiles").select("user_id, display_name").in("user_id", friendIds);
      if (lps) {
        setFriends(lps.map(l => ({ id: l.user_id, name: l.display_name })));
        const map: Record<string, string> = {};
        lps.forEach(l => { map[l.user_id] = l.display_name; });
        setProfiles(prev => ({ ...prev, ...map }));
      }
    }

    // Get or create weekly tournament
    const weekStart = getWeekStart();
    let { data: tData } = await supabase
      .from("game_tournaments")
      .select("*")
      .eq("week_start", weekStart)
      .eq("game_type", selectedGame)
      .maybeSingle();

    if (!tData) {
      const { data: newT } = await supabase
        .from("game_tournaments")
        .insert({ week_start: weekStart, game_type: selectedGame })
        .select()
        .single();
      tData = newT;
    }

    if (tData) {
      setTournament(tData as Tournament);
      const { data: entries } = await supabase
        .from("tournament_entries")
        .select("user_id, best_score, attempts")
        .eq("tournament_id", tData.id)
        .order("best_score", { ascending: false });
      if (entries) setTournamentEntries(entries);

      // Get profile names for tournament
      const entryIds = (entries || []).map(e => e.user_id).filter(id => !profiles[id]);
      if (entryIds.length > 0) {
        const { data: lps } = await supabase.from("leaderboard_profiles").select("user_id, display_name").in("user_id", entryIds);
        if (lps) {
          const map: Record<string, string> = {};
          lps.forEach(l => { map[l.user_id] = l.display_name; });
          setProfiles(prev => ({ ...prev, ...map }));
        }
      }
    }

    setLoading(false);
  }, [user, selectedGame]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time subscription for live sessions
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("game-sessions-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "game_sessions" }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchData]);

  // ── Actions ──

  const sendChallenge = async (friendId: string) => {
    if (!user) return;
    const { error } = await supabase.from("game_challenges").insert({
      challenger_id: user.id,
      opponent_id: friendId,
      game_type: selectedGame,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Challenge Sent! ⚔️", description: "Your friend will see it when they open Games." });
    fetchData();
  };

  const acceptChallenge = (challenge: Challenge) => {
    // Navigate to game with challenge context
    navigate(`${GAME_ROUTES[challenge.game_type]}?challenge=${challenge.id}`);
  };

  const createLobby = async () => {
    if (!user) return;
    const { error } = await supabase.from("game_sessions").insert({
      player1_id: user.id,
      game_type: selectedGame,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Lobby Created! 🎮", description: "Waiting for an opponent to join..." });
    fetchData();
  };

  const joinLobby = async (session: GameSession) => {
    if (!user) return;
    const { error } = await supabase
      .from("game_sessions")
      .update({ player2_id: user.id, status: "active" })
      .eq("id", session.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    navigate(`${GAME_ROUTES[session.game_type]}?session=${session.id}&role=p2`);
  };

  const startLiveMatch = (session: GameSession) => {
    navigate(`${GAME_ROUTES[session.game_type]}?session=${session.id}&role=p1`);
  };

  const getName = (id: string) => profiles[id] || "Player";

  if (!user) {
    return (
      <div className="min-h-screen relative">
        <Starfield />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-4 px-4">
          <img src={mascotImg} alt="Noctis" width={80} height={80} className="drop-shadow-lg" />
          <p className="font-display text-sm text-foreground text-center">Sign in to play multiplayer games!</p>
          <button onClick={() => navigate("/profile")} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <Starfield />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 px-4 py-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/noctis")} className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="font-display text-sm font-semibold text-foreground">⚔️ Multiplayer Games</span>
          <button onClick={fetchData} className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Game Selector */}
        <div className="flex gap-2 mb-4">
          {(["catch", "flight"] as const).map(g => (
            <button
              key={g}
              onClick={() => setSelectedGame(g)}
              className={`flex-1 py-2 rounded-xl font-display text-xs font-semibold transition-all active:scale-95 ${
                selectedGame === g ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
              }`}
            >
              {GAME_LABELS[g]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="challenges" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-card/80 border border-border">
              <TabsTrigger value="challenges" className="text-xs font-display gap-1">
                <Swords className="h-3 w-3" /> Challenges
              </TabsTrigger>
              <TabsTrigger value="live" className="text-xs font-display gap-1">
                <Users className="h-3 w-3" /> Live
              </TabsTrigger>
              <TabsTrigger value="tournament" className="text-xs font-display gap-1">
                <Trophy className="h-3 w-3" /> Weekly
              </TabsTrigger>
            </TabsList>

            {/* ── Challenges Tab ── */}
            <TabsContent value="challenges" className="mt-3 space-y-3">
              {/* Send challenge */}
              {friends.length > 0 ? (
                <div className="rounded-xl bg-card/80 dreamy-blur border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Challenge a friend:</p>
                  <div className="space-y-1.5">
                    {friends.map(f => (
                      <button
                        key={f.id}
                        onClick={() => sendChallenge(f.id)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-background/50 border border-border hover:border-primary/30 transition-colors active:scale-[0.98]"
                      >
                        <span className="text-xs font-semibold text-foreground">{f.name}</span>
                        <div className="flex items-center gap-1 text-primary">
                          <Swords className="h-3 w-3" />
                          <span className="text-[10px] font-bold">Challenge</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-card/80 dreamy-blur border border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">Add friends on the Leaderboard to challenge them!</p>
                  <button onClick={() => navigate("/leaderboard")} className="mt-2 text-xs text-primary font-semibold">
                    Go to Leaderboard →
                  </button>
                </div>
              )}

              {/* Pending challenges */}
              {challenges.filter(c => c.game_type === selectedGame).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Your challenges:</p>
                  {challenges.filter(c => c.game_type === selectedGame).map(c => {
                    const iChallenger = c.challenger_id === user.id;
                    const opponentName = getName(iChallenger ? c.opponent_id : c.challenger_id);
                    return (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl bg-card/80 dreamy-blur border border-border p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              {iChallenger ? `You → ${opponentName}` : `${opponentName} → You`}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {c.status === "pending" && !iChallenger ? "Waiting for you!" :
                               c.status === "pending" ? "Waiting for response..." :
                               c.status === "completed" ? `${c.challenger_score ?? "?"} vs ${c.opponent_score ?? "?"}` :
                               c.status}
                            </p>
                          </div>
                          {c.status === "pending" && !iChallenger && (
                            <button
                              onClick={() => acceptChallenge(c)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold active:scale-95"
                            >
                              <Play className="h-3 w-3" /> Play
                            </button>
                          )}
                          {c.status === "completed" && (
                            <div className="text-sm font-bold">
                              {c.challenger_id === user.id
                                ? (c.challenger_score ?? 0) >= (c.opponent_score ?? 0) ? "🏆" : "😢"
                                : (c.opponent_score ?? 0) >= (c.challenger_score ?? 0) ? "🏆" : "😢"
                              }
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {challenges.filter(c => c.game_type === selectedGame).length === 0 && friends.length > 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">No challenges yet. Send one above!</p>
              )}
            </TabsContent>

            {/* ── Live Tab ── */}
            <TabsContent value="live" className="mt-3 space-y-3">
              <button
                onClick={createLobby}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm active:scale-95 transition-transform"
              >
                <Plus className="h-4 w-4" /> Create Match Lobby
              </button>

              {sessions.filter(s => s.game_type === selectedGame).length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Open lobbies:</p>
                  {sessions.filter(s => s.game_type === selectedGame).map(s => {
                    const isCreator = s.player1_id === user.id;
                    const isActive = s.status === "active";
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl bg-card/80 dreamy-blur border border-border p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              {isCreator ? "Your Lobby" : `${getName(s.player1_id)}'s Lobby`}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {isActive ? `🟢 Live! ${s.player1_score} vs ${s.player2_score}` :
                               s.status === "waiting" ? "⏳ Waiting for opponent..." : s.status}
                            </p>
                          </div>
                          {s.status === "waiting" && !isCreator && (
                            <button
                              onClick={() => joinLobby(s)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold active:scale-95"
                            >
                              <Play className="h-3 w-3" /> Join
                            </button>
                          )}
                          {isActive && (isCreator || s.player2_id === user.id) && (
                            <button
                              onClick={() => startLiveMatch(s)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold active:scale-95"
                            >
                              <Play className="h-3 w-3" /> Play
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-xs text-muted-foreground py-4">
                  No open lobbies. Create one and wait for someone to join!
                </p>
              )}
            </TabsContent>

            {/* ── Tournament Tab ── */}
            <TabsContent value="tournament" className="mt-3 space-y-3">
              {tournament && (
                <div className="rounded-xl bg-card/80 dreamy-blur border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-display text-sm font-semibold text-foreground">🏆 Weekly Tournament</p>
                      <p className="text-[10px] text-muted-foreground">
                        {GAME_LABELS[tournament.game_type]} • Week of {tournament.week_start}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(GAME_ROUTES[selectedGame] + `?tournament=${tournament.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold active:scale-95"
                    >
                      <Play className="h-3 w-3" /> Play
                    </button>
                  </div>

                  {/* Leaderboard */}
                  {tournamentEntries.length > 0 ? (
                    <div className="space-y-1.5">
                      {tournamentEntries.map((e, i) => {
                        const isMe = e.user_id === user.id;
                        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
                        return (
                          <div
                            key={e.user_id}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                              isMe ? "bg-primary/10 border border-primary/20" : "bg-background/50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{medal}</span>
                              <span className={`text-xs font-semibold ${isMe ? "text-primary" : "text-foreground"}`}>
                                {profiles[e.user_id] || (isMe ? "You" : "Player")}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-foreground">{e.best_score}</p>
                              <p className="text-[9px] text-muted-foreground">{e.attempts} attempt{e.attempts !== 1 ? "s" : ""}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-3">
                      No entries yet. Be the first to play!
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <p className="text-center text-[10px] text-muted-foreground mt-6">
          Challenge friends, compete live, or top the weekly chart! 🎮
        </p>
      </motion.div>
    </div>
  );
};

export default GameHub;
