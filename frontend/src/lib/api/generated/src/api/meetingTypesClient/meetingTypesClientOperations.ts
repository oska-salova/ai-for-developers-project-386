import { parse } from "uri-template";
import { MeetingTypesClientContext } from "./meetingTypesClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import {
  jsonErrorBodyEnvelopeToApplicationTransform,
  jsonMeetingTypeListToApplicationTransform,
} from "../../models/internal/serializers.js";
import type {
  ErrorBodyEnvelope,
  MeetingTypeList,
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
