import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import BookDetailScreen from "../app/book/[id]";
import { fetchBookById } from "@/lib/books";

jest.mock("@/lib/books");
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: "book-123" }),
}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ setOptions: jest.fn() }),
}));
jest.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ user: { uid: "test-user" } }),
}));
jest.mock("@/components/BookCoverImage", () => {
  return function BookCoverImage({ placeholderText }: any) {
    return <>{placeholderText}</>;
  };
});

const mockFetchBookById = fetchBookById as jest.MockedFunction<typeof fetchBookById>;

const mockBook = {
  id: "book-123",
  userId: "user1",
  title: "Test Book",
  author: "Test Author",
  isbn: "123456",
  haveRead: false,
  own: false,
  wantToRead: false,
  wantToReadPosition: 0,
};

describe("BookDetailScreen states", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchBookById.mockResolvedValue(mockBook as any);
  });

  it("shows loading indicator while fetch is pending", () => {
    mockFetchBookById.mockImplementation(() => new Promise(() => {}));
    render(<BookDetailScreen />);
    expect(screen.getByTestId("loading-indicator")).toBeTruthy();
  });

  it("shows error state when fetch fails", async () => {
    mockFetchBookById.mockRejectedValue(new Error("Failed to load"));
    render(<BookDetailScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("error-state")).toBeTruthy();
      expect(screen.getByText("Book not found")).toBeTruthy();
    });
  });

  it("shows book details when fetch succeeds", async () => {
    render(<BookDetailScreen />);
    await waitFor(() => {
      expect(screen.getByText("Test Book")).toBeTruthy();
      expect(screen.queryByTestId("error-state")).toBeNull();
    });
  });
});
