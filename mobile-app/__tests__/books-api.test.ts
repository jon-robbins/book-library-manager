import { getBookMetadataByIsbn } from "@/lib/booksApi";

const mockGetFunctions = jest.fn(() => ({}));
const mockCallable = jest.fn();
const mockHttpsCallable = jest.fn(() => mockCallable);

jest.mock("firebase/functions", () => ({
  getFunctions: () => mockGetFunctions(),
  httpsCallable: () => mockHttpsCallable(),
}));

jest.mock("@/lib/firebase", () => ({
  __esModule: true,
  default: {},
}));

function makeJsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("getBookMetadataByIsbn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as unknown as { fetch: jest.Mock }).fetch = jest.fn();
  });

  it("returns null when normalized ISBN is empty", async () => {
    const result = await getBookMetadataByIsbn("----");
    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockHttpsCallable).not.toHaveBeenCalled();
  });

  it("returns Open Library metadata when available", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeJsonResponse({
        "ISBN:9780307465351": {
          thumbnail_url: "https://openlibrary.org/cover.jpg",
          details: {
            title: "Open Library Book",
            description: "open-desc",
            publish_date: "2015",
            subjects: ["History", "Memoir"],
            languages: [{ key: "/languages/eng" }],
            authors: [{ name: "Author One" }, { name: "Author Two" }],
          },
        },
      })
    );

    const result = await getBookMetadataByIsbn("978-0-307-46535-1");
    expect(result).toEqual({
      title: "Open Library Book",
      author: "Author One, Author Two",
      isbn: "9780307465351",
      coverImgUrl: "https://openlibrary.org/cover.jpg",
      description: "open-desc",
      publishDate: "2015",
      categories: ["History", "Memoir"],
      averageRating: null,
      ratingsCount: null,
      language: "eng",
    });
    expect(mockHttpsCallable).not.toHaveBeenCalled();
  });

  it("falls back to callable when Open Library response is non-2xx", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(makeJsonResponse({}, false, 500));
    mockCallable.mockResolvedValueOnce({
      data: {
        title: "Google Book",
        author: "GB Author",
        isbn: "9780307465351",
        coverImgUrl: "https://google.example/cover.jpg",
        description: "g-desc",
        publishDate: "2010",
        categories: ["Tech"],
        averageRating: 4.1,
        ratingsCount: 321,
        language: "en",
      },
    });

    const result = await getBookMetadataByIsbn("978-0-307-46535-1");
    expect(mockGetFunctions).toHaveBeenCalledTimes(1);
    expect(mockHttpsCallable).toHaveBeenCalledTimes(1);
    expect(mockCallable).toHaveBeenCalledWith({ isbn: "9780307465351" });
    expect(result?.title).toBe("Google Book");
  });

  it("returns null when both Open Library and callable fail", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(makeJsonResponse({}, false, 503));
    mockCallable.mockRejectedValueOnce(new Error("callable failed"));

    const result = await getBookMetadataByIsbn("9780307465351");
    expect(result).toBeNull();
  });
});
