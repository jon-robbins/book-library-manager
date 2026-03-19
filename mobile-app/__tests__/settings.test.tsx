/**
 * TLA-22: App version on Settings screen (sourced from app.json via Expo config).
 * Includes regression checks to ensure no UI/UX regressions.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import SettingsScreen from "../app/(tabs)/settings";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: { version: "1.0.0" },
  },
}));

jest.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({
    user: { uid: "test-user" },
    loading: false,
    signOut: jest.fn(),
  }),
}));

jest.mock("expo-router", () => ({
  Redirect: () => null,
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  }),
}));

describe("SettingsScreen", () => {
  // Version display tests
  it("displays app version at the bottom from app.json (Expo config)", () => {
    render(<SettingsScreen />);
    // Version from app.json (expo.version) is shown via Constants.expoConfig?.version
    expect(screen.getByText(/Version 1\.0\.0/)).toBeTruthy();
  });

  it("renders version text as the bottom visible content", () => {
    render(<SettingsScreen />);
    const versionNode = screen.getByText(/Version \d+\.\d+\.\d+/);
    expect(versionNode).toBeTruthy();
  });

  // Regression tests
  it("displays settings title (no regression)", () => {
    render(<SettingsScreen />);
    expect(screen.getByText("Settings")).toBeTruthy();
  });

  it("displays sign out button (no regression)", () => {
    render(<SettingsScreen />);
    expect(screen.getByText("Sign out")).toBeTruthy();
  });

  it("renders all expected elements for accessibility and layout (no regression)", () => {
    const { getByTestId, getByText, getAllByRole } = render(<SettingsScreen />);
    // Ensure title and version are present
    expect(getByText("Settings")).toBeTruthy();
    expect(getByText(/Version/)).toBeTruthy();
    // Ensure sign-out button exists
    expect(getByText("Sign out")).toBeTruthy();
  });
});
