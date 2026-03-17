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
