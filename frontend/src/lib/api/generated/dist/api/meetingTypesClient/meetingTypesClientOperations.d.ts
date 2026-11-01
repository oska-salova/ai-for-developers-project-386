import { MeetingTypesClientContext } from "./meetingTypesClientContext.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import type { ErrorBodyEnvelope, MeetingTypeList } from "../../models/models.js";
export interface ListOptions extends OperationOptions {
}
/**
 * Список типов встреч владельца.
 *
 * @param {MeetingTypesClientContext} client
 * @param {ListOptions} [options]
 */
export declare function list(client: MeetingTypesClientContext, options?: ListOptions): Promise<MeetingTypeList | ErrorBodyEnvelope>;
