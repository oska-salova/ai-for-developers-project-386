/**
 * A sequence of textual characters.
 */
export type String = string;
/**
 * Ответ со списком типов встреч.
 */
export interface MeetingTypeList {
    meetingTypes: Array<MeetingType>;
}
/**
 * Шаблон бронирования: что владелец предлагает гостю.
 */
export interface MeetingType {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
}
/**
 * A 32-bit integer. (`-2,147,483,648` to `2,147,483,647`)
 */
export type Int32 = number;
/**
 * A 64-bit integer. (`-9,223,372,036,854,775,808` to `9,223,372,036,854,775,807`)
 */
export type Int64 = bigint;
/**
 * A whole number. This represent any `integer` value possible.
 * It is commonly represented as `BigInteger` in some languages.
 */
export type Integer = number;
/**
 * A numeric type
 */
export type Numeric = number;
/**
 * Единая рамка ошибок API.
 */
export interface ErrorBodyEnvelope {
    error: ErrorBody;
}
/**
 * Машиночитаемый код и текст ошибки.
 */
export interface ErrorBody {
    /**
     * Один из кодов: validation_error, not_found, slot_conflict, internal_error.
     */
    code: string;
    message: string;
    /**
     * Неверные поля запроса; заполняется только для validation_error.
     */
    fields?: Array<ErrorField>;
}
/**
 * Поле, значение которого не прошло валидацию.
 */
export interface ErrorField {
    /**
     * Имя поля тела запроса.
     */
    field: string;
    /**
     * Сообщение об ошибке, которое интерфейс показывает дословно.
     */
    message: string;
}
/**
 * Поля, которые владелец присылает при создании типа встречи.
 */
export interface CreateMeetingTypeRequest {
    name: string;
    description?: string;
    durationMinutes: number;
}
/**
 * Тело успешного ответа на создание типа встречи.
 */
export interface MeetingTypeCreatedBody {
    meetingType: MeetingType;
}
