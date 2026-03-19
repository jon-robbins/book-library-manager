/**
 * TLA-18: Error and empty states
 * Tests for standardized error and empty state components
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";

describe("ErrorState Component", () => {
  it("should render error message", () => {
    render(
      <ErrorState
        title="Test Error"
        message="This is a test error message"
        testID="error-state"
      />
    );

    expect(screen.getByText("Test Error")).toBeTruthy();
    expect(screen.getByText("This is a test error message")).toBeTruthy();
  });

  it("should render default title if not provided", () => {
    render(
      <ErrorState message="Error occurred" testID="error-state" />
    );

    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });

  it("should render retry button when onRetry is provided", () => {
    const mockRetry = jest.fn();
    render(
      <ErrorState
        message="Error occurred"
        onRetry={mockRetry}
        testID="error-state"
      />
    );

    const retryButton = screen.getByTestId("error-state-retry");
    fireEvent.press(retryButton);
    expect(mockRetry).toHaveBeenCalled();
  });

  it("should not render retry button when onRetry is not provided", () => {
    render(
      <ErrorState message="Error occurred" testID="error-state" />
    );

    expect(screen.queryByTestId("error-state-retry")).toBeNull();
  });

  it("should display custom icon", () => {
    render(
      <ErrorState
        message="Error occurred"
        icon="🚨"
        testID="error-state"
      />
    );

    expect(screen.getByText("🚨")).toBeTruthy();
  });
});

describe("EmptyState Component", () => {
  it("should render title and subtitle", () => {
    render(
      <EmptyState
        title="No items"
        subtitle="Add your first item"
        testID="empty-state"
      />
    );

    expect(screen.getByText("No items")).toBeTruthy();
    expect(screen.getByText("Add your first item")).toBeTruthy();
  });

  it("should display custom icon", () => {
    render(
      <EmptyState
        title="No items"
        icon="📭"
        testID="empty-state"
      />
    );

    expect(screen.getByText("📭")).toBeTruthy();
  });

  it("should render action button when provided", () => {
    const mockAction = jest.fn();
    render(
      <EmptyState
        title="No items"
        actionLabel="Add item"
        onAction={mockAction}
        testID="empty-state"
      />
    );

    const actionButton = screen.getByTestId("empty-state-action");
    fireEvent.press(actionButton);
    expect(mockAction).toHaveBeenCalled();
  });

  it("should not render action button when not provided", () => {
    render(
      <EmptyState title="No items" testID="empty-state" />
    );

    expect(screen.queryByTestId("empty-state-action")).toBeNull();
  });

  it("should use default icon if not provided", () => {
    render(
      <EmptyState title="No items" testID="empty-state" />
    );

    expect(screen.getByText("📚")).toBeTruthy();
  });
});

describe("ErrorBanner Component", () => {
  it("should render error message", () => {
    render(
      <ErrorBanner message="Warning: Something happened" testID="error-banner" />
    );

    expect(screen.getByText("Warning: Something happened")).toBeTruthy();
  });

  it("should render retry button when provided", () => {
    const mockRetry = jest.fn();
    render(
      <ErrorBanner
        message="Error occurred"
        onRetry={mockRetry}
        testID="error-banner"
      />
    );

    const retryButton = screen.getByTestId("error-banner-retry");
    fireEvent.press(retryButton);
    expect(mockRetry).toHaveBeenCalled();
  });

  it("should render dismiss button when provided", () => {
    const mockDismiss = jest.fn();
    render(
      <ErrorBanner
        message="Error occurred"
        onDismiss={mockDismiss}
        testID="error-banner"
      />
    );

    const dismissButton = screen.getByTestId("error-banner-dismiss");
    fireEvent.press(dismissButton);
    expect(mockDismiss).toHaveBeenCalled();
  });

  it("should render both buttons when both callbacks provided", () => {
    const mockRetry = jest.fn();
    const mockDismiss = jest.fn();
    render(
      <ErrorBanner
        message="Error occurred"
        onRetry={mockRetry}
        onDismiss={mockDismiss}
        testID="error-banner"
      />
    );

    expect(screen.getByTestId("error-banner-retry")).toBeTruthy();
    expect(screen.getByTestId("error-banner-dismiss")).toBeTruthy();
  });

  it("should display custom icon", () => {
    render(
      <ErrorBanner
        message="Error occurred"
        icon="⚡"
        testID="error-banner"
      />
    );

    expect(screen.getByText("⚡")).toBeTruthy();
  });
});
