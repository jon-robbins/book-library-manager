import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import '../styles/goodreads-import-modal.css';

/**
 * GoodreadsImportModal - Modal dialog for importing Goodreads CSV exports
 * Handles file upload, CSV parsing, and import status
 */
export default function GoodreadsImportModal({ isOpen, onClose }) {
  const [csvData, setCsvData] = useState('');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCsvData(text);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      setError('Please provide CSV data or select a file');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const functions = getFunctions();
      const importGoodreadsBooks = httpsCallable(
        functions,
        'importGoodreadsBooks'
      );

      const result = await importGoodreadsBooks({ csv: csvData });
      setImportResult(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCsvData('');
    setImportResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="goodreads-import-overlay" onClick={handleReset}>
      <div
        className="goodreads-import-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {importResult ? (
          <ResultView result={importResult} onClose={handleReset} />
        ) : (
          <ImportForm
            csvData={csvData}
            setCsvData={setCsvData}
            onFileChange={handleFileChange}
            onImport={handleImport}
            loading={loading}
            error={error}
            onClose={handleReset}
          />
        )}
      </div>
    </div>
  );
}

function ImportForm({
  csvData,
  setCsvData,
  onFileChange,
  onImport,
  loading,
  error,
  onClose,
}) {
  return (
    <div className="import-form">
      <div className="modal-header">
        <h2>Import from Goodreads</h2>
        <button className="close-btn" onClick={onClose} disabled={loading}>
          ✕
        </button>
      </div>

      <div className="modal-body">
        <div className="instructions-section">
          <h3>Instructions</h3>
          <ol>
            <li>Go to goodreads.com/review/import</li>
            <li>Export your library as CSV</li>
            <li>Upload or paste the CSV file below</li>
          </ol>
        </div>

        <div className="file-section">
          <label htmlFor="csv-file" className="file-label">
            Select CSV File
          </label>
          <input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={onFileChange}
            disabled={loading}
            className="file-input"
          />
        </div>

        <div className="or-divider">or</div>

        <div className="textarea-section">
          <label htmlFor="csv-textarea" className="textarea-label">
            Paste CSV Data
          </label>
          <textarea
            id="csv-textarea"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="Paste CSV data here..."
            disabled={loading}
            className="csv-textarea"
            rows={8}
          />
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="modal-footer">
        <button
          className="btn btn-secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={onImport}
          disabled={loading || !csvData.trim()}
        >
          {loading ? 'Importing...' : 'Import Books'}
        </button>
      </div>
    </div>
  );
}

function ResultView({ result, onClose }) {
  return (
    <div className="import-result">
      <div className="modal-header">
        <h2>Import Complete</h2>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="modal-body">
        <div className="stats-grid">
          <StatCard
            label="Total Processed"
            value={result.totalProcessed}
            color="blue"
          />
          <StatCard
            label="Successful"
            value={result.successCount}
            color="green"
          />
          <StatCard
            label="Skipped"
            value={result.skippedCount}
            color="orange"
          />
          <StatCard
            label="Failed"
            value={result.errorCount}
            color={result.errorCount > 0 ? 'red' : 'green'}
          />
        </div>

        {result.errors.length > 0 && (
          <div className="errors-section">
            <h3>Errors</h3>
            <ul className="error-list">
              {result.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="results-section">
          <h3>Import Details ({result.results.length} entries)</h3>
          <div className="results-list">
            {result.results.map((entry, idx) => (
              <ResultEntry key={idx} entry={entry} />
            ))}
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colorClass = `stat-${color}`;
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function ResultEntry({ entry }) {
  const statusClass = `status-${entry.status}`;
  return (
    <div className="result-entry">
      <div className="result-info">
        <div className="result-title">{entry.title}</div>
        <div className="result-author">{entry.author}</div>
        {entry.isbn && <div className="result-isbn">ISBN: {entry.isbn}</div>}
        {entry.reason && (
          <div className="result-reason">{entry.reason}</div>
        )}
      </div>
      <div className={`result-status ${statusClass}`}>
        {entry.status}
      </div>
    </div>
  );
}
