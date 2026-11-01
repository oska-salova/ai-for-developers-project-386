import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Meetings from "./meetings/page";

describe("/meetings", () => {
  it("shows a placeholder with the section title", () => {
    render(<Meetings />);

    expect(screen.getByRole("heading", { level: 1, name: "Встречи" })).toBeInTheDocument();
    expect(screen.getByText("Раздел в разработке")).toBeInTheDocument();
  });
});
