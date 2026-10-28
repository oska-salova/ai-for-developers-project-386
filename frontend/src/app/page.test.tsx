import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home page", () => {
  it("shows the service name and the booking action", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Календарь звонков" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Записаться" })).toBeInTheDocument();
  });
});
