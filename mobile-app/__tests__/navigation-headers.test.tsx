/**
 * TLA-17: Back button / header consistency.
 * Asserts layout options for headerBackTitle and title across root, auth, and add layouts.
 */
import React from "react";
import { render } from "@testing-library/react-native";

// Capture options passed to each Stack.Screen
const capturedScreens: Record<string, Record<string, unknown>> = {};

jest.mock("expo-router", () => {
  const React = require("react");
  const { View } = require("react-native");
  const MockStack = ({
    children,
    screenOptions: defaultOptions = {},
    ...rest
  }: {
    children: React.ReactNode;
    screenOptions?: Record<string, unknown>;
    [k: string]: unknown;
  }) => {
    React.Children.forEach(children, (child: React.ReactNode) => {
      const c = child as React.ReactElement<{ name?: string; options?: Record<string, unknown> }>;
      if (c?.props?.name) {
        capturedScreens[c.props.name] = {
          ...defaultOptions,
          ...c.props.options,
        };
      }
    });
    return React.createElement(View, { testID: "stack", ...rest }, children);
  };
  (MockStack as React.ComponentType & { Screen: React.ComponentType }).Screen = () => null;
  return { Stack: MockStack };
});

jest.mock("@/components/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../global.css", () => ({}));

import RootLayout from "../app/_layout";
import AuthLayout from "../app/(auth)/_layout";
import AddLayout from "../app/add/_layout";

describe("Navigation headers (TLA-17)", () => {
  beforeEach(() => {
    Object.keys(capturedScreens).forEach((k) => delete capturedScreens[k]);
  });

  describe("Root layout", () => {
    it("scan screen has headerBackTitle Home", () => {
      render(<RootLayout />);
      expect(capturedScreens["scan"]?.headerBackTitle).toBe("Home");
    });

    it("book/[id] screen has headerBackTitle Home", () => {
      render(<RootLayout />);
      expect(capturedScreens["book/[id]"]?.headerBackTitle).toBe("Home");
    });

    it("add screen has headerBackTitle Home", () => {
      render(<RootLayout />);
      expect(capturedScreens["add"]?.headerBackTitle).toBe("Home");
    });
  });

  describe("Auth layout", () => {
    it("signup screen has headerBackTitle Log in", () => {
      render(<AuthLayout />);
      expect(capturedScreens["signup"]?.headerBackTitle).toBe("Log in");
    });
  });

  describe("Add layout", () => {
    it("review screen has title Review Book (consistent casing)", () => {
      render(<AddLayout />);
      expect(capturedScreens["review"]?.title).toBe("Review Book");
    });

    it("details screen has title Enter Details (consistent casing)", () => {
      render(<AddLayout />);
      expect(capturedScreens["details"]?.title).toBe("Enter Details");
    });
  });
});
