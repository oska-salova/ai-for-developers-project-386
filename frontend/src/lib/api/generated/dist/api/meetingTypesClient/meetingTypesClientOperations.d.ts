import { MeetingTypesClientContext } from "./meetingTypesClientContext.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import { CreateMeetingTypeRequest, type ErrorBodyEnvelope, type MeetingTypeCreatedBody, type MeetingTypeList } from "../../models/models.js";
export interface ListOptions extends OperationOptions {
}
/**
 * Список типов встреч владельца.
 *
 * @param {MeetingTypesClientContext} client
 * @param {ListOptions} [options]
 */
export declare function list(client: MeetingTypesClientContext, options?: ListOptions): Promise<MeetingTypeList | ErrorBodyEnvelope>;
export interface CreateOptions extends OperationOptions {
}
/**
 * Создание типа встречи.
 *
 * @param {MeetingTypesClientContext} client
 * @param {CreateMeetingTypeRequest} body
 * @param {CreateOptions} [options]
 */
export declare function create(client: MeetingTypesClientContext, body: CreateMeetingTypeRequest, options?: CreateOptions): Promise<MeetingTypeCreatedBody | ErrorBodyEnvelope>;
