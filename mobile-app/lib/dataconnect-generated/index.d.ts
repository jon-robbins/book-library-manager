import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Book_Key {
  id: UUIDString;
  __typename?: 'Book_Key';
}

export interface CreateBookData {
  book_insert: Book_Key;
}

export interface CreateBookVariables {
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
}

export interface DeleteBookData {
  book_delete?: Book_Key | null;
}

export interface DeleteBookVariables {
  id: UUIDString;
}

export interface GetBookByIdData {
  books: ({
    id: UUIDString;
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
  } & Book_Key)[];
}

export interface GetBookByIdVariables {
  id: UUIDString;
}

export interface GetBooksByUserIdAndIsbnData {
  books: ({
    id: UUIDString;
    title: string;
    author: string;
    isbn: string;
  } & Book_Key)[];
}

export interface GetBooksByUserIdAndIsbnVariables {
  isbn: string;
}

export interface ListMyBooksData {
  books: ({
    id: UUIDString;
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
  } & Book_Key)[];
}

export interface UpdateBookData {
  book_update?: Book_Key | null;
}

export interface UpdateBookVariables {
  id: UUIDString;
  title?: string | null;
  author?: string | null;
  isbn?: string | null;
  haveRead?: boolean | null;
  own?: boolean | null;
  coverImgUrl?: string | null;
  description?: string | null;
  publishDate?: string | null;
  categories?: string[] | null;
  averageRating?: number | null;
  ratingsCount?: number | null;
  language?: string | null;
  tags?: string[] | null;
  commentary?: string | null;
}

interface ListMyBooksRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyBooksData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMyBooksData, undefined>;
  operationName: string;
}
export const listMyBooksRef: ListMyBooksRef;

export function listMyBooks(): QueryPromise<ListMyBooksData, undefined>;
export function listMyBooks(dc: DataConnect): QueryPromise<ListMyBooksData, undefined>;

interface GetBooksByUserIdAndIsbnRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBooksByUserIdAndIsbnVariables): QueryRef<GetBooksByUserIdAndIsbnData, GetBooksByUserIdAndIsbnVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetBooksByUserIdAndIsbnVariables): QueryRef<GetBooksByUserIdAndIsbnData, GetBooksByUserIdAndIsbnVariables>;
  operationName: string;
}
export const getBooksByUserIdAndIsbnRef: GetBooksByUserIdAndIsbnRef;

export function getBooksByUserIdAndIsbn(vars: GetBooksByUserIdAndIsbnVariables): QueryPromise<GetBooksByUserIdAndIsbnData, GetBooksByUserIdAndIsbnVariables>;
export function getBooksByUserIdAndIsbn(dc: DataConnect, vars: GetBooksByUserIdAndIsbnVariables): QueryPromise<GetBooksByUserIdAndIsbnData, GetBooksByUserIdAndIsbnVariables>;

interface GetBookByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBookByIdVariables): QueryRef<GetBookByIdData, GetBookByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetBookByIdVariables): QueryRef<GetBookByIdData, GetBookByIdVariables>;
  operationName: string;
}
export const getBookByIdRef: GetBookByIdRef;

export function getBookById(vars: GetBookByIdVariables): QueryPromise<GetBookByIdData, GetBookByIdVariables>;
export function getBookById(dc: DataConnect, vars: GetBookByIdVariables): QueryPromise<GetBookByIdData, GetBookByIdVariables>;

interface CreateBookRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateBookVariables): MutationRef<CreateBookData, CreateBookVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateBookVariables): MutationRef<CreateBookData, CreateBookVariables>;
  operationName: string;
}
export const createBookRef: CreateBookRef;

export function createBook(vars: CreateBookVariables): MutationPromise<CreateBookData, CreateBookVariables>;
export function createBook(dc: DataConnect, vars: CreateBookVariables): MutationPromise<CreateBookData, CreateBookVariables>;

interface UpdateBookRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateBookVariables): MutationRef<UpdateBookData, UpdateBookVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateBookVariables): MutationRef<UpdateBookData, UpdateBookVariables>;
  operationName: string;
}
export const updateBookRef: UpdateBookRef;

export function updateBook(vars: UpdateBookVariables): MutationPromise<UpdateBookData, UpdateBookVariables>;
export function updateBook(dc: DataConnect, vars: UpdateBookVariables): MutationPromise<UpdateBookData, UpdateBookVariables>;

interface DeleteBookRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteBookVariables): MutationRef<DeleteBookData, DeleteBookVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteBookVariables): MutationRef<DeleteBookData, DeleteBookVariables>;
  operationName: string;
}
export const deleteBookRef: DeleteBookRef;

export function deleteBook(vars: DeleteBookVariables): MutationPromise<DeleteBookData, DeleteBookVariables>;
export function deleteBook(dc: DataConnect, vars: DeleteBookVariables): MutationPromise<DeleteBookData, DeleteBookVariables>;

