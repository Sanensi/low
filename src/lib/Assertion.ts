export function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg ?? "Assertion Error");
  }
}

export function throwError(msg?: string): never {
  throw new Error(msg);
}
