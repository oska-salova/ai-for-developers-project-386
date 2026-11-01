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
  create,
  type CreateOptions,
  list,
  type ListOptions,
  slots,
  type SlotsOptions,
} from "./api/meetingTypesClient/meetingTypesClientOperations.js";
import type { CreateMeetingTypeRequest } from "./models/models.js";

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
  };
  async create(body: CreateMeetingTypeRequest, options?: CreateOptions) {
    return create(this.#context, body, options);
  };
  async slots(id: string, options?: SlotsOptions) {
    return slots(this.#context, id, options);
  }
}
