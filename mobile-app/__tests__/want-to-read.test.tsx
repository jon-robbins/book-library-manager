import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import WantToReadScreen from "../app/(tabs)/want-to-read";
import { getWantToReadList, moveWantToReadPosition, removeFromWantToRead, type Book } from "@/lib/books";

jest.mock("@/lib/books");
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useFocusEffect: jest.fn(),
  Redirect: () => null,
}));
jest.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ user: { uid: "test-user" }, loading: false, signOut: jest.fn() }),
}));
jest.mock("@/components/BookCoverImage", () => {
  return function BookCoverImage({ placeholderText }: any) {
    return <>{placeholderText}</>;
  };
});

const mockGetWantToReadList = getWantToReadList as jest.MockedFunction<typeof getWantToReadList>;
const mockMoveWantToReadPosition = moveWantToReadPosition as jest.MockedFunction<typeof moveWantToReadPosition>;
const mockRemoveFromWantToRead = removeFromWantToRead as jest.MockedFunction<typeof removeFromWantToRead>;

const mockBooks: Book[] = [
  {
    id: "1",
    userId: "user1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "123",
    haveRead: false,
    own: false,
    wantToRead: true,
    wantToReadPosition: 0,
  },
  {
    id: "2",
    userId: "user1",
    title: "1984",
    author: "George Orwell",
    isbn: "456",
    haveRead: false,
    own: false,
    wantToRead: true,
    wantToReadPosition: 1,
  },
];

describe("WantToReadScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWantToReadList.mockResolvedValue(mockBooks);
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("renders books from want-to-read list", async () => {
    render(<WantToReadScreen />);
    await waitFor(() => {
      expect(screen.getByText("The Great Gatsby")).toBeTruthy();
      expect(screen.getByText("1984")).toBeTruthy();
    });
  });

  it("renders empty state when list is empty", async () => {
    mockGetWantToReadList.mockResolvedValue([]);
    render(<WantToReadScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeTruthy();
      expect(screen.getByText("No books to read")).toBeTruthy();
    });
  });

  it("enters edit mode and reorders books", async () => {
    mockMoveWantToReadPosition.mockResolvedValue();
    render(<WantToReadScreen />);

    await waitFor(() => expect(screen.getByTestId("edit-button")).toBeTruthy());
    fireEvent.press(screen.getByTestId("edit-button"));
    fireEvent.press(screen.getByTestId("move-down-1"));

    await waitFor(() => {
      expect(mockMoveWantToReadPosition).toHaveBeenCalledWith("1", 1);
    });
  });

  it("asks confirmation before removing a book", async () => {
    mockRemoveFromWantToRead.mockResolvedValue();
    render(<WantToReadScreen />);

    await waitFor(() => expect(screen.getByTestId("edit-button")).toBeTruthy());
    fireEvent.press(screen.getByTestId("edit-button"));
    fireEvent.press(screen.getByTestId("remove-1"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Remove from list",
      expect.stringContaining("The Great Gatsby"),
      expect.any(Array)
    );
  });
});
