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

/** A booked interval in the owner's calendar. */
export interface Meeting {
  id: string;
  meetingTypeId: string;
  start: Date;
  guestName: string;
  guestEmail: string;
}

/** Meetings the store starts with, so tests can pin busy intervals. */
export interface StoreSeed {
  meetings?: readonly Meeting[];
}

/**
 * Synchronous in-memory storage for meeting types and meetings. Every method
 * returns before the caller regains control, which is what later tickets rely
 * on to make a booking check-and-insert atomic.
 */
export interface MeetingTypeStore {
  /** Newest first, so the owner sees a freshly created type on top. */
  listMeetingTypes(): MeetingType[];
  createMeetingType(input: NewMeetingType): MeetingType;
  findMeetingType(id: string): MeetingType | undefined;
  listMeetings(): Meeting[];
}

export function createStore(seed: StoreSeed = {}): MeetingTypeStore {
  const meetingTypes: MeetingType[] = [];
  const meetings: Meeting[] = [...(seed.meetings ?? [])];

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
    listMeetings() {
      return [...meetings];
    },
  };
}
