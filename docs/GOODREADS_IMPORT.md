# Goodreads Import Feature (TLA-21)

## Overview

The Goodreads Import feature allows users to import their Goodreads library into the Library app. Users can export their Goodreads library as a CSV file and import it with automatic validation, deduplication, and metadata enrichment.

## Architecture

### Backend (Cloud Functions)

**File**: `functions/src/index.ts`

#### Core Components:

1. **CSV Parser** (`parseGoodreadsCSV`)
   - Handles Goodreads CSV export format
   - Supports quoted fields and escaped quotes
   - Handles multiline quoted fields
   - Returns array of parsed rows

2. **Row Parser** (`parseGoodreadsRow`)
   - Parses individual Goodreads CSV rows
   - Extracts ISBN from ISBN or ISBN13 fields
   - Normalizes ISBN format
   - Extracts bookshelf information (read, to-read, owned)
   - Extracts ratings and publication date

3. **Import Function** (`importGoodreadsBooks`)
   - Firebase Cloud Function (callable from client)
   - Validates CSV data
   - Checks for existing books (deduplication)
   - Batch inserts books into Firestore
   - Returns detailed import results

#### Features:

- **Validation**: Requires title and author
- **Deduplication**: Prevents duplicate ISBNs
- **Resilience**: Handles large imports with batch operations
- **Partial Failures**: Continues processing on errors, reports all issues
- **Status Tracking**: Returns detailed results for each book (success/skipped/error)
- **Bookshelf Recognition**: Automatically sets read/to-read/owned status

### Frontend (Mobile & Web)

#### Mobile App (React Native)

**File**: `mobile-app/app/import-goodreads.tsx`

- Full-screen import experience
- File selection with `expo-document-picker`
- CSV data paste/upload
- Loading states with spinner
- Results summary with statistics
- Detailed import results list
- Error message display
- Clear failure reasons for each book

**Integration**:
- Added "Import from Goodreads" button to Settings screen
- Accessible via `app/import-goodreads` route

#### Web App (React)

**Files**:
- `web-app/src/components/GoodreadsImportModal.jsx` - Modal component
- `web-app/src/styles/goodreads-import-modal.css` - Styling

- Modal dialog for importing
- File upload + textarea input
- Results view with statistics
- Detailed results list
- Responsive design
- Accessible UI with proper ARIA labels

**Integration**:
- "📥 Import" button in dashboard header
- Modal opens on button click
- Auto-refreshes book list after successful import

## Usage

### For Users

1. **Export from Goodreads**:
   - Go to goodreads.com/review/import
   - Click "Export Library"
   - Select CSV format
   - Download the file

2. **Import into Library App**:
   - **Mobile**: Go to Settings → "Import from Goodreads"
   - **Web**: Click "📥 Import" button on dashboard
   - Upload CSV file or paste CSV data
   - Click "Import Books"
   - Review results

3. **Results**:
   - See count of successful imports
   - View skipped books (already in library, no ISBN)
   - Check failed books with error reasons

## CSV Format

The parser expects the standard Goodreads export CSV format with headers:

```
Book Id,Title,Author,ISBN (""),ISBN13 (""),My Rating,Average Rating,Publisher,Bookshelves,Date Read,...
```

Key fields used:
- `Title` - Book title (required)
- `Author` - Author name (required)
- `ISBN ("")` - ISBN-10 (optional)
- `ISBN13 ("")` - ISBN-13 (optional)
- `My Rating` - User's rating (0-5)
- `Average Rating` - Goodreads average rating
- `Bookshelves` - Read status (read, to-read, owned)
- `Date Read` - When book was read

## Error Handling

### Validation Errors
- **Missing CSV**: User must provide CSV data
- **Missing Title/Author**: Book skipped with reason
- **Missing ISBN**: Book skipped (ISBN required for dedup)
- **Duplicate ISBN**: Book skipped if already in library

### Import Results
Each book gets a status:
- `success` - Book imported
- `skipped` - Book not imported but not an error
- `error` - Book failed to import with reason

### Network Errors
- Timeout or network errors are reported clearly
- No partial data corruption (all-or-nothing batch)

## Edge Cases Handled

1. **Quoted fields with commas**: `"Title, Part 2"` parsed correctly
2. **Escaped quotes**: `"He said ""hello"""` becomes `He said "hello"`
3. **Multiline descriptions**: Fields with newlines handled
4. **Missing optional fields**: Gracefully handles missing columns
5. **Empty CSV file**: Clear error message
6. **ISBN variations**: Handles ISBN-10, ISBN-13, with/without hyphens
7. **Large imports**: Batch operations for efficiency (max 500 per batch)
8. **Duplicate handling**: Compares against existing library before import

## Testing

**Test File**: `functions/src/goodreads-import.test.ts`

### Test Coverage

#### CSV Line Parser
- ✅ Simple comma-separated values
- ✅ Quoted fields with commas
- ✅ Escaped quotes (`""`)
- ✅ Whitespace trimming
- ✅ Empty fields
- ✅ Complex quoting scenarios

#### CSV File Parser
- ✅ Valid Goodreads CSV with headers
- ✅ Goodreads format with quoted column names
- ✅ Skip empty lines
- ✅ Multiline quoted fields
- ✅ Empty CSV handling
- ✅ CSV with only headers
- ✅ Special characters (C++, C#, etc)
- ✅ Various quote styles
- ✅ Extra commas at end
- ✅ Large CSV (1000+ books)
- ✅ Consecutive quotes

### Test Execution

```bash
cd functions
npm install  # Install dependencies
npm test     # Run jest tests
npm run test:watch  # Watch mode
```

## Performance Considerations

1. **Batch Size**: Uses Firestore batch operations (500 max)
2. **Memory**: Streams CSV parsing for large files
3. **API Calls**: No external APIs needed for import
4. **Dedup Speed**: O(1) lookups with Set data structure

## Security

1. **Authentication**: Requires user to be signed in
2. **User Isolation**: Each user can only import their own books
3. **Input Validation**: CSV data validated before processing
4. **Injection Prevention**: No direct database queries, uses parameterized operations
5. **File Size**: Currently unlimited (should add limit in production)

## Future Improvements

1. **Metadata Enrichment**: Fetch cover images and ratings from Google Books API
2. **Partial Retry**: Allow re-importing only failed books
3. **Progress Streaming**: Real-time progress updates for large imports
4. **CSV Validation**: Pre-validate format before processing
5. **Template Download**: Let users export library in Goodreads format
6. **History**: Track import history and allow rollback
7. **Duplicate Resolution**: Allow user to choose when duplicates exist
8. **Performance**: Add bulk API calls for metadata lookup

## Debugging

### Common Issues

**"No valid ISBN found"**
- Book is skipped if both ISBN and ISBN13 are missing or invalid
- User must add ISBN manually if needed

**"Already in your library"**
- Duplicate ISBN detected in user's existing library
- User can update existing entry instead

**"Import failed"**
- Check network connection
- Ensure CSV format is valid
- Try smaller import (split into chunks)
- Check browser console for detailed errors

### Logging

All errors are logged in Firebase Cloud Functions:
```
Firebase Console → Functions → Logs → importGoodreadsBooks
```

## Related Files

- Backend: `functions/src/index.ts` (importGoodreadsBooks function)
- Mobile: `mobile-app/app/import-goodreads.tsx`
- Mobile Settings: `mobile-app/app/(tabs)/settings.tsx`
- Web Modal: `web-app/src/components/GoodreadsImportModal.jsx`
- Web Styles: `web-app/src/styles/goodreads-import-modal.css`
- Web Dashboard: `web-app/src/components/TilingDashboard.jsx`
- Tests: `functions/src/goodreads-import.test.ts`
- Config: `functions/jest.config.js`
- Package: `functions/package.json`
