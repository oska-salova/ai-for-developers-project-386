import "@typespec/http";
import "@typespec/openapi";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service(#{ title: "Календарь звонков" })
@server("http://localhost:3001", "Локальный сервер")
namespace CallCalendar;

/** Поле, значение которого не прошло валидацию. */
model ErrorField {
  /** Имя поля тела запроса. */
  field: string;
  /** Сообщение об ошибке, которое интерфейс показывает дословно. */
  message: string;
}

/** Машиночитаемый код и текст ошибки. */
model ErrorBody {
  /** Один из кодов: validation_error, not_found, slot_conflict, internal_error. */
  code: string;
  message: string;
  /** Неверные поля запроса; заполняется только для validation_error. */
  fields?: ErrorField[];
}

/** Единая рамка ошибок API. */
model ErrorBodyEnvelope {
  error: ErrorBody;
}

/** Шаблон бронирования: что владелец предлагает гостю. */
model MeetingType {
  id: string;
  name: string;
  description: string;
  durationMinutes: int32;
}

/** Ответ со списком типов встреч. */
model MeetingTypeList {
  meetingTypes: MeetingType[];
}

/** Поля, которые владелец присылает при создании типа встречи. */
model CreateMeetingTypeRequest {
  name: string;
  description?: string;
  durationMinutes: int32;
}

/** Тело успешного ответа на создание типа встречи. */
model MeetingTypeCreatedBody {
  meetingType: MeetingType;
}

/** Успешный ответ со списком типов встреч. */
model MeetingTypesOkResponse {
  @statusCode statusCode: 200;
  @header("content-type") contentType: "application/json";
  @body body: MeetingTypeList;
}

/** Успешный ответ на создание типа встречи. */
model MeetingTypeCreatedResponse {
  @statusCode statusCode: 201;
  @header("content-type") contentType: "application/json";
  @body body: MeetingTypeCreatedBody;
}

/** Границы окна записи в календарных днях владельца. */
model SlotWindow {
  /** Первый день окна, YYYY-MM-DD в зоне владельца. */
  start: string;
  /** Последний день окна включительно, YYYY-MM-DD в зоне владельца. */
  end: string;
}

/** Старт встречи в сетке слотов. */
model Slot {
  /** Мгновение начала в ISO 8601 UTC с суффиксом Z. */
  start: string;
  /** Можно ли записаться на этот старт. */
  available: boolean;
}

/** Полная сетка стартов одного календарного дня владельца. */
model SlotDay {
  /** Календарный день владельца, YYYY-MM-DD. */
  date: string;
  /** Старты каждые 15 минут с 09:00 по 17:45. */
  slots: Slot[];
}

/** Окно записи, часовой пояс владельца и дни с полной сеткой стартов. */
model SlotsEnvelope {
  window: SlotWindow;
  /** Часовая зона владельца: Europe/Moscow. */
  timezone: string;
  /** Ровно 14 дней окна, начиная с сегодняшнего. */
  days: SlotDay[];
}

/** Успешный ответ с сеткой слотов типа встречи. */
model SlotsOkResponse {
  @statusCode statusCode: 200;
  @header("content-type") contentType: "application/json";
  @body body: SlotsEnvelope;
}

/** Ответ на запрос, поля которого не прошли проверку. */
model ValidationErrorResponse {
  @statusCode statusCode: 400;
  @header("content-type") contentType: "application/json";
  @body body: ErrorBodyEnvelope;
}

/** Ответ на неизвестный маршрут или отсутствующий ресурс. */
model NotFoundResponse {
  @statusCode statusCode: 404;
  @header("content-type") contentType: "application/json";
  @body body: ErrorBodyEnvelope;
}

@route("/api/meeting-types")
interface MeetingTypes {
  /** Список типов встреч владельца. */
  @get
  list(): MeetingTypesOkResponse | NotFoundResponse;

  /** Создание типа встречи. */
  @post
  create(@body body: CreateMeetingTypeRequest):
    MeetingTypeCreatedResponse | ValidationErrorResponse;

  /** Полная сетка слотов типа встречи на окно записи. */
  @get
  @route("/{id}/slots")
  slots(@path id: string): SlotsOkResponse | NotFoundResponse;
}
