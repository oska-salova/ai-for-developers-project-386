import { createCallCalendarClientContext, } from "./api/callCalendarClientContext.js";
import { createMeetingTypesClientContext, } from "./api/meetingTypesClient/meetingTypesClientContext.js";
import { list, } from "./api/meetingTypesClient/meetingTypesClientOperations.js";
export class CallCalendarClient {
    #context;
    meetingTypesClient;
    constructor(options) {
        this.#context = createCallCalendarClientContext(options);
        this.meetingTypesClient = new MeetingTypesClient(options);
    }
}
export class MeetingTypesClient {
    #context;
    constructor(options) {
        this.#context = createMeetingTypesClientContext(options);
    }
    async list(options) {
        return list(this.#context, options);
    }
}
