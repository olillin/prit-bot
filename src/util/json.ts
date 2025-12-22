export type JsonValue = string | number | boolean | JsonObject
export type JsonValueOrList = JsonValue | JsonValue[]
export interface JsonObject {
    [k: string]: JsonValueOrList
}
