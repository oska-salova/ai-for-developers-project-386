import { type CallCalendarClientOptions } from "./api/callCalendarClientContext.js";
import { type MeetingTypesClientOptions } from "./api/meetingTypesClient/meetingTypesClientContext.js";
import { type ListOptions } from "./api/meetingTypesClient/meetingTypesClientOperations.js";
export declare class CallCalendarClient {
    #private;
    meetingTypesClient: MeetingTypesClient;
    constructor(options?: CallCalendarClientOptions);
}
export declare class MeetingTypesClient {
    #private;
    constructor(options?: MeetingTypesClientOptions);
    list(options?: ListOptions): Promise<import("./index.js").MeetingTypeList | import("./index.js").ErrorBodyEnvelope>;
}
