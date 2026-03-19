import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  icon?: string;
  testID?: string;
}

/**
 * Inline error banner component for mobile
 * Displays error message at the top of content when partial data is available
 */
export default function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  icon = "⚠️",
  testID = "error-banner",
}: ErrorBannerProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} testID={`${testID}-retry`}>
            <Text style={styles.retryLink}>Retry</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} testID={`${testID}-dismiss`}>
            <Text style={styles.dismissLink}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  message: {
    flex: 1,
    color: "#856404",
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginLeft: 8,
  },
  retryLink: {
    color: "#007AFF",
    fontSize: 13,
    fontWeight: "600",
  },
  dismissLink: {
    color: "#999",
    fontSize: 13,
    fontWeight: "600",
  },
});
