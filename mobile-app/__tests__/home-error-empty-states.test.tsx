import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
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
];

describe("HomeScreen error and empty states", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchMyBooks.mockResolvedValue(mockBooks);
  });

  it("renders retry action in full-page error state", async () => {
    mockFetchMyBooks.mockRejectedValue(new Error("Network error"));
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("error-state")).toBeTruthy();
      expect(screen.getByTestId("error-state-retry")).toBeTruthy();
    });
  });

  it("shows and dismisses refresh error banner", async () => {
    render(<HomeScreen />);
    await waitFor(() => expect(screen.getByText("The Great Gatsby")).toBeTruthy());

    mockFetchMyBooks.mockRejectedValue(new Error("Refresh failed"));
    screen.getByTestId("books-list").props.refreshControl.props.onRefresh();

    await waitFor(() => {
      expect(screen.getByTestId("error-banner-dismiss")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("error-banner-dismiss"));
    await waitFor(() => {
      expect(screen.queryByTestId("error-banner")).toBeNull();
    });
  });

  it("renders empty-state message when library is empty", async () => {
    mockFetchMyBooks.mockResolvedValue([]);
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeTruthy();
    });
    expect(screen.getByText("No books yet")).toBeTruthy();
    expect(screen.getByText("Scan a barcode or manually add a book to get started")).toBeTruthy();
  });
});
