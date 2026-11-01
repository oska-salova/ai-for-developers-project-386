import { parse } from "uri-template";
import { MeetingTypesClientContext } from "./meetingTypesClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import {
  jsonCreateMeetingTypeRequestToTransportTransform,
  jsonErrorBodyEnvelopeToApplicationTransform,
  jsonMeetingTypeCreatedBodyToApplicationTransform,
  jsonMeetingTypeListToApplicationTransform,
} from "../../models/internal/serializers.js";
import {
  CreateMeetingTypeRequest,
  type ErrorBodyEnvelope,
  type MeetingTypeCreatedBody,
  type MeetingTypeList,
} from "../../models/models.js";

export interface ListOptions extends OperationOptions {}
/**
 * Список типов встреч владельца.
 *
 * @param {MeetingTypesClientContext} client
 * @param {ListOptions} [options]
 */
export async function list(
  client: MeetingTypesClientContext,
  options?: ListOptions,
): Promise<MeetingTypeList | ErrorBodyEnvelope> {
  const path = parse("/api/meeting-types").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonMeetingTypeListToApplicationTransform(response.body)!;
  }
  if (+response.status === 404 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorBodyEnvelopeToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface CreateOptions extends OperationOptions {}
/**
 * Создание типа встречи.
 *
 * @param {MeetingTypesClientContext} client
 * @param {CreateMeetingTypeRequest} body
 * @param {CreateOptions} [options]
 */
export async function create(
  client: MeetingTypesClientContext,
  body: CreateMeetingTypeRequest,
  options?: CreateOptions,
): Promise<MeetingTypeCreatedBody | ErrorBodyEnvelope> {
  const path = parse("/api/meeting-types").expand({});
  const httpRequestOptions = {
    headers: {},body: jsonCreateMeetingTypeRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);


  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return jsonMeetingTypeCreatedBodyToApplicationTransform(response.body)!;
  }
  if (+response.status === 400 && response.headers["content-type"]?.includes("application/json")) {
    return jsonErrorBodyEnvelopeToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
