# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





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