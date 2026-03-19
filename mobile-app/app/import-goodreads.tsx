import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/components/AuthProvider";
import * as DocumentPicker from "expo-document-picker";
import { getFunctions, httpsCallable } from "firebase/functions";

interface ImportResult {
  title: string;
  author: string;
  isbn: string | null;
  status: "success" | "skipped" | "error";
  reason?: string;
}

interface GoodreadsImportResponse {
  totalProcessed: number;
  successCount: number;
  skippedCount: number;
  errorCount: number;
  results: ImportResult[];
  errors: string[];
}

export default function ImportGoodreadsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [csvData, setCsvData] = useState("");
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<GoodreadsImportResponse | null>(null);

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        // Read file content
        const response = await fetch(fileUri);
        const text = await response.text();
        setCsvData(text);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select file");
    }
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      Alert.alert("Error", "Please provide CSV data or select a file");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be signed in to import books");
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions();
      const importGoodreadsBooks = httpsCallable<
        { csv: string },
        GoodreadsImportResponse
      >(functions, "importGoodreadsBooks");

      const result = await importGoodreadsBooks({ csv: csvData });
      setImportResult(result.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      Alert.alert("Import Error", message);
    } finally {
      setLoading(false);
    }
  };

  if (importResult) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.resultHeader}>
          <Text style={styles.title}>Import Complete</Text>
        </View>

        <View style={styles.statsContainer}>
          <StatBox
            label="Total Processed"
            value={importResult.totalProcessed.toString()}
          />
          <StatBox
            label="Successful"
            value={importResult.successCount.toString()}
            color="#4CAF50"
          />
          <StatBox
            label="Skipped"
            value={importResult.skippedCount.toString()}
            color="#FF9800"
          />
          <StatBox
            label="Failed"
            value={importResult.errorCount.toString()}
            color={importResult.errorCount > 0 ? "#F44336" : "#4CAF50"}
          />
        </View>

        {importResult.errors.length > 0 && (
          <View style={styles.errorsSection}>
            <Text style={styles.sectionTitle}>Errors</Text>
            {importResult.errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                • {error}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Details</Text>
          <ScrollView
            style={styles.resultsList}
            nestedScrollEnabled={true}
          >
            {importResult.results.map((result, index) => (
              <ResultRow key={index} result={result} />
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            setImportResult(null);
            setCsvData("");
            router.back();
          }}
        >
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Import from Goodreads</Text>
        <Text style={styles.subtitle}>
          Export your Goodreads library and import it here
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructionText}>
          1. Go to goodreads.com/review/import
        </Text>
        <Text style={styles.instructionText}>
          2. Export your library as CSV
        </Text>
        <Text style={styles.instructionText}>
          3. Paste or upload the CSV file below
        </Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleFileSelect}
        >
          <Text style={styles.buttonText}>Select CSV File</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>or</Text>

        <TextInput
          style={styles.csvInput}
          placeholder="Paste CSV data here..."
          multiline={true}
          numberOfLines={8}
          value={csvData}
          onChangeText={setCsvData}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleImport}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Import Books</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatBox({
  label,
  value,
  color = "#2196F3",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={[styles.statBox, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ResultRow({
  result,
}: {
  result: ImportResult;
}) {
  const statusColor =
    result.status === "success"
      ? "#4CAF50"
      : result.status === "skipped"
        ? "#FF9800"
        : "#F44336";

  return (
    <View style={styles.resultRow}>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {result.title}
        </Text>
        <Text style={styles.resultAuthor} numberOfLines={1}>
          {result.author}
        </Text>
        {result.isbn && (
          <Text style={styles.resultIsbn}>{result.isbn}</Text>
        )}
        {result.reason && (
          <Text style={styles.resultReason}>{result.reason}</Text>
        )}
      </View>
      <View
        style={[styles.statusBadge, { backgroundColor: statusColor }]}
      >
        <Text style={styles.statusText}>
          {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
    lineHeight: 20,
  },
  csvInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "monospace",
    backgroundColor: "#f9f9f9",
    minHeight: 120,
    textAlignVertical: "top",
  },
  primaryButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: "#666",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    marginBottom: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  orText: {
    textAlign: "center",
    color: "#999",
    marginVertical: 12,
  },
  resultHeader: {
    marginBottom: 20,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statBox: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  errorsSection: {
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#856404",
    marginBottom: 6,
  },
  detailsSection: {
    marginBottom: 20,
  },
  resultsList: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    paddingHorizontal: 0,
  },
  resultRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
  },
  resultAuthor: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  resultIsbn: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  resultReason: {
    fontSize: 11,
    color: "#F44336",
    marginTop: 2,
    fontStyle: "italic",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
});
