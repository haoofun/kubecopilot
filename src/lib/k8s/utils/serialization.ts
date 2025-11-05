export function toSerializable<T>(value: T): T {
  return value == null ? value : (JSON.parse(JSON.stringify(value)) as T)
}
