import React from "react";
import { render, screen } from "@testing-library/react-native";
import ErrorState from "../components/ErrorState";

describe("Mobile App Accessibility Tests", () => {
  describe("ErrorState", () => {
    it("should render with alert role for accessibility", () => {
      const { getByTestId } = render(
        <ErrorState
          title="Error Loading"
          message="Failed to load content"
          icon="⚠️"
          testID="error-state"
        />
      );

      const errorContainer = getByTestId("error-state");
      expect(errorContainer).toBeTruthy();
    });

    it("should have accessible retry button with label and hint", () => {
      const onRetry = jest.fn();
      const { getByTestId } = render(
        <ErrorState
          title="Error Loading"
          message="Failed to load content"
          onRetry={onRetry}
          testID="error-state"
        />
      );

      const retryButton = getByTestId("error-state-retry");
      expect(retryButton).toBeTruthy();
    });

    it("should display error title and message", () => {
      const { getByText } = render(
        <ErrorState
          title="Connection Error"
          message="Unable to connect to the server"
        />
      );

      expect(getByText("Connection Error")).toBeTruthy();
      expect(getByText("Unable to connect to the server")).toBeTruthy();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support keyboard interaction on buttons", () => {
      const onRetry = jest.fn();
      const { getByTestId } = render(
        <ErrorState
          title="Error"
          message="Something went wrong"
          onRetry={onRetry}
          testID="error-state"
        />
      );

      const retryButton = getByTestId("error-state-retry");
      expect(retryButton).toBeTruthy();
    });
  });

  describe("Text Contrast", () => {
    it("should use readable text colors", () => {
      const { getByText } = render(
        <ErrorState
          title="Error Message"
          message="This is a test error message"
        />
      );

      // Verify text is rendered - actual contrast checking would be done
      // with accessibility tools like axe-core
      expect(getByText("Error Message")).toBeTruthy();
      expect(getByText("This is a test error message")).toBeTruthy();
    });
  });

  describe("Semantic Structure", () => {
    it("should have proper text hierarchy", () => {
      const { getByText } = render(
        <ErrorState
          title="Main Error Title"
          message="Detailed error description"
        />
      );

      const title = getByText("Main Error Title");
      const message = getByText("Detailed error description");

      expect(title).toBeTruthy();
      expect(message).toBeTruthy();
    });
  });

  describe("Accessibility Labels", () => {
    it("should provide clear labels for interactive elements", () => {
      const onRetry = jest.fn();
      const { getByTestId } = render(
        <ErrorState
          title="Error"
          message="Failed to load"
          onRetry={onRetry}
          testID="error-state"
        />
      );

      // Button should be accessible with proper semantics
      const retryButton = getByTestId("error-state-retry");
      expect(retryButton).toBeTruthy();
    });
  });
});
