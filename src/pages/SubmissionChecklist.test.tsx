import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import SubmissionChecklist from "./SubmissionChecklist";

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
  // jsdom's File doesn't always implement .text(); provide a stub object that satisfies the component
  const fileLike = {
    name: "checklist.json",
    type: "application/json",
    text: () => Promise.resolve(json),
  } as unknown as File;
  const input = getFileInput();
  await act(async () => {
    fireEvent.change(input, { target: { files: [fileLike] } });
  });
  // Wait for the search input to appear (items loaded)
  await waitFor(() => {
    expect(getSearchInput()).not.toBeNull();
  });
};

const performResetWithConfirm = async () => {
  // The "Reset search & filters" button opens the AlertDialog when
  // current state differs from defaults
  fireEvent.click(
    screen.getByRole("button", { name: /Reset search & filters/i })
  );
  // The confirm action inside the dialog has the exact label "Reset"
  const confirmBtn = await screen.findByRole("button", { name: /^Reset$/ });
  await act(async () => {
    fireEvent.click(confirmBtn);
  });
};

describe("SubmissionChecklist — undo invalidation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("cancels undo after the user edits the search input", async () => {
    render(<SubmissionChecklist />);
    await uploadSampleChecklist();

    // Make state non-default so reset opens the confirm dialog
    const searchBox = getSearchInput();
    fireEvent.change(searchBox, { target: { value: "alpha" } });
    expect(searchBox.value).toBe("alpha");

    await performResetWithConfirm();

    // Search is cleared after reset
    expect(getSearchInput().value).toBe("");

    // User edits search again — this must invalidate the pending undo
    fireEvent.change(getSearchInput(), { target: { value: "edited" } });
    expect(getSearchInput().value).toBe("edited");

    // Press Ctrl+Z — should be a no-op because undo was cancelled
    await act(async () => {
      fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    });

    expect(getSearchInput().value).toBe("edited");
  });

  it("undo restores the previous search when nothing is edited (positive control)", async () => {
    render(<SubmissionChecklist />);
    await uploadSampleChecklist();

    fireEvent.change(getSearchInput(), { target: { value: "alpha" } });
    await performResetWithConfirm();
    expect(getSearchInput().value).toBe("");

    // Press Ctrl+Z — should restore "alpha"
    await act(async () => {
      fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    });

    expect(getSearchInput().value).toBe("alpha");
  });

  it("manually setting search/filter/sort state diverging from defaults clears persisted undo", async () => {
    render(<SubmissionChecklist />);
    await uploadSampleChecklist();

    fireEvent.change(getSearchInput(), { target: { value: "alpha" } });
    await performResetWithConfirm();

    // The undo stack is persisted to localStorage at this point
    expect(
      localStorage.getItem("circadia-submission-checklist-undo-stack")
    ).not.toBeNull();

    // User edits search after reset → invalidates and clears persisted undo
    fireEvent.change(getSearchInput(), { target: { value: "x" } });

    // Effect runs synchronously after state change in React 18 testing
    expect(
      localStorage.getItem("circadia-submission-checklist-undo-stack")
    ).toBeNull();
  });
});
