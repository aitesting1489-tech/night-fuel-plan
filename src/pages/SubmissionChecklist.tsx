import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";

type Status = "complete" | "action_required" | "in_progress" | "skipped";

interface ChecklistItem {
  id: string;
  label: string;
  category?: string;
  source?: string;
  status: Status;
  owner?: string;
  doc_anchor?: string;
  steps?: string[];
  notes?: string;
}

const STATUSES: Status[] = ["complete", "in_progress", "action_required", "skipped"];

const statusVariant = (s: Status) =>
  s === "complete" ? "default" : s === "in_progress" ? "secondary" : s === "skipped" ? "outline" : "destructive";

const PREFS_KEY = "circadia-submission-checklist-prefs";
const UNDO_KEY = "circadia-submission-checklist-undo-stack";
const UNDO_WINDOW_MS = 8000;
const MAX_HISTORY = 10;

type Snapshot = { search: string; filter: string; sort: string };
type Entry = { prev: Snapshot; expiresAt: number };

const DEFAULTS: Snapshot = { search: "", filter: "all", sort: "original" };

const loadPrefs = () => {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(PREFS_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const loadPersistedUndoStack = (): Entry[] => {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(UNDO_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter(
      (e: any) => e && e.prev && typeof e.expiresAt === "number" && e.expiresAt > now
    );
  } catch {
    return [];
  }
};

const persistUndoStack = (stack: Entry[]) => {
  try {
    if (stack.length === 0) localStorage.removeItem(UNDO_KEY);
    else localStorage.setItem(UNDO_KEY, JSON.stringify(stack));
  } catch {
    /* ignore */
  }
};

export default function SubmissionChecklist() {
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [fileName, setFileName] = useState<string>("circadia-submission-checklist.json");
  const initialPrefs = loadPrefs();
  const [filter, setFilter] = useState<string>(initialPrefs.filter ?? "all");
  const [search, setSearch] = useState<string>(initialPrefs.search ?? "");
  const [sort, setSort] = useState<string>(initialPrefs.sort ?? "original");
  const [resetOpen, setResetOpen] = useState(false);

  const isDefault = filter === "all" && search === "" && sort === "original";

  // Stack-based undo/redo. Each reset pushes onto undoStack with its own expiry;
  // entries older than the window are pruned. A single toast at a time reflects
  // the head of the active stack. Manual edits to controls clear all history.
  const undoStackRef = useRef<Entry[]>([]);
  const redoStackRef = useRef<Entry[]>([]);
  const toastIdRef = useRef<string | number | null>(null);
  // Tracks the state we expect after our own programmatic change so the
  // change-watcher effect can distinguish those from manual edits.
  const expectedRef = useRef<Snapshot | null>(null);
  // Mirror of current state, for use inside callbacks registered once on mount
  const stateRef = useRef<Snapshot>({ search, filter, sort });
  useEffect(() => {
    stateRef.current = { search, filter, sort };
  }, [search, filter, sort]);

  const pruneExpired = (stack: Entry[]) => {
    const now = Date.now();
    return stack.filter((e) => e.expiresAt > now);
  };

  const dismissActiveToast = () => {
    if (toastIdRef.current != null) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  };

  const handleHistoryCleared = () => {
    toastIdRef.current = null;
    undoStackRef.current = [];
    redoStackRef.current = [];
    persistUndoStack([]);
    expectedRef.current = null;
  };

  const showUndoToast = (count: number, durationMs: number) => {
    dismissActiveToast();
    const message =
      count > 1
        ? `Search & filters reset · ${count} undo steps available (Ctrl/⌘+Z)`
        : "Search & filters reset (Ctrl/⌘+Z to undo)";
    toastIdRef.current = toast.success(message, {
      action: { label: "Undo", onClick: () => applyUndo() },
      duration: Math.max(500, durationMs),
      onAutoClose: handleHistoryCleared,
      onDismiss: handleHistoryCleared,
    });
  };

  const showRedoToast = (count: number, durationMs: number) => {
    dismissActiveToast();
    const message =
      count > 1
        ? `Restored · ${count} redo steps available (Ctrl/⌘+Shift+Z)`
        : "Restored — Ctrl/⌘+Shift+Z to redo reset";
    toastIdRef.current = toast.success(message, {
      action: { label: "Redo", onClick: () => applyRedo() },
      duration: Math.max(500, durationMs),
      onAutoClose: handleHistoryCleared,
      onDismiss: handleHistoryCleared,
    });
  };

  const refreshActiveToast = () => {
    undoStackRef.current = pruneExpired(undoStackRef.current);
    redoStackRef.current = pruneExpired(redoStackRef.current);
    if (undoStackRef.current.length > 0) {
      const remaining = Math.max(...undoStackRef.current.map((e) => e.expiresAt - Date.now()));
      showUndoToast(undoStackRef.current.length, remaining);
    } else if (redoStackRef.current.length > 0) {
      const remaining = Math.max(...redoStackRef.current.map((e) => e.expiresAt - Date.now()));
      showRedoToast(redoStackRef.current.length, remaining);
    } else {
      dismissActiveToast();
      expectedRef.current = null;
    }
  };

  const applyUndo = (): boolean => {
    undoStackRef.current = pruneExpired(undoStackRef.current);
    if (undoStackRef.current.length === 0) return false;
    const entry = undoStackRef.current.pop()!;
    // Save current state on the redo stack
    redoStackRef.current.push({ prev: { ...stateRef.current }, expiresAt: Date.now() + UNDO_WINDOW_MS });
    if (redoStackRef.current.length > MAX_HISTORY) {
      redoStackRef.current.splice(0, redoStackRef.current.length - MAX_HISTORY);
    }
    expectedRef.current = entry.prev;
    setSearch(entry.prev.search);
    setFilter(entry.prev.filter);
    setSort(entry.prev.sort);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(entry.prev)); } catch { /* ignore */ }
    persistUndoStack(undoStackRef.current);
    refreshActiveToast();
    return true;
  };

  const applyRedo = (): boolean => {
    redoStackRef.current = pruneExpired(redoStackRef.current);
    if (redoStackRef.current.length === 0) return false;
    const entry = redoStackRef.current.pop()!;
    undoStackRef.current.push({ prev: { ...stateRef.current }, expiresAt: Date.now() + UNDO_WINDOW_MS });
    if (undoStackRef.current.length > MAX_HISTORY) {
      undoStackRef.current.splice(0, undoStackRef.current.length - MAX_HISTORY);
    }
    expectedRef.current = entry.prev;
    setSearch(entry.prev.search);
    setFilter(entry.prev.filter);
    setSort(entry.prev.sort);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(entry.prev)); } catch { /* ignore */ }
    persistUndoStack(undoStackRef.current);
    refreshActiveToast();
    return true;
  };

  const performReset = () => {
    undoStackRef.current = pruneExpired(undoStackRef.current);
    undoStackRef.current.push({ prev: { ...stateRef.current }, expiresAt: Date.now() + UNDO_WINDOW_MS });
    if (undoStackRef.current.length > MAX_HISTORY) {
      undoStackRef.current.splice(0, undoStackRef.current.length - MAX_HISTORY);
    }
    redoStackRef.current = []; // a fresh action invalidates redo history
    expectedRef.current = DEFAULTS;
    setSearch(DEFAULTS.search);
    setFilter(DEFAULTS.filter);
    setSort(DEFAULTS.sort);
    try { localStorage.removeItem(PREFS_KEY); } catch { /* ignore */ }
    persistUndoStack(undoStackRef.current);
    showUndoToast(undoStackRef.current.length, UNDO_WINDOW_MS);
  };

  // Manual edits invalidate all history
  useEffect(() => {
    const expected = expectedRef.current;
    if (!expected) return;
    if (search === expected.search && filter === expected.filter && sort === expected.sort) {
      // matches our own programmatic change — don't invalidate
      return;
    }
    handleHistoryCleared();
    dismissActiveToast();
  }, [search, filter, sort]);

  // Keyboard shortcuts: Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z = redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.shiftKey) {
        if (pruneExpired(redoStackRef.current).length > 0) {
          e.preventDefault();
          applyRedo();
        }
      } else {
        if (pruneExpired(undoStackRef.current).length > 0) {
          e.preventDefault();
          applyUndo();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Rehydrate a still-valid undo stack after page refresh
  useEffect(() => {
    const stack = loadPersistedUndoStack();
    if (stack.length === 0) return;
    undoStackRef.current = stack;
    expectedRef.current = DEFAULTS; // last persisted action was a reset
    const remaining = Math.max(...stack.map((e) => e.expiresAt - Date.now()));
    showUndoToast(stack.length, remaining);
  }, []);

  const handleResetClick = () => {
    if (isDefault) {
      performReset();
    } else {
      setResetOpen(true);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ filter, search, sort }));
    } catch {
      /* ignore quota / private mode errors */
    }
  }, [filter, search, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { complete: 0, in_progress: 0, action_required: 0, skipped: 0 };
    items?.forEach((i) => (c[i.status] = (c[i.status] ?? 0) + 1));
    return c;
  }, [items]);

  // Sort priority: surface incomplete work first
  const STATUS_ORDER: Record<Status, number> = {
    action_required: 0,
    in_progress: 1,
    skipped: 2,
    complete: 3,
  };

  const visible = useMemo(() => {
    let list = items ?? [];
    if (filter !== "all") list = list.filter((i) => i.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          (i.category ?? "").toLowerCase().includes(q) ||
          (i.source ?? "").toLowerCase().includes(q)
      );
    }
    if (sort === "status") {
      list = [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
    } else if (sort === "status_desc") {
      list = [...list].sort((a, b) => STATUS_ORDER[b.status] - STATUS_ORDER[a.status]);
    } else if (sort === "label") {
      list = [...list].sort((a, b) => a.label.localeCompare(b.label));
    } else if (sort === "category") {
      list = [...list].sort((a, b) => (a.category ?? "").localeCompare(b.category ?? ""));
    }
    return list;
  }, [items, filter, search, sort]);

  const onUpload = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const arr: ChecklistItem[] = Array.isArray(parsed) ? parsed : parsed.items ?? [];
      if (!arr.length) throw new Error("No items found");
      setItems(arr);
      setFileName(file.name);
      toast.success(`Loaded ${arr.length} items`);
    } catch (e: any) {
      toast.error(`Invalid JSON: ${e.message}`);
    }
  };

  const updateStatus = (id: string, status: Status) => {
    setItems((prev) => prev?.map((i) => (i.id === id ? { ...i, status } : i)) ?? null);
  };

  const updateNotes = (id: string, notes: string) => {
    setItems((prev) => prev?.map((i) => (i.id === id ? { ...i, notes } : i)) ?? null);
  };

  const download = () => {
    if (!items) return;
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded updated checklist");
  };

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Apple Review Submission Checklist</h1>
        <p className="text-muted-foreground">
          Upload <code>circadia-submission-checklist.json</code>, edit the status of each item, then download the
          updated file to track this submission.
        </p>
      </header>

      <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <Input
          type="file"
          accept="application/json,.json"
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          className="max-w-sm"
        />
        <div className="flex-1" />
        {items && (
          <>
            <Input
              type="search"
              placeholder="Search label, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-[220px]"
            />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({items.length})</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace("_", " ")} ({counts[s] ?? 0})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Original order</SelectItem>
                <SelectItem value="status">Status (incomplete first)</SelectItem>
                <SelectItem value="status_desc">Status (complete first)</SelectItem>
                <SelectItem value="label">Label (A–Z)</SelectItem>
                <SelectItem value="category">Category (A–Z)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleResetClick} disabled={isDefault}>
              Reset search & filters
            </Button>
            <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset search & filters?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This clears your current search text, status filter, and sort order, and removes the saved
                    preferences from this browser. Your checklist items and notes are not affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={performReset}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={download}>Download JSON</Button>
          </>
        )}
      </Card>

      {items && (
        <div className="flex flex-wrap gap-2 text-sm">
          {STATUSES.map((s) => (
            <Badge key={s} variant={statusVariant(s)}>
              {s.replace("_", " ")}: {counts[s] ?? 0}
            </Badge>
          ))}
        </div>
      )}

      {!items ? (
        <Card className="p-12 text-center text-muted-foreground">
          Upload a checklist JSON file to get started.
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <Card key={item.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{item.label}</h3>
                    {item.category && <Badge variant="outline">{item.category}</Badge>}
                  </div>
                  {item.source && <p className="text-sm text-muted-foreground">Source: {item.source}</p>}
                </div>
                <Select value={item.status} onValueChange={(v) => updateStatus(item.id, v as Status)}>
                  <SelectTrigger className="w-[170px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {item.steps && item.steps.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground">
                    {item.steps.length} step{item.steps.length === 1 ? "" : "s"}
                  </summary>
                  <ol className="list-decimal pl-5 mt-2 space-y-1">
                    {item.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </details>
              )}

              <Input
                placeholder="Notes for this submission…"
                value={item.notes ?? ""}
                onChange={(e) => updateNotes(item.id, e.target.value)}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
