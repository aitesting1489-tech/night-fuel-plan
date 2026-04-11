import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Droplets, TrendingUp, Calendar, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useWaterSettings } from "@/hooks/useWaterSettings";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import Starfield from "@/components/Starfield";

interface HydrationLog {
  id: string;
  amount_ml: number;
  logged_at: string;
}

interface DayData {
  label: string;
  date: string;
  total: number;
  count: number;
}

const HydrationHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { effectiveGoal } = useWaterSettings();
  const [logs, setLogs] = useState<HydrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"7d" | "14d" | "30d">("7d");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    loadLogs();
  }, [user, range]);

  const loadLogs = async () => {
    if (!user) return;
    setLoading(true);
    const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data } = await supabase
      .from("hydration_logs")
      .select("id, amount_ml, logged_at")
      .eq("user_id", user.id)
      .gte("logged_at", since.toISOString())
      .order("logged_at", { ascending: true });

    setLogs((data as HydrationLog[]) || []);
    setLoading(false);
  };

  const chartData = useMemo((): DayData[] => {
    const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;
    const result: DayData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLogs = logs.filter((l) => l.logged_at.startsWith(dateStr));
      const total = dayLogs.reduce((sum, l) => sum + l.amount_ml, 0);

      result.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: dateStr,
        total,
        count: dayLogs.length,
      });
    }
    return result;
  }, [logs, range]);

  const todayTotal = chartData[chartData.length - 1]?.total || 0;
  const weekAvg = chartData.length > 0
    ? Math.round(chartData.reduce((s, d) => s + d.total, 0) / chartData.length)
    : 0;
  const daysMetGoal = chartData.filter((d) => d.total >= effectiveGoal).length;
  const streak = (() => {
    let s = 0;
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].total >= effectiveGoal) s++;
      else break;
    }
    return s;
  })();

  return (
    <>
      <Starfield />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen px-4 py-6 max-w-lg mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-hydration" />
            <h1 className="font-display text-xl font-bold text-foreground neon-text">
              Hydration History
            </h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-hydration" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Today</span>
            </div>
            <p className="font-display text-lg font-bold text-foreground">
              {todayTotal}<span className="text-xs text-muted-foreground font-normal ml-0.5">ml</span>
            </p>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-hydration transition-all"
                style={{ width: `${Math.min((todayTotal / effectiveGoal) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Daily Avg</span>
            </div>
            <p className="font-display text-lg font-bold text-foreground">
              {weekAvg}<span className="text-xs text-muted-foreground font-normal ml-0.5">ml</span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {weekAvg >= effectiveGoal ? "✨ Above goal!" : `${effectiveGoal - weekAvg}ml below goal`}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Goal Met</span>
            </div>
            <p className="font-display text-lg font-bold text-foreground">
              {daysMetGoal}<span className="text-xs text-muted-foreground font-normal ml-0.5">/{chartData.length} days</span>
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</span>
            </div>
            <p className="font-display text-lg font-bold text-foreground">
              {streak}<span className="text-xs text-muted-foreground font-normal ml-0.5">days</span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {streak > 0 ? "🔥 Keep it up!" : "Start today!"}
            </p>
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex gap-2 mb-4">
          {(["7d", "14d", "30d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 rounded-xl py-2 text-xs font-display font-medium transition-all active:scale-95 ${
                range === r
                  ? "bg-primary/10 border border-primary/50 text-primary glow-primary"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              {r === "7d" ? "7 Days" : r === "14d" ? "14 Days" : "30 Days"}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-4 mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Daily Intake
          </p>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={range === "30d" ? 4 : 0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v / 1000}L`}
                />
                <ReferenceLine
                  y={effectiveGoal}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.total >= effectiveGoal
                          ? "hsl(var(--hydration))"
                          : entry.total > 0
                            ? "hsl(var(--hydration) / 0.4)"
                            : "hsl(var(--muted))"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Dashed line = your daily goal ({(effectiveGoal / 1000).toFixed(1)}L)
          </p>
        </div>

        {/* Today's Log */}
        {!loading && (
          <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Today's Entries
            </p>
            {logs.filter((l) => l.logged_at.startsWith(new Date().toISOString().split("T")[0])).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No entries yet today. Start a shift to log hydration!
              </p>
            ) : (
              <div className="space-y-2">
                {logs
                  .filter((l) => l.logged_at.startsWith(new Date().toISOString().split("T")[0]))
                  .map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-3.5 w-3.5 text-hydration" />
                        <span className="text-xs text-foreground font-display font-medium">
                          {log.amount_ml}ml
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.logged_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        <p className="text-center text-[10px] text-muted-foreground/50 mt-6 mb-4 font-light">
          Hydration data is logged when you check off drip cards during shifts
        </p>
      </motion.div>
    </>
  );
};

export default HydrationHistory;
