# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useListMyBooks, useGetBooksByUserIdAndIsbn, useGetBookById, useCreateBook, useUpdateBook, useDeleteBook } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useListMyBooks();

const { data, isPending, isSuccess, isError, error } = useGetBooksByUserIdAndIsbn(getBooksByUserIdAndIsbnVars);

const { data, isPending, isSuccess, isError, error } = useGetBookById(getBookByIdVars);

const { data, isPending, isSuccess, isError, error } = useCreateBook(createBookVars);

const { data, isPending, isSuccess, isError, error } = useUpdateBook(updateBookVars);

const { data, isPending, isSuccess, isError, error } = useDeleteBook(deleteBookVars);

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { listMyBooks, getBooksByUserIdAndIsbn, getBookById, createBook, updateBook, deleteBook } from '@dataconnect/generated';


// Operation ListMyBooks: 
const { data } = await ListMyBooks(dataConnect);

// Operation GetBooksByUserIdAndIsbn:  For variables, look at type GetBooksByUserIdAndIsbnVars in ../index.d.ts
const { data } = await GetBooksByUserIdAndIsbn(dataConnect, getBooksByUserIdAndIsbnVars);

// Operation GetBookById:  For variables, look at type GetBookByIdVars in ../index.d.ts
const { data } = await GetBookById(dataConnect, getBookByIdVars);

// Operation CreateBook:  For variables, look at type CreateBookVars in ../index.d.ts
const { data } = await CreateBook(dataConnect, createBookVars);

// Operation UpdateBook:  For variables, look at type UpdateBookVars in ../index.d.ts
const { data } = await UpdateBook(dataConnect, updateBookVars);

// Operation DeleteBook:  For variables, look at type DeleteBookVars in ../index.d.ts
const { data } = await DeleteBook(dataConnect, deleteBookVars);


```