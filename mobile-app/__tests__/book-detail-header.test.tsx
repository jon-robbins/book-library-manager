/**
 * TLA-17: Book detail dynamic header title (AC8).
 */
import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";
import BookDetailScreen from "../app/book/[id]";

const mockSetOptions = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "test-id" }),
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ setOptions: mockSetOptions }),
}));

jest.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ user: { uid: "test-user" } }),
}));

jest.mock("@/lib/books", () => ({
  fetchBookById: jest.fn(),
  removeBook: jest.fn(),
}));

jest.mock("@/components/BookCoverImage", () => {
  const React = require("react");
  const { View } = require("react-native");
  return () => React.createElement(View, { testID: "book-cover" });
});

import { fetchBookById } from "@/lib/books";

describe("BookDetailScreen header (TLA-17 AC8)", () => {
  beforeEach(() => {
    mockSetOptions.mockClear();
    (fetchBookById as jest.Mock).mockReset();
  });

  it("sets header title to book title when book loads", async () => {
    (fetchBookById as jest.Mock).mockResolvedValue({
      id: "test-id",
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      isbn: "123",
    });

    render(<BookDetailScreen />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await waitFor(() => {
      expect(mockSetOptions).toHaveBeenCalledWith({ title: "The Great Gatsby" });
    });
  });

  it("keeps header title as Book when book is null (loading/error)", async () => {
    (fetchBookById as jest.Mock).mockResolvedValue(null);

    render(<BookDetailScreen />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await waitFor(() => {
      expect(mockSetOptions).toHaveBeenCalledWith({ title: "Book" });
    });
  });
});
