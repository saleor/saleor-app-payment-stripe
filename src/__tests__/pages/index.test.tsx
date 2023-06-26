import { render, screen } from "@testing-library/react";
import { expect, vi, describe, it } from "vitest";
import IndexPage from "../../pages";

vi.mock("@saleor/app-sdk/app-bridge", () => {
  return {
    useAppBridge: () => ({
      appBridgeState: {},
      appBridge: {},
    }),
  };
});

vi.mock("next/router", () => ({
  useRouter: vi.fn(),
}));

describe("App", () => {
  it("renders text", () => {
    render(<IndexPage />);

    expect(
      screen.getByText("Install this app in your Saleor Dashboard", { exact: false }),
    ).toBeInTheDocument();
  });
});
