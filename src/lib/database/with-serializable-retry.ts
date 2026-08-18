export type SerializableRetryContext = Readonly<{
  attempt: number
  operationKey: string
}>

export type SerializableRetryOptions = Readonly<{
  operationKey: string
  maxAttempts?: number
  baseDelayMs?: number
  onRetry?: (context: SerializableRetryContext, error: unknown) => void | Promise<void>
  sleep?: (milliseconds: number) => Promise<void>
}>

type ErrorLike = {
  code?: unknown
  originalCode?: unknown
  meta?: ErrorLike
  cause?: ErrorLike
  driverAdapterError?: ErrorLike
}

function asErrorLike(error: unknown): ErrorLike {
  return typeof error === "object" && error !== null ? (error as ErrorLike) : {}
}

export function isSerializableConflict(error: unknown): boolean {
  const codes: unknown[] = []
  const pending = [error]
  const visited = new Set<object>()

  while (pending.length > 0) {
    const raw = pending.pop()

    if (typeof raw !== "object" || raw === null || visited.has(raw)) {
      continue
    }

    const candidate = asErrorLike(raw)
    visited.add(raw)
    codes.push(candidate.code, candidate.originalCode)
    pending.push(candidate.cause, candidate.meta, candidate.driverAdapterError)
  }

  return codes.some((code) => code === "P2034" || code === "40001" || code === "40P01")
}

export async function withSerializableRetry<T>(
  operation: (context: SerializableRetryContext) => Promise<T>,
  options: SerializableRetryOptions,
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3
  const baseDelayMs = options.baseDelayMs ?? 25
  const sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)))

  if (!options.operationKey.trim()) {
    throw new Error("Serializable retry requires a non-empty operation key")
  }

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error("Serializable retry maxAttempts must be a positive integer")
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const context = Object.freeze({ attempt, operationKey: options.operationKey })

    try {
      return await operation(context)
    } catch (error) {
      if (!isSerializableConflict(error) || attempt === maxAttempts) {
        throw error
      }

      await options.onRetry?.(context, error)
      await sleep(baseDelayMs * 2 ** (attempt - 1))
    }
  }

  throw new Error("Serializable retry exhausted without a result")
}
