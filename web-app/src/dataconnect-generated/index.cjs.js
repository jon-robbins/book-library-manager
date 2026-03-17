const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'library',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const listMyBooksRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyBooks');
}
listMyBooksRef.operationName = 'ListMyBooks';
exports.listMyBooksRef = listMyBooksRef;

exports.listMyBooks = function listMyBooks(dc) {
  return executeQuery(listMyBooksRef(dc));
};

const getBooksByUserIdAndIsbnRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBooksByUserIdAndIsbn', inputVars);
}
getBooksByUserIdAndIsbnRef.operationName = 'GetBooksByUserIdAndIsbn';
exports.getBooksByUserIdAndIsbnRef = getBooksByUserIdAndIsbnRef;

exports.getBooksByUserIdAndIsbn = function getBooksByUserIdAndIsbn(dcOrVars, vars) {
  return executeQuery(getBooksByUserIdAndIsbnRef(dcOrVars, vars));
};

const getBookByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBookById', inputVars);
}
getBookByIdRef.operationName = 'GetBookById';
exports.getBookByIdRef = getBookByIdRef;

exports.getBookById = function getBookById(dcOrVars, vars) {
  return executeQuery(getBookByIdRef(dcOrVars, vars));
};

const createBookRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateBook', inputVars);
}
createBookRef.operationName = 'CreateBook';
exports.createBookRef = createBookRef;

exports.createBook = function createBook(dcOrVars, vars) {
  return executeMutation(createBookRef(dcOrVars, vars));
};

const updateBookRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateBook', inputVars);
}
updateBookRef.operationName = 'UpdateBook';
exports.updateBookRef = updateBookRef;

exports.updateBook = function updateBook(dcOrVars, vars) {
  return executeMutation(updateBookRef(dcOrVars, vars));
};

const deleteBookRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteBook', inputVars);
}
deleteBookRef.operationName = 'DeleteBook';
exports.deleteBookRef = deleteBookRef;

exports.deleteBook = function deleteBook(dcOrVars, vars) {
  return executeMutation(deleteBookRef(dcOrVars, vars));
};
