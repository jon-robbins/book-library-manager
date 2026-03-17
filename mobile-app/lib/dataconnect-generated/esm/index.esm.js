import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'library',
  location: 'us-east4'
};

export const listMyBooksRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyBooks');
}
listMyBooksRef.operationName = 'ListMyBooks';

export function listMyBooks(dc) {
  return executeQuery(listMyBooksRef(dc));
}

export const getBooksByUserIdAndIsbnRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBooksByUserIdAndIsbn', inputVars);
}
getBooksByUserIdAndIsbnRef.operationName = 'GetBooksByUserIdAndIsbn';

export function getBooksByUserIdAndIsbn(dcOrVars, vars) {
  return executeQuery(getBooksByUserIdAndIsbnRef(dcOrVars, vars));
}

export const getBookByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBookById', inputVars);
}
getBookByIdRef.operationName = 'GetBookById';

export function getBookById(dcOrVars, vars) {
  return executeQuery(getBookByIdRef(dcOrVars, vars));
}

export const createBookRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateBook', inputVars);
}
createBookRef.operationName = 'CreateBook';

export function createBook(dcOrVars, vars) {
  return executeMutation(createBookRef(dcOrVars, vars));
}

export const updateBookRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateBook', inputVars);
}
updateBookRef.operationName = 'UpdateBook';

export function updateBook(dcOrVars, vars) {
  return executeMutation(updateBookRef(dcOrVars, vars));
}

export const deleteBookRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteBook', inputVars);
}
deleteBookRef.operationName = 'DeleteBook';

export function deleteBook(dcOrVars, vars) {
  return executeMutation(deleteBookRef(dcOrVars, vars));
}

