import { randomUUID } from "node:crypto";
import type { components } from "./generated/openapi.js";

/** A booking template the owner offers, as described by the API contract. */
type MeetingType = components["schemas"]["MeetingType"];

/** The fields the owner supplies when creating a meeting type. */
export interface NewMeetingType {
  name: string;
  description: string;
  durationMinutes: number;
}

/**
 * Synchronous in-memory storage for meeting types. Every method returns before
 * the caller regains control, which is what later tickets rely on to make a
 * booking check-and-insert atomic.
 */
export interface MeetingTypeStore {
  /** Newest first, so the owner sees a freshly created type on top. */
  listMeetingTypes(): MeetingType[];
  createMeetingType(input: NewMeetingType): MeetingType;
  findMeetingType(id: string): MeetingType | undefined;
}

export function createStore(): MeetingTypeStore {
  const meetingTypes: MeetingType[] = [];

  return {
    listMeetingTypes() {
      return meetingTypes.toReversed();
    },
    createMeetingType(input) {
      const meetingType: MeetingType = { id: randomUUID(), ...input };
      meetingTypes.push(meetingType);

      return meetingType;
    },
    findMeetingType(id) {
      return meetingTypes.find((meetingType) => meetingType.id === id);
    },
  };
}
