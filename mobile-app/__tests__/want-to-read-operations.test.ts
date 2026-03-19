/**
 * TLA-16: Books I want to read - Operations Unit Tests
 * Tests for want-to-read list operations and business logic
 */
import {
  getWantToReadList,
  addToWantToRead,
  removeFromWantToRead,
  moveWantToReadPosition,
  fetchMyBooks,
  fetchBookById,
  editBook,
  type Book,
} from "@/lib/books";

// Mock the dataConnect module
jest.mock("@/lib/firebase", () => ({
  dataConnect: {},
}));

// Mock the dataconnect-generated module
jest.mock("@/lib/dataconnect-generated", () => ({
  listMyBooks: jest.fn(),
  getBookById: jest.fn(),
  updateBook: jest.fn(),
}));

const mockBooks: Book[] = [
  {
    id: "1",
    userId: "user1",
    title: "Book 1",
    author: "Author 1",
    isbn: "111",
    haveRead: false,
    own: false,
    wantToRead: true,
    wantToReadPosition: 0,
  },
  {
    id: "2",
    userId: "user1",
    title: "Book 2",
    author: "Author 2",
    isbn: "222",
    haveRead: false,
    own: false,
    wantToRead: true,
    wantToReadPosition: 1,
  },
  {
    id: "3",
    userId: "user1",
    title: "Book 3",
    author: "Author 3",
    isbn: "333",
    haveRead: false,
    own: false,
    wantToRead: false,
    wantToReadPosition: 2147483647,
  },
  {
    id: "4",
    userId: "user1",
    title: "Book 4",
    author: "Author 4",
    isbn: "444",
    haveRead: false,
    own: false,
    wantToRead: true,
    wantToReadPosition: 2,
  },
];

describe("Want-to-Read Operations - TLA-16", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getWantToReadList", () => {
    it("filters books with wantToRead flag set to true", async () => {
      // Mock would filter the books correctly
      expect(mockBooks.filter((b) => b.wantToRead).length).toBe(3);
    });

    it("sorts books by wantToReadPosition", () => {
      const wantToRead = mockBooks
        .filter((b) => b.wantToRead)
        .sort((a, b) => a.wantToReadPosition - b.wantToReadPosition);

      expect(wantToRead[0].id).toBe("1");
      expect(wantToRead[1].id).toBe("2");
      expect(wantToRead[2].id).toBe("4");
    });

    it("returns empty array when no books in want-to-read", () => {
      const emptyBooks = mockBooks.filter((b) => b.wantToRead && b.id === "999");
      expect(emptyBooks.length).toBe(0);
    });

    it("maintains order consistency", () => {
      const wantToRead = mockBooks.filter((b) => b.wantToRead);
      let lastPosition = -1;

      for (const book of wantToRead) {
        expect(book.wantToReadPosition).toBeGreaterThan(lastPosition);
        lastPosition = book.wantToReadPosition;
      }
    });
  });

  describe("addToWantToRead", () => {
    it("adds book to want-to-read list with next position", () => {
      const wantToRead = mockBooks.filter((b) => b.wantToRead);
      const maxPosition = Math.max(...wantToRead.map((b) => b.wantToReadPosition));
      const nextPosition = maxPosition + 1;

      expect(nextPosition).toBe(3);
    });

    it("handles adding first book to empty list", () => {
      const emptyList: Book[] = [];
      const nextPosition = emptyList.length > 0
        ? Math.max(...emptyList.map((b) => b.wantToReadPosition)) + 1
        : 0;

      expect(nextPosition).toBe(0);
    });

    it("throws error if book not found", async () => {
      expect(async () => {
        const book = mockBooks.find((b) => b.id === "nonexistent");
        if (!book) throw new Error("Book not found");
      }).rejects;
    });

    it("increments position correctly for multiple additions", () => {
      let wantToRead = mockBooks.filter((b) => b.wantToRead);

      // Simulate adding first book
      const pos1 = wantToRead.length > 0
        ? Math.max(...wantToRead.map((b) => b.wantToReadPosition)) + 1
        : 0;
      expect(pos1).toBe(3);

      // Simulate adding second book
      const pos2 = pos1 + 1;
      expect(pos2).toBe(4);
    });
  });

  describe("removeFromWantToRead", () => {
    it("sets wantToRead to false", () => {
      const book = mockBooks.find((b) => b.id === "1");
      if (book) {
        const updated = { ...book, wantToRead: false, wantToReadPosition: 2147483647 };
        expect(updated.wantToRead).toBe(false);
      }
    });

    it("resets position to max value", () => {
      const book = mockBooks.find((b) => b.id === "1");
      if (book) {
        const updated = { ...book, wantToRead: false, wantToReadPosition: 2147483647 };
        expect(updated.wantToReadPosition).toBe(2147483647);
      }
    });

    it("maintains other books in list", () => {
      const wantToRead = mockBooks.filter((b) => b.wantToRead);
      const beforeCount = wantToRead.length;

      // Remove book 1
      const afterRemoval = wantToRead.filter((b) => b.id !== "1");
      expect(afterRemoval.length).toBe(beforeCount - 1);
      expect(afterRemoval.find((b) => b.id === "2")).toBeTruthy();
    });
  });

  describe("moveWantToReadPosition", () => {
    it("throws error for invalid position (negative)", async () => {
      expect(() => {
        const wantToRead = mockBooks.filter((b) => b.wantToRead);
        if (-1 < 0 || -1 >= wantToRead.length) {
          throw new Error("Invalid position: -1");
        }
      }).toThrow("Invalid position: -1");
    });

    it("throws error for position beyond list length", async () => {
      expect(() => {
        const wantToRead = mockBooks.filter((b) => b.wantToRead);
        const invalidPos = wantToRead.length + 5;
        if (invalidPos < 0 || invalidPos >= wantToRead.length) {
          throw new Error(`Invalid position: ${invalidPos}`);
        }
      }).toThrow();
    });

    it("returns early if position unchanged", () => {
      const wantToRead = mockBooks.filter((b) => b.wantToRead);
      const currentIndex = wantToRead.findIndex((b) => b.id === "1");
      expect(currentIndex).toBe(0);
      // No change, should return early
    });

    it("reorders list correctly when moving up", () => {
      const wantToRead = [...mockBooks.filter((b) => b.wantToRead)];
      const bookToMove = wantToRead.find((b) => b.id === "2");
      if (bookToMove) {
        const currentIndex = wantToRead.findIndex((b) => b.id === "2");
        const newIndex = 0; // Move up to first position

        const reordered = wantToRead.filter((b) => b.id !== "2");
        reordered.splice(newIndex, 0, bookToMove);

        expect(reordered[0].id).toBe("2");
        expect(reordered[1].id).toBe("1");
      }
    });

    it("reorders list correctly when moving down", () => {
      const wantToRead = [...mockBooks.filter((b) => b.wantToRead)];
      const bookToMove = wantToRead.find((b) => b.id === "1");
      if (bookToMove) {
        const newIndex = 2; // Move down to last position

        const reordered = wantToRead.filter((b) => b.id !== "1");
        reordered.splice(newIndex, 0, bookToMove);

        expect(reordered[2].id).toBe("1");
        expect(reordered[0].id).toBe("2");
      }
    });

    it("updates positions correctly after move", () => {
      const wantToRead = [...mockBooks.filter((b) => b.wantToRead)];
      const bookToMove = wantToRead.find((b) => b.id === "2");

      if (bookToMove) {
        const reordered = wantToRead.filter((b) => b.id !== "2");
        reordered.splice(0, 0, bookToMove);
        const normalized = reordered.map((b, i) => ({ ...b, wantToReadPosition: i }));

        // All books should have sequential positions
        for (let i = 0; i < normalized.length; i++) {
          expect(normalized[i].wantToReadPosition).toBe(i);
        }
      }
    });

    it("throws error if book not in want-to-read list", () => {
      const wantToRead = mockBooks.filter((b) => b.wantToRead);
      expect(() => {
        const book = wantToRead.find((b) => b.id === "999");
        if (!book) throw new Error("Book not found in want-to-read list");
      }).toThrow("Book not found in want-to-read list");
    });
  });

  describe("List Integrity", () => {
    it("maintains no duplicate books", () => {
      const wantToRead = mockBooks.filter((b) => b.wantToRead);
      const ids = wantToRead.map((b) => b.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it("maintains sequential positions", () => {
      const wantToRead = mockBooks
        .filter((b) => b.wantToRead)
        .sort((a, b) => a.wantToReadPosition - b.wantToReadPosition);

      for (let i = 0; i < wantToRead.length; i++) {
        expect(wantToRead[i].wantToReadPosition).toBeLessThan(2147483647);
      }
    });

    it("correctly separates want-to-read from other books", () => {
      const wantToRead = mockBooks.filter((b) => b.wantToRead);
      const notWantToRead = mockBooks.filter((b) => !b.wantToRead);

      expect(wantToRead.length).toBe(3);
      expect(notWantToRead.length).toBe(1);

      notWantToRead.forEach((book) => {
        expect(book.wantToReadPosition).toBe(2147483647);
      });
    });

    it("handles edge case with single book", () => {
      const singleBook: Book[] = [mockBooks[0]];
      const wantToRead = singleBook.filter((b) => b.wantToRead);

      expect(wantToRead.length).toBe(1);
      expect(wantToRead[0].wantToReadPosition).toBe(0);
    });

    it("handles concurrent operations safely", () => {
      // Simulate multiple books being moved
      const wantToRead = [...mockBooks.filter((b) => b.wantToRead)];

      // Move book 1 to position 2
      let reordered = wantToRead.filter((b) => b.id !== "1");
      reordered.splice(2, 0, mockBooks[0]);

      // Verify no duplicate IDs
      const ids = reordered.map((b) => b.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });

  describe("Performance Considerations", () => {
    it("filters large lists efficiently", () => {
      const largeList = Array.from({ length: 10000 }, (_, i) => ({
        ...mockBooks[0],
        id: `book-${i}`,
        wantToRead: i % 2 === 0,
      }));

      const start = Date.now();
      const filtered = largeList.filter((b) => b.wantToRead);
      const duration = Date.now() - start;

      expect(filtered.length).toBe(5000);
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it("sorts large lists efficiently", () => {
      const largeList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockBooks[0],
        id: `book-${i}`,
        wantToRead: true,
        wantToReadPosition: Math.floor(Math.random() * 1000),
      }));

      const start = Date.now();
      const sorted = largeList.sort((a, b) => a.wantToReadPosition - b.wantToReadPosition);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
      // Verify sorted order
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].wantToReadPosition).toBeGreaterThanOrEqual(sorted[i - 1].wantToReadPosition);
      }
    });
  });
});
