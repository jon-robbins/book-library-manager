import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import BookDetailScreen from "../app/book/[id]";
import { fetchBookById, addToWantToRead, removeFromWantToRead } from "@/lib/books";

jest.mock("@/lib/books");
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: "test-book-1" }),
}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ setOptions: jest.fn() }),
}));
jest.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ user: { uid: "test-user" }, loading: false, signOut: jest.fn() }),
}));
jest.mock("@/components/BookCoverImage", () => {
  return function BookCoverImage({ placeholderText }: any) {
    return <>{placeholderText}</>;
  };
});

const mockFetchBookById = fetchBookById as jest.MockedFunction<typeof fetchBookById>;
const mockAddToWantToRead = addToWantToRead as jest.MockedFunction<typeof addToWantToRead>;
const mockRemoveFromWantToRead = removeFromWantToRead as jest.MockedFunction<typeof removeFromWantToRead>;

const baseBook = {
  id: "test-book-1",
  userId: "user1",
  title: "The Great Gatsby",
  author: "F. Scott Fitzgerald",
  isbn: "978-0743273565",
  haveRead: false,
  own: false,
  wantToRead: false,
  wantToReadPosition: 0,
  commentary: "Must read",
};

describe("Book detail want-to-read toggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockFetchBookById.mockResolvedValue(baseBook as any);
    mockAddToWantToRead.mockResolvedValue();
    mockRemoveFromWantToRead.mockResolvedValue();
  });

  it("adds book to want-to-read list", async () => {
    render(<BookDetailScreen />);
    await waitFor(() => expect(screen.getByText("Add to Want-to-Read")).toBeTruthy());

    fireEvent.press(screen.getByTestId("want-to-read-button"));

    await waitFor(() => {
      expect(mockAddToWantToRead).toHaveBeenCalledWith("test-book-1");
    });
  });

  it("removes book from want-to-read list", async () => {
    mockFetchBookById.mockResolvedValue({ ...baseBook, wantToRead: true } as any);
    render(<BookDetailScreen />);
    await waitFor(() => expect(screen.getByText("✓ In Want-to-Read List")).toBeTruthy());

    fireEvent.press(screen.getByTestId("want-to-read-button"));

    await waitFor(() => {
      expect(mockRemoveFromWantToRead).toHaveBeenCalledWith("test-book-1");
    });
  });

  it("shows alert when update fails", async () => {
    mockAddToWantToRead.mockRejectedValue(new Error("Add failed"));
    render(<BookDetailScreen />);
    await waitFor(() => expect(screen.getByText("Add to Want-to-Read")).toBeTruthy());

    fireEvent.press(screen.getByTestId("want-to-read-button"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Error", "Add failed");
    });
  });
});
