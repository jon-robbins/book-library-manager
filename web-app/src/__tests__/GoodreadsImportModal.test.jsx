import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import GoodreadsImportModal from "../components/GoodreadsImportModal";
import { getFunctions, httpsCallable } from "firebase/functions";

vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(),
}));

describe("GoodreadsImportModal", () => {
  const mockOnClose = vi.fn();
  let mockImportCallable;

  beforeEach(() => {
    vi.clearAllMocks();
    mockImportCallable = vi.fn();
    globalThis.React = React;
    getFunctions.mockReturnValue({});
    httpsCallable.mockReturnValue(mockImportCallable);
  });

  it("renders nothing when closed", () => {
    const { container } = render(<GoodreadsImportModal isOpen={false} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it("enables import after csv input and submits", async () => {
    mockImportCallable.mockResolvedValueOnce({
      data: {
        totalProcessed: 1,
        successCount: 1,
        skippedCount: 0,
        errorCount: 0,
        errors: [],
        results: [{ title: "Test Book", author: "Test Author", status: "success" }],
      },
    });

    render(<GoodreadsImportModal isOpen={true} onClose={mockOnClose} />);

    const importBtn = screen.getByRole("button", { name: "Import Books" });
    expect(importBtn.disabled).toBe(true);

    const textarea = screen.getByPlaceholderText("Paste CSV data here...");
    fireEvent.change(textarea, { target: { value: "Title,Author\nTest Book,Test Author" } });
    expect(importBtn.disabled).toBe(false);

    fireEvent.click(importBtn);
    expect(mockImportCallable).toHaveBeenCalledWith({ csv: "Title,Author\nTest Book,Test Author" });

    await waitFor(() => {
      expect(screen.getByText("Import Complete")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows error message when callable fails", async () => {
    mockImportCallable.mockRejectedValueOnce(new Error("Network offline"));

    render(<GoodreadsImportModal isOpen={true} onClose={mockOnClose} />);
    const textarea = screen.getByPlaceholderText("Paste CSV data here...");
    fireEvent.change(textarea, { target: { value: "bad data" } });
    fireEvent.click(screen.getByRole("button", { name: "Import Books" }));

    await waitFor(() => {
      expect(screen.getByText("Network offline")).toBeTruthy();
    });
  });
});
