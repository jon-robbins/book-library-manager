import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import BookDetailScreen from "../app/book/[id]";
import { fetchBookById, editBook } from "@/lib/books";

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "test-book-id" }),
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ setOptions: jest.fn() }),
}));
jest.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ user: { uid: "test-user" } }),
}));
jest.mock("@/lib/books", () => ({
  fetchBookById: jest.fn(),
  removeBook: jest.fn(),
  editBook: jest.fn(),
  addToWantToRead: jest.fn(),
  removeFromWantToRead: jest.fn(),
}));
jest.mock("@/components/BookCoverImage", () => {
  return function BookCoverImage({ placeholderText }: any) {
    return <>{placeholderText}</>;
  };
});

const mockFetchBookById = fetchBookById as jest.MockedFunction<typeof fetchBookById>;
const mockEditBook = editBook as jest.MockedFunction<typeof editBook>;

const mockBook = {
  id: "test-book-id",
  userId: "test-user",
  title: "The Great Gatsby",
  author: "F. Scott Fitzgerald",
  isbn: "9780743273565",
  haveRead: true,
  own: true,
  wantToRead: false,
  wantToReadPosition: 0,
  commentary: "Original notes",
};

describe("Book detail commentary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockFetchBookById.mockResolvedValue(mockBook as any);
    mockEditBook.mockResolvedValue();
  });

  it("shows existing commentary", async () => {
    render(<BookDetailScreen />);
    await waitFor(() => {
      expect(screen.getByText("Original notes")).toBeTruthy();
    });
  });

  it("enters edit mode when Edit Notes is pressed", async () => {
    render(<BookDetailScreen />);
    await waitFor(() => expect(screen.getByTestId("edit-button")).toBeTruthy());

    fireEvent.press(screen.getByTestId("edit-button"));
    expect(screen.getByTestId("commentary-input")).toBeTruthy();
    expect(screen.getByTestId("save-button")).toBeTruthy();
  });

  it("saves updated commentary", async () => {
    render(<BookDetailScreen />);
    await waitFor(() => expect(screen.getByTestId("edit-button")).toBeTruthy());

    fireEvent.press(screen.getByTestId("edit-button"));
    fireEvent.changeText(screen.getByTestId("commentary-input"), "Updated notes");
    fireEvent.press(screen.getByTestId("save-button"));

    await waitFor(() => {
      expect(mockEditBook).toHaveBeenCalledWith({
        id: "test-book-id",
        commentary: "Updated notes",
      });
    });
  });
});
