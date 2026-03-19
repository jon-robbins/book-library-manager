import { dataConnect } from "@/lib/firebase";
import {
  listMyBooks,
  getBooksByUserIdAndIsbn,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  type CreateBookVariables,
  type UpdateBookVariables,
} from "@/lib/dataconnect-generated";

export type Book = {
  id: string;
  userId: string;
  title: string;
  author: string;
  isbn: string;
  haveRead: boolean;
  own: boolean;
  wantToRead: boolean;
  wantToReadPosition: number;
  coverImgUrl?: string | null;
  description?: string | null;
  publishDate?: string | null;
  categories?: string[] | null;
  averageRating?: number | null;
  ratingsCount?: number | null;
  language?: string | null;
  tags?: string[] | null;
  commentary?: string | null;
};

export async function fetchMyBooks(): Promise<Book[]> {
  const result = await listMyBooks(dataConnect);
  return (result.data?.books ?? []) as Book[];
}

export async function fetchBooksByIsbn(isbn: string): Promise<Book[]> {
  const result = await getBooksByUserIdAndIsbn(dataConnect, { isbn });
  return (result.data?.books ?? []) as Book[];
}

export async function fetchBookById(id: string): Promise<Book | null> {
  const result = await getBookById(dataConnect, { id });
  const books = result.data?.books ?? [];
  return (books[0] as Book) ?? null;
}

export async function addBook(vars: CreateBookVariables): Promise<void> {
  await createBook(dataConnect, vars);
}

export async function editBook(vars: UpdateBookVariables): Promise<void> {
  await updateBook(dataConnect, vars);
}

export async function removeBook(id: string): Promise<void> {
  await deleteBook(dataConnect, { id });
}

export async function getWantToReadList(): Promise<Book[]> {
  const allBooks = await fetchMyBooks();
  return allBooks
    .filter((book) => book.wantToRead)
    .sort((a, b) => a.wantToReadPosition - b.wantToReadPosition);
}

export async function addToWantToRead(id: string): Promise<void> {
  const book = await fetchBookById(id);
  if (!book) throw new Error("Book not found");

  const wantToReadBooks = await getWantToReadList();
  const nextPosition = wantToReadBooks.length > 0
    ? Math.max(...wantToReadBooks.map((b) => b.wantToReadPosition)) + 1
    : 0;

  await editBook({
    id,
    wantToRead: true,
    wantToReadPosition: nextPosition,
  } as any);
}

export async function removeFromWantToRead(id: string): Promise<void> {
  await editBook({
    id,
    wantToRead: false,
    wantToReadPosition: 2147483647,
  } as any);
}

export async function moveWantToReadPosition(
  id: string,
  newPosition: number
): Promise<void> {
  const wantToReadBooks = await getWantToReadList();

  // Validate the new position
  if (newPosition < 0 || newPosition >= wantToReadBooks.length) {
    throw new Error(`Invalid position: ${newPosition}`);
  }

  const book = wantToReadBooks.find((b) => b.id === id);
  if (!book) throw new Error("Book not found in want-to-read list");

  // Get the current position of the book
  const currentPosition = wantToReadBooks.findIndex((b) => b.id === id);

  if (currentPosition === newPosition) {
    return; // No change needed
  }

  // Re-sort the list to reflect the new position
  const reorderedBooks = wantToReadBooks.filter((b) => b.id !== id);
  reorderedBooks.splice(newPosition, 0, book);

  // Update all affected books with new positions
  for (let i = 0; i < reorderedBooks.length; i++) {
    if (reorderedBooks[i].wantToReadPosition !== i) {
      await editBook({
        id: reorderedBooks[i].id,
        wantToReadPosition: i,
      } as any);
    }
  }
}
