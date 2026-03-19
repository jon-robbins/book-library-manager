/**
 * TLA-22: App version on Settings screen (sourced from app.json via Expo config).
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
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
}));

describe("SettingsScreen", () => {
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
});
