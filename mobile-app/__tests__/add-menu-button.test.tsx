import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import AddMenuButton from "@/components/AddMenuButton";
import { useRouter } from "expo-router";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

describe("AddMenuButton", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it("opens menu and navigates to scan", () => {
    const { getByText, queryByText } = render(<AddMenuButton />);

    expect(queryByText("Scan Barcode")).toBeNull();
    fireEvent.press(getByText("+"));
    fireEvent.press(getByText("Scan Barcode"));

    expect(mockPush).toHaveBeenCalledWith("/scan");
  });

  it("opens menu and navigates to manual entry", () => {
    const { getByText } = render(<AddMenuButton />);

    fireEvent.press(getByText("+"));
    fireEvent.press(getByText("Manual entry"));

    expect(mockPush).toHaveBeenCalledWith("/add");
  });
});
