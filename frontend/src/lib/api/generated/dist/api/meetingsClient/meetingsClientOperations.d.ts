import { MeetingsClientContext } from "./meetingsClientContext.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import { CreateMeetingRequest, type ErrorBodyEnvelope, type MeetingCreatedBody } from "../../models/models.js";
export interface CreateOptions extends OperationOptions {
}
/**
 * Запись гостя на свободный слот.
 *
 * @param {MeetingsClientContext} client
 * @param {CreateMeetingRequest} body
 * @param {CreateOptions} [options]
 */
export declare function create(client: MeetingsClientContext, body: CreateMeetingRequest, options?: CreateOptions): Promise<MeetingCreatedBody | ErrorBodyEnvelope>;
