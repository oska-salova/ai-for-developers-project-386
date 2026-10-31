import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Booking from "./booking/page";
import MeetingTypes from "./meeting-types/page";
import Meetings from "./meetings/page";

describe.each([
  { route: "/booking", Page: Booking, title: "Запись на встречу" },
  { route: "/meeting-types", Page: MeetingTypes, title: "Типы встреч" },
  { route: "/meetings", Page: Meetings, title: "Встречи" },
])("$route", ({ Page, title }) => {
  it("shows a placeholder with the section title", () => {
    render(<Page />);

    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByText("Раздел в разработке")).toBeInTheDocument();
  });
});
