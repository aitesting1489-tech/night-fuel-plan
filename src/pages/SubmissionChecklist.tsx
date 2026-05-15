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

  // Pending undo/redo for the most recent reset; cleared after the snackbar
  // window, by toast dismissal, or when the user changes any control.
  type Pending = {
    prev: { search: string; filter: string; sort: string };
    expiresAt: number;
    toastId: string | number;
  };
  const undoRef = useRef<Pending | null>(null);
  const redoRef = useRef<Pending | null>(null);
  const UNDO_WINDOW_MS = 8000;

  const clearPending = (which: "undo" | "redo", dismissToast = false) => {
    const ref = which === "undo" ? undoRef : redoRef;
    const pending = ref.current;
    if (!pending) return;
    if (dismissToast) toast.dismiss(pending.toastId);
    ref.current = null;
    if (which === "undo") {
      try { localStorage.removeItem(UNDO_KEY); } catch { /* ignore */ }
    }
  };

  const applyUndo = () => {
    const pending = undoRef.current;
    if (!pending || Date.now() > pending.expiresAt) return false;
    const restored = pending.prev;
    undoRef.current = null; // clear before state changes to avoid invalidation
    try { localStorage.removeItem(UNDO_KEY); } catch { /* ignore */ }
    setSearch(restored.search);
    setFilter(restored.filter);
    setSort(restored.sort);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(restored)); } catch { /* ignore */ }
    toast.dismiss(pending.toastId);
    // Now offer Redo for the same window length
    const toastId = toast.success("Restored — Ctrl/⌘+Shift+Z to redo reset", {
      action: { label: "Redo", onClick: applyRedo },
      duration: UNDO_WINDOW_MS,
      onAutoClose: () => { redoRef.current = null; },
      onDismiss: () => { redoRef.current = null; },
    });
    redoRef.current = { prev: restored, expiresAt: Date.now() + UNDO_WINDOW_MS, toastId };
    return true;
  };

  const applyRedo = () => {
    const pending = redoRef.current;
    if (!pending || Date.now() > pending.expiresAt) return false;
    const previousState = pending.prev; // what we'd undo back to after re-applying reset
    redoRef.current = null;
    setSearch("");
    setFilter("all");
    setSort("original");
    try { localStorage.removeItem(PREFS_KEY); } catch { /* ignore */ }
    toast.dismiss(pending.toastId);
    const toastId = toast.success("Reset re-applied (Ctrl/⌘+Z to undo)", {
      action: { label: "Undo", onClick: applyUndo },
      duration: UNDO_WINDOW_MS,
      onAutoClose: () => { undoRef.current = null; try { localStorage.removeItem(UNDO_KEY); } catch { /* ignore */ } },
      onDismiss: () => { undoRef.current = null; try { localStorage.removeItem(UNDO_KEY); } catch { /* ignore */ } },
    });
    undoRef.current = { prev: previousState, expiresAt: Date.now() + UNDO_WINDOW_MS, toastId };
    try {
      localStorage.setItem(UNDO_KEY, JSON.stringify({ prev: previousState, expiresAt: undoRef.current.expiresAt }));
    } catch { /* ignore */ }
    return true;
  };

  const performReset = () => {
    const prev = { search, filter, sort };
    clearPending("redo", true); // a fresh reset supersedes any pending redo
    setSearch("");
    setFilter("all");
    setSort("original");
    try { localStorage.removeItem(PREFS_KEY); } catch { /* ignore */ }
    const toastId = toast.success("Search & filters reset (Ctrl/⌘+Z to undo)", {
      action: { label: "Undo", onClick: applyUndo },
      duration: UNDO_WINDOW_MS,
      onAutoClose: () => { undoRef.current = null; try { localStorage.removeItem(UNDO_KEY); } catch { /* ignore */ } },
      onDismiss: () => { undoRef.current = null; try { localStorage.removeItem(UNDO_KEY); } catch { /* ignore */ } },
    });
    undoRef.current = { prev, expiresAt: Date.now() + UNDO_WINDOW_MS, toastId };
    try {
      localStorage.setItem(UNDO_KEY, JSON.stringify({ prev, expiresAt: undoRef.current.expiresAt }));
    } catch { /* ignore */ }
  };

  // Invalidate pending undo/redo as soon as the user changes a control manually
  useEffect(() => {
    const isPostReset = search === "" && filter === "all" && sort === "original";
    if (undoRef.current && !isPostReset) clearPending("undo", true);
    if (redoRef.current) {
      const p = redoRef.current.prev;
      const matchesRestored = search === p.search && filter === p.filter && sort === p.sort;
      if (!matchesRestored) clearPending("redo", true);
    }
  }, [search, filter, sort]);

  // Keyboard shortcuts: Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z = redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      // Don't hijack while the user is editing a text field
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.shiftKey) {
        if (redoRef.current && Date.now() <= redoRef.current.expiresAt) {
          e.preventDefault();
          applyRedo();
        }
      } else {
        if (undoRef.current && Date.now() <= undoRef.current.expiresAt) {
          e.preventDefault();
          applyUndo();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Rehydrate a still-valid undo snapshot after page refresh
  useEffect(() => {
    const persisted = loadPersistedUndo();
    if (!persisted) return;
    const remaining = persisted.expiresAt - Date.now();
    if (remaining <= 0) return;
    const toastId = toast.success("Search & filters reset (Ctrl/⌘+Z to undo)", {
      action: { label: "Undo", onClick: applyUndo },
      duration: remaining,
      onAutoClose: () => { undoRef.current = null; try { localStorage.removeItem(UNDO_KEY); } catch { /* ignore */ } },
      onDismiss: () => { undoRef.current = null; try { localStorage.removeItem(UNDO_KEY); } catch { /* ignore */ } },
    });
    undoRef.current = { prev: persisted.prev, expiresAt: persisted.expiresAt, toastId };
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
