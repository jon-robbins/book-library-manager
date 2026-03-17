import { ListMyBooksData, GetBooksByUserIdAndIsbnData, GetBooksByUserIdAndIsbnVariables, GetBookByIdData, GetBookByIdVariables, CreateBookData, CreateBookVariables, UpdateBookData, UpdateBookVariables, DeleteBookData, DeleteBookVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListMyBooks(options?: useDataConnectQueryOptions<ListMyBooksData>): UseDataConnectQueryResult<ListMyBooksData, undefined>;
export function useListMyBooks(dc: DataConnect, options?: useDataConnectQueryOptions<ListMyBooksData>): UseDataConnectQueryResult<ListMyBooksData, undefined>;

export function useGetBooksByUserIdAndIsbn(vars: GetBooksByUserIdAndIsbnVariables, options?: useDataConnectQueryOptions<GetBooksByUserIdAndIsbnData>): UseDataConnectQueryResult<GetBooksByUserIdAndIsbnData, GetBooksByUserIdAndIsbnVariables>;
export function useGetBooksByUserIdAndIsbn(dc: DataConnect, vars: GetBooksByUserIdAndIsbnVariables, options?: useDataConnectQueryOptions<GetBooksByUserIdAndIsbnData>): UseDataConnectQueryResult<GetBooksByUserIdAndIsbnData, GetBooksByUserIdAndIsbnVariables>;

export function useGetBookById(vars: GetBookByIdVariables, options?: useDataConnectQueryOptions<GetBookByIdData>): UseDataConnectQueryResult<GetBookByIdData, GetBookByIdVariables>;
export function useGetBookById(dc: DataConnect, vars: GetBookByIdVariables, options?: useDataConnectQueryOptions<GetBookByIdData>): UseDataConnectQueryResult<GetBookByIdData, GetBookByIdVariables>;

export function useCreateBook(options?: useDataConnectMutationOptions<CreateBookData, FirebaseError, CreateBookVariables>): UseDataConnectMutationResult<CreateBookData, CreateBookVariables>;
export function useCreateBook(dc: DataConnect, options?: useDataConnectMutationOptions<CreateBookData, FirebaseError, CreateBookVariables>): UseDataConnectMutationResult<CreateBookData, CreateBookVariables>;

export function useUpdateBook(options?: useDataConnectMutationOptions<UpdateBookData, FirebaseError, UpdateBookVariables>): UseDataConnectMutationResult<UpdateBookData, UpdateBookVariables>;
export function useUpdateBook(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateBookData, FirebaseError, UpdateBookVariables>): UseDataConnectMutationResult<UpdateBookData, UpdateBookVariables>;

export function useDeleteBook(options?: useDataConnectMutationOptions<DeleteBookData, FirebaseError, DeleteBookVariables>): UseDataConnectMutationResult<DeleteBookData, DeleteBookVariables>;
export function useDeleteBook(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteBookData, FirebaseError, DeleteBookVariables>): UseDataConnectMutationResult<DeleteBookData, DeleteBookVariables>;
