import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionPlaceholder } from "./section-placeholder";

describe("SectionPlaceholder", () => {
  it("names the section and says it is not built yet", () => {
    render(<SectionPlaceholder title="Типы встреч" />);

    expect(screen.getByRole("heading", { level: 1, name: "Типы встреч" })).toBeInTheDocument();
    expect(screen.getByText("Раздел в разработке")).toBeInTheDocument();
  });
});
