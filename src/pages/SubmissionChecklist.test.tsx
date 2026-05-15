import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import SubmissionChecklist from "./SubmissionChecklist";

const renderPage = () => render(<TooltipProvider><SubmissionChecklist /></TooltipProvider>);

const sampleItems = [
  { id: "a", label: "Alpha", category: "Cat1", status: "complete" },
  { id: "b", label: "Beta", category: "Cat2", status: "action_required" },
];

const getSearchInput = () =>
  document.querySelector('input[type="search"]') as HTMLInputElement;

const getFileInput = () =>
  document.querySelector('input[type="file"]') as HTMLInputElement;

const uploadSampleChecklist = async () => {
  const json = JSON.stringify(sampleItems);
  const fileLike = {
    name: "checklist.json",
    type: "application/json",
    text: () => Promise.resolve(json),
  } as unknown as File;
  const input = getFileInput();
  await act(async () => {
    fireEvent.change(input, { target: { files: [fileLike] } });
  });
  await waitFor(() => {
    expect(getSearchInput()).not.toBeNull();
  });
};

const performResetWithConfirm = async () => {
  fireEvent.click(
    screen.getByRole("button", { name: /Reset search & filters/i })
  );
  const confirmBtn = await screen.findByRole("button", { name: /^Reset$/ });
  await act(async () => {
    fireEvent.click(confirmBtn);
  });
};

// The invalidation effect debounces by 450ms — advance just past it.
const flushInvalidationDebounce = async () => {
  await act(async () => {
    vi.advanceTimersByTime(500);
  });
};

describe("SubmissionChecklist — undo invalidation", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it("cancels undo after the user settles on an edited search value", async () => {
    renderPage();
    await uploadSampleChecklist();

    fireEvent.change(getSearchInput(), { target: { value: "alpha" } });
    await performResetWithConfirm();
    expect(getSearchInput().value).toBe("");

    fireEvent.change(getSearchInput(), { target: { value: "edited" } });
    await flushInvalidationDebounce();

    await act(async () => {
      fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    });
    expect(getSearchInput().value).toBe("edited");
  });

  it("Ctrl/⌘+Z is a no-op after invalidation and never restores stale settings", async () => {
    renderPage();
    await uploadSampleChecklist();

    // Establish a non-default pre-reset snapshot.
    fireEvent.change(getSearchInput(), { target: { value: "alpha" } });
    await performResetWithConfirm();
    expect(getSearchInput().value).toBe("");
    expect(
      localStorage.getItem("circadia-submission-checklist-undo-stack")
    ).not.toBeNull();

    // User settles on a new, divergent value → invalidates.
    fireEvent.change(getSearchInput(), { target: { value: "edited" } });
    await flushInvalidationDebounce();
    expect(
      localStorage.getItem("circadia-submission-checklist-undo-stack")
    ).toBeNull();

    // Press Ctrl+Z multiple times, then ⌘+Z, then with shift — none should
    // restore the stale "alpha" search or otherwise mutate the controls.
    for (const opts of [
      { ctrlKey: true },
      { ctrlKey: true },
      { metaKey: true },
      { ctrlKey: true, shiftKey: true },
    ]) {
      await act(async () => {
        fireEvent.keyDown(window, { key: "z", ...opts });
      });
    }

    // Search remains the user's edited value, NOT the stale snapshot.
    expect(getSearchInput().value).toBe("edited");
    expect(getSearchInput().value).not.toBe("alpha");
    // Persisted snapshot stays cleared — no resurrection from storage.
    expect(
      localStorage.getItem("circadia-submission-checklist-undo-stack")
    ).toBeNull();
  });

  it("undo restores the previous search when nothing is edited (positive control)", async () => {
    renderPage();
    await uploadSampleChecklist();

    fireEvent.change(getSearchInput(), { target: { value: "alpha" } });
    await performResetWithConfirm();
    expect(getSearchInput().value).toBe("");

    await act(async () => {
      fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    });
    expect(getSearchInput().value).toBe("alpha");
  });

  it("settled divergence clears the persisted undo snapshot", async () => {
    renderPage();
    await uploadSampleChecklist();

    fireEvent.change(getSearchInput(), { target: { value: "alpha" } });
    await performResetWithConfirm();
    expect(
      localStorage.getItem("circadia-submission-checklist-undo-stack")
    ).not.toBeNull();

    fireEvent.change(getSearchInput(), { target: { value: "x" } });
    await flushInvalidationDebounce();

    expect(
      localStorage.getItem("circadia-submission-checklist-undo-stack")
    ).toBeNull();
  });

  it("keeps undo valid when the user types and clears the search back to default", async () => {
    renderPage();
    await uploadSampleChecklist();

    fireEvent.change(getSearchInput(), { target: { value: "alpha" } });
    await performResetWithConfirm();

    // Type then immediately revert before the debounce window elapses.
    fireEvent.change(getSearchInput(), { target: { value: "transient" } });
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.change(getSearchInput(), { target: { value: "" } });
    await flushInvalidationDebounce();

    // Persisted undo should still be intact.
    expect(
      localStorage.getItem("circadia-submission-checklist-undo-stack")
    ).not.toBeNull();

    await act(async () => {
      fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    });
    expect(getSearchInput().value).toBe("alpha");
  });

  it("does not invalidate while the current state matches the snapshot's prev value", async () => {
    renderPage();
    await uploadSampleChecklist();

    fireEvent.change(getSearchInput(), { target: { value: "alpha" } });
    await performResetWithConfirm();

    // Manually re-type the pre-reset value — matches the top undo entry's prev.
    fireEvent.change(getSearchInput(), { target: { value: "alpha" } });
    await flushInvalidationDebounce();

    // History preserved: undo would be a no-op now, but still available.
    expect(
      localStorage.getItem("circadia-submission-checklist-undo-stack")
    ).not.toBeNull();
  });
});
