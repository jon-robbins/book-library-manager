import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  icon?: string;
  testID?: string;
}

/**
 * Standardized error state component for mobile
 * Displays error message with optional retry button
 */
export default function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  icon = "⚠️",
  testID = "error-state",
}: ErrorStateProps) {
  return (
    <View style={styles.container} testID={testID} accessible={true} accessibilityRole="alert">
      <Text style={styles.icon} accessible={false}>{icon}</Text>
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={styles.button}
          onPress={onRetry}
          testID={`${testID}-retry`}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Try Again"
          accessibilityHint="Retry loading the content"
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
