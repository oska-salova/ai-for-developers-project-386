import {
  type CallCalendarClientContext,
  type CallCalendarClientOptions,
  createCallCalendarClientContext,
} from "./api/callCalendarClientContext.js";
import {
  createMeetingTypesClientContext,
  type MeetingTypesClientContext,
  type MeetingTypesClientOptions,
} from "./api/meetingTypesClient/meetingTypesClientContext.js";
import {
  list,
  type ListOptions,
} from "./api/meetingTypesClient/meetingTypesClientOperations.js";

export class CallCalendarClient {
  #context: CallCalendarClientContext
  meetingTypesClient: MeetingTypesClient
  constructor(options?: CallCalendarClientOptions) {
    this.#context = createCallCalendarClientContext(options);
    this.meetingTypesClient = new MeetingTypesClient(options);
  }
}
export class MeetingTypesClient {
  #context: MeetingTypesClientContext
  constructor(options?: MeetingTypesClientOptions) {
    this.#context = createMeetingTypesClientContext(options);

  }
  async list(options?: ListOptions) {
    return list(this.#context, options);
  }
}
