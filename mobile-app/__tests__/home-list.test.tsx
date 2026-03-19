import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import HomeScreen from "../app/(tabs)/index";
import { fetchMyBooks, type Book } from "@/lib/books";

jest.mock("@/lib/books");
jest.mock("expo-router", () => ({
  Redirect: () => null,
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
jest.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ user: { uid: "test-user" }, loading: false, signOut: jest.fn() }),
}));
jest.mock("@/components/BookCoverImage", () => {
  return function BookCoverImage({ placeholderText }: any) {
    return <>{placeholderText}</>;
  };
});

const mockFetchMyBooks = fetchMyBooks as jest.MockedFunction<typeof fetchMyBooks>;

const mockBooks: Book[] = [
  {
    id: "1",
    userId: "user1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "123",
    haveRead: false,
    own: false,
    wantToRead: false,
    wantToReadPosition: 0,
  },
  {
    id: "2",
    userId: "user1",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "456",
    haveRead: false,
    own: false,
    wantToRead: false,
    wantToReadPosition: 1,
  },
];

describe("HomeScreen list and refresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchMyBooks.mockResolvedValue(mockBooks);
  });

  it("renders list items after successful load", async () => {
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText("The Great Gatsby")).toBeTruthy();
      expect(screen.getByText("To Kill a Mockingbird")).toBeTruthy();
    });
  });

  it("renders empty state when list is empty", async () => {
    mockFetchMyBooks.mockResolvedValue([]);
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeTruthy();
    });
    expect(screen.getByText("No books yet")).toBeTruthy();
    expect(screen.getByText("Scan a barcode or manually add a book to get started")).toBeTruthy();
  });

  it("shows full-page error state when initial load fails", async () => {
    mockFetchMyBooks.mockRejectedValue(new Error("Failed to fetch books"));
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("error-state")).toBeTruthy();
      expect(screen.getByText("Failed to fetch books")).toBeTruthy();
    });
  });

  it("shows banner error when refresh fails after data is loaded", async () => {
    render(<HomeScreen />);
    await waitFor(() => expect(screen.getByText("The Great Gatsby")).toBeTruthy());

    mockFetchMyBooks.mockRejectedValue(new Error("Refresh failed"));
    screen.getByTestId("books-list").props.refreshControl.props.onRefresh();

    await waitFor(() => {
      expect(screen.getByTestId("error-banner")).toBeTruthy();
      expect(screen.getByText("Refresh failed")).toBeTruthy();
    });
  });
});
