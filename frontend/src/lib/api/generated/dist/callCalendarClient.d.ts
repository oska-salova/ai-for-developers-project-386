import { type CallCalendarClientOptions } from "./api/callCalendarClientContext.js";
import { type MeetingTypesClientOptions } from "./api/meetingTypesClient/meetingTypesClientContext.js";
import { type CreateOptions, type ListOptions, type SlotsOptions } from "./api/meetingTypesClient/meetingTypesClientOperations.js";
import type { CreateMeetingTypeRequest } from "./models/models.js";
export declare class CallCalendarClient {
    #private;
    meetingTypesClient: MeetingTypesClient;
    constructor(options?: CallCalendarClientOptions);
}
export declare class MeetingTypesClient {
    #private;
    constructor(options?: MeetingTypesClientOptions);
    list(options?: ListOptions): Promise<import("./models/models.js").MeetingTypeList | import("./models/models.js").ErrorBodyEnvelope>;
    create(body: CreateMeetingTypeRequest, options?: CreateOptions): Promise<import("./models/models.js").ErrorBodyEnvelope | import("./models/models.js").MeetingTypeCreatedBody>;
    slots(id: string, options?: SlotsOptions): Promise<import("./models/models.js").ErrorBodyEnvelope | import("./models/models.js").SlotsEnvelope>;
}
