# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListMyBooks*](#listmybooks)
  - [*GetBooksByUserIdAndIsbn*](#getbooksbyuseridandisbn)
  - [*GetBookById*](#getbookbyid)
- [**Mutations**](#mutations)
  - [*CreateBook*](#createbook)
  - [*UpdateBook*](#updatebook)
  - [*DeleteBook*](#deletebook)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListMyBooks
You can execute the `ListMyBooks` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyBooks(): QueryPromise<ListMyBooksData, undefined>;

interface ListMyBooksRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyBooksData, undefined>;
}
export const listMyBooksRef: ListMyBooksRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyBooks(dc: DataConnect): QueryPromise<ListMyBooksData, undefined>;

interface ListMyBooksRef {
  ...
  (dc: DataConnect): QueryRef<ListMyBooksData, undefined>;
}
export const listMyBooksRef: ListMyBooksRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyBooksRef:
```typescript
const name = listMyBooksRef.operationName;
console.log(name);
```

### Variables
The `ListMyBooks` query has no variables.
### Return Type
Recall that executing the `ListMyBooks` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyBooksData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListMyBooks`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyBooks } from '@dataconnect/generated';


// Call the `listMyBooks()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyBooks();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyBooks(dataConnect);

console.log(data.books);

// Or, you can use the `Promise` API.
listMyBooks().then((response) => {
  const data = response.data;
  console.log(data.books);
});
```

### Using `ListMyBooks`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyBooksRef } from '@dataconnect/generated';


// Call the `listMyBooksRef()` function to get a reference to the query.
const ref = listMyBooksRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyBooksRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.books);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.books);
});
```

## GetBooksByUserIdAndIsbn
You can execute the `GetBooksByUserIdAndIsbn` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getBooksByUserIdAndIsbn(vars: GetBooksByUserIdAndIsbnVariables): QueryPromise<GetBooksByUserIdAndIsbnData, GetBooksByUserIdAndIsbnVariables>;

interface GetBooksByUserIdAndIsbnRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBooksByUserIdAndIsbnVariables): QueryRef<GetBooksByUserIdAndIsbnData, GetBooksByUserIdAndIsbnVariables>;
}
export const getBooksByUserIdAndIsbnRef: GetBooksByUserIdAndIsbnRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getBooksByUserIdAndIsbn(dc: DataConnect, vars: GetBooksByUserIdAndIsbnVariables): QueryPromise<GetBooksByUserIdAndIsbnData, GetBooksByUserIdAndIsbnVariables>;

interface GetBooksByUserIdAndIsbnRef {
  ...
  (dc: DataConnect, vars: GetBooksByUserIdAndIsbnVariables): QueryRef<GetBooksByUserIdAndIsbnData, GetBooksByUserIdAndIsbnVariables>;
}
export const getBooksByUserIdAndIsbnRef: GetBooksByUserIdAndIsbnRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getBooksByUserIdAndIsbnRef:
```typescript
const name = getBooksByUserIdAndIsbnRef.operationName;
console.log(name);
```

### Variables
The `GetBooksByUserIdAndIsbn` query requires an argument of type `GetBooksByUserIdAndIsbnVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetBooksByUserIdAndIsbnVariables {
  isbn: string;
}
```
### Return Type
Recall that executing the `GetBooksByUserIdAndIsbn` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetBooksByUserIdAndIsbnData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetBooksByUserIdAndIsbnData {
  books: ({
    id: UUIDString;
    title: string;
    author: string;
    isbn: string;
  } & Book_Key)[];
}
```
### Using `GetBooksByUserIdAndIsbn`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getBooksByUserIdAndIsbn, GetBooksByUserIdAndIsbnVariables } from '@dataconnect/generated';

// The `GetBooksByUserIdAndIsbn` query requires an argument of type `GetBooksByUserIdAndIsbnVariables`:
const getBooksByUserIdAndIsbnVars: GetBooksByUserIdAndIsbnVariables = {
  isbn: ..., 
};

// Call the `getBooksByUserIdAndIsbn()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getBooksByUserIdAndIsbn(getBooksByUserIdAndIsbnVars);
// Variables can be defined inline as well.
const { data } = await getBooksByUserIdAndIsbn({ isbn: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getBooksByUserIdAndIsbn(dataConnect, getBooksByUserIdAndIsbnVars);

console.log(data.books);

// Or, you can use the `Promise` API.
getBooksByUserIdAndIsbn(getBooksByUserIdAndIsbnVars).then((response) => {
  const data = response.data;
  console.log(data.books);
});
```

### Using `GetBooksByUserIdAndIsbn`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getBooksByUserIdAndIsbnRef, GetBooksByUserIdAndIsbnVariables } from '@dataconnect/generated';

// The `GetBooksByUserIdAndIsbn` query requires an argument of type `GetBooksByUserIdAndIsbnVariables`:
const getBooksByUserIdAndIsbnVars: GetBooksByUserIdAndIsbnVariables = {
  isbn: ..., 
};

// Call the `getBooksByUserIdAndIsbnRef()` function to get a reference to the query.
const ref = getBooksByUserIdAndIsbnRef(getBooksByUserIdAndIsbnVars);
// Variables can be defined inline as well.
const ref = getBooksByUserIdAndIsbnRef({ isbn: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getBooksByUserIdAndIsbnRef(dataConnect, getBooksByUserIdAndIsbnVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.books);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.books);
});
```

## GetBookById
You can execute the `GetBookById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getBookById(vars: GetBookByIdVariables): QueryPromise<GetBookByIdData, GetBookByIdVariables>;

interface GetBookByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBookByIdVariables): QueryRef<GetBookByIdData, GetBookByIdVariables>;
}
export const getBookByIdRef: GetBookByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getBookById(dc: DataConnect, vars: GetBookByIdVariables): QueryPromise<GetBookByIdData, GetBookByIdVariables>;

interface GetBookByIdRef {
  ...
  (dc: DataConnect, vars: GetBookByIdVariables): QueryRef<GetBookByIdData, GetBookByIdVariables>;
}
export const getBookByIdRef: GetBookByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getBookByIdRef:
```typescript
const name = getBookByIdRef.operationName;
console.log(name);
```

### Variables
The `GetBookById` query requires an argument of type `GetBookByIdVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetBookByIdVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetBookById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetBookByIdData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetBookById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getBookById, GetBookByIdVariables } from '@dataconnect/generated';

// The `GetBookById` query requires an argument of type `GetBookByIdVariables`:
const getBookByIdVars: GetBookByIdVariables = {
  id: ..., 
};

// Call the `getBookById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getBookById(getBookByIdVars);
// Variables can be defined inline as well.
const { data } = await getBookById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getBookById(dataConnect, getBookByIdVars);

console.log(data.books);

// Or, you can use the `Promise` API.
getBookById(getBookByIdVars).then((response) => {
  const data = response.data;
  console.log(data.books);
});
```

### Using `GetBookById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getBookByIdRef, GetBookByIdVariables } from '@dataconnect/generated';

// The `GetBookById` query requires an argument of type `GetBookByIdVariables`:
const getBookByIdVars: GetBookByIdVariables = {
  id: ..., 
};

// Call the `getBookByIdRef()` function to get a reference to the query.
const ref = getBookByIdRef(getBookByIdVars);
// Variables can be defined inline as well.
const ref = getBookByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getBookByIdRef(dataConnect, getBookByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.books);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.books);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateBook
You can execute the `CreateBook` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createBook(vars: CreateBookVariables): MutationPromise<CreateBookData, CreateBookVariables>;

interface CreateBookRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateBookVariables): MutationRef<CreateBookData, CreateBookVariables>;
}
export const createBookRef: CreateBookRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createBook(dc: DataConnect, vars: CreateBookVariables): MutationPromise<CreateBookData, CreateBookVariables>;

interface CreateBookRef {
  ...
  (dc: DataConnect, vars: CreateBookVariables): MutationRef<CreateBookData, CreateBookVariables>;
}
export const createBookRef: CreateBookRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createBookRef:
```typescript
const name = createBookRef.operationName;
console.log(name);
```

### Variables
The `CreateBook` mutation requires an argument of type `CreateBookVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `CreateBook` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateBookData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateBookData {
  book_insert: Book_Key;
}
```
### Using `CreateBook`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createBook, CreateBookVariables } from '@dataconnect/generated';

// The `CreateBook` mutation requires an argument of type `CreateBookVariables`:
const createBookVars: CreateBookVariables = {
  title: ..., 
  author: ..., 
  isbn: ..., 
  haveRead: ..., 
  own: ..., 
  coverImgUrl: ..., // optional
  description: ..., // optional
  publishDate: ..., // optional
  categories: ..., // optional
  averageRating: ..., // optional
  ratingsCount: ..., // optional
  language: ..., // optional
  tags: ..., // optional
  commentary: ..., // optional
};

// Call the `createBook()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createBook(createBookVars);
// Variables can be defined inline as well.
const { data } = await createBook({ title: ..., author: ..., isbn: ..., haveRead: ..., own: ..., coverImgUrl: ..., description: ..., publishDate: ..., categories: ..., averageRating: ..., ratingsCount: ..., language: ..., tags: ..., commentary: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createBook(dataConnect, createBookVars);

console.log(data.book_insert);

// Or, you can use the `Promise` API.
createBook(createBookVars).then((response) => {
  const data = response.data;
  console.log(data.book_insert);
});
```

### Using `CreateBook`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createBookRef, CreateBookVariables } from '@dataconnect/generated';

// The `CreateBook` mutation requires an argument of type `CreateBookVariables`:
const createBookVars: CreateBookVariables = {
  title: ..., 
  author: ..., 
  isbn: ..., 
  haveRead: ..., 
  own: ..., 
  coverImgUrl: ..., // optional
  description: ..., // optional
  publishDate: ..., // optional
  categories: ..., // optional
  averageRating: ..., // optional
  ratingsCount: ..., // optional
  language: ..., // optional
  tags: ..., // optional
  commentary: ..., // optional
};

// Call the `createBookRef()` function to get a reference to the mutation.
const ref = createBookRef(createBookVars);
// Variables can be defined inline as well.
const ref = createBookRef({ title: ..., author: ..., isbn: ..., haveRead: ..., own: ..., coverImgUrl: ..., description: ..., publishDate: ..., categories: ..., averageRating: ..., ratingsCount: ..., language: ..., tags: ..., commentary: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createBookRef(dataConnect, createBookVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.book_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.book_insert);
});
```

## UpdateBook
You can execute the `UpdateBook` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateBook(vars: UpdateBookVariables): MutationPromise<UpdateBookData, UpdateBookVariables>;

interface UpdateBookRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateBookVariables): MutationRef<UpdateBookData, UpdateBookVariables>;
}
export const updateBookRef: UpdateBookRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateBook(dc: DataConnect, vars: UpdateBookVariables): MutationPromise<UpdateBookData, UpdateBookVariables>;

interface UpdateBookRef {
  ...
  (dc: DataConnect, vars: UpdateBookVariables): MutationRef<UpdateBookData, UpdateBookVariables>;
}
export const updateBookRef: UpdateBookRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateBookRef:
```typescript
const name = updateBookRef.operationName;
console.log(name);
```

### Variables
The `UpdateBook` mutation requires an argument of type `UpdateBookVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdateBook` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateBookData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateBookData {
  book_update?: Book_Key | null;
}
```
### Using `UpdateBook`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateBook, UpdateBookVariables } from '@dataconnect/generated';

// The `UpdateBook` mutation requires an argument of type `UpdateBookVariables`:
const updateBookVars: UpdateBookVariables = {
  id: ..., 
  title: ..., // optional
  author: ..., // optional
  isbn: ..., // optional
  haveRead: ..., // optional
  own: ..., // optional
  coverImgUrl: ..., // optional
  description: ..., // optional
  publishDate: ..., // optional
  categories: ..., // optional
  averageRating: ..., // optional
  ratingsCount: ..., // optional
  language: ..., // optional
  tags: ..., // optional
  commentary: ..., // optional
};

// Call the `updateBook()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateBook(updateBookVars);
// Variables can be defined inline as well.
const { data } = await updateBook({ id: ..., title: ..., author: ..., isbn: ..., haveRead: ..., own: ..., coverImgUrl: ..., description: ..., publishDate: ..., categories: ..., averageRating: ..., ratingsCount: ..., language: ..., tags: ..., commentary: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateBook(dataConnect, updateBookVars);

console.log(data.book_update);

// Or, you can use the `Promise` API.
updateBook(updateBookVars).then((response) => {
  const data = response.data;
  console.log(data.book_update);
});
```

### Using `UpdateBook`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateBookRef, UpdateBookVariables } from '@dataconnect/generated';

// The `UpdateBook` mutation requires an argument of type `UpdateBookVariables`:
const updateBookVars: UpdateBookVariables = {
  id: ..., 
  title: ..., // optional
  author: ..., // optional
  isbn: ..., // optional
  haveRead: ..., // optional
  own: ..., // optional
  coverImgUrl: ..., // optional
  description: ..., // optional
  publishDate: ..., // optional
  categories: ..., // optional
  averageRating: ..., // optional
  ratingsCount: ..., // optional
  language: ..., // optional
  tags: ..., // optional
  commentary: ..., // optional
};

// Call the `updateBookRef()` function to get a reference to the mutation.
const ref = updateBookRef(updateBookVars);
// Variables can be defined inline as well.
const ref = updateBookRef({ id: ..., title: ..., author: ..., isbn: ..., haveRead: ..., own: ..., coverImgUrl: ..., description: ..., publishDate: ..., categories: ..., averageRating: ..., ratingsCount: ..., language: ..., tags: ..., commentary: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateBookRef(dataConnect, updateBookVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.book_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.book_update);
});
```

## DeleteBook
You can execute the `DeleteBook` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteBook(vars: DeleteBookVariables): MutationPromise<DeleteBookData, DeleteBookVariables>;

interface DeleteBookRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteBookVariables): MutationRef<DeleteBookData, DeleteBookVariables>;
}
export const deleteBookRef: DeleteBookRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteBook(dc: DataConnect, vars: DeleteBookVariables): MutationPromise<DeleteBookData, DeleteBookVariables>;

interface DeleteBookRef {
  ...
  (dc: DataConnect, vars: DeleteBookVariables): MutationRef<DeleteBookData, DeleteBookVariables>;
}
export const deleteBookRef: DeleteBookRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteBookRef:
```typescript
const name = deleteBookRef.operationName;
console.log(name);
```

### Variables
The `DeleteBook` mutation requires an argument of type `DeleteBookVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteBookVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteBook` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteBookData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteBookData {
  book_delete?: Book_Key | null;
}
```
### Using `DeleteBook`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteBook, DeleteBookVariables } from '@dataconnect/generated';

// The `DeleteBook` mutation requires an argument of type `DeleteBookVariables`:
const deleteBookVars: DeleteBookVariables = {
  id: ..., 
};

// Call the `deleteBook()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteBook(deleteBookVars);
// Variables can be defined inline as well.
const { data } = await deleteBook({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteBook(dataConnect, deleteBookVars);

console.log(data.book_delete);

// Or, you can use the `Promise` API.
deleteBook(deleteBookVars).then((response) => {
  const data = response.data;
  console.log(data.book_delete);
});
```

### Using `DeleteBook`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteBookRef, DeleteBookVariables } from '@dataconnect/generated';

// The `DeleteBook` mutation requires an argument of type `DeleteBookVariables`:
const deleteBookVars: DeleteBookVariables = {
  id: ..., 
};

// Call the `deleteBookRef()` function to get a reference to the mutation.
const ref = deleteBookRef(deleteBookVars);
// Variables can be defined inline as well.
const ref = deleteBookRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteBookRef(dataConnect, deleteBookVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.book_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.book_delete);
});
```

