/**
 * A explicit success/failure value.
 *
 * Publishing to third-party networks fails constantly and in ways that are
 * entirely routine — expired tokens, rate limits, a platform rejecting a video
 * codec. Those are values to be handled, not exceptions to be thrown, so the
 * publish pipeline is forced to deal with each one at the call site.
 *
 * Thrown exceptions remain reserved for genuine programmer error.
 */
export type Result<T, E> = Ok<T> | Err<E>;

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function isOk<T, E>(r: Result<T, E>): r is Ok<T> {
  return r.ok;
}

export function isErr<T, E>(r: Result<T, E>): r is Err<E> {
  return !r.ok;
}

/** Apply `fn` to a success value, leaving failures untouched. */
export function mapResult<T, U, E>(r: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return r.ok ? ok(fn(r.value)) : r;
}

/** Apply `fn` to a failure value, leaving successes untouched. */
export function mapErr<T, E, F>(r: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return r.ok ? r : err(fn(r.error));
}

/** Unwrap a success value, falling back to `fallback` on failure. */
export function unwrapOr<T, E>(r: Result<T, E>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

/**
 * Partition a batch of results.
 *
 * A single post fans out to many networks and they fail independently — one
 * network rejecting a video must never discard the successes elsewhere.
 */
export function partitionResults<T, E>(results: readonly Result<T, E>[]): {
  values: T[];
  errors: E[];
} {
  const values: T[] = [];
  const errors: E[] = [];
  for (const r of results) {
    if (r.ok) values.push(r.value);
    else errors.push(r.error);
  }
  return { values, errors };
}
