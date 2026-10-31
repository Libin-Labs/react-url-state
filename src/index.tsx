'use client';
import { useEffect, useRef, useState } from 'react';
export interface Param<T> {
  parse(raw: string | null): T;
  serialize(value: T): string | null;
}
export const stringParam = (fallback = '', maxLength = 2048): Param<string> => ({
  parse: (raw) => (raw !== null && raw.length <= maxLength ? raw : fallback),
  serialize: (value) => {
    if (typeof value !== 'string' || value.length > maxLength)
      throw new RangeError('String parameter limit exceeded.');
    return value === fallback ? null : value;
  },
});
export const numberParam = (
  fallback = 0,
  min = -Number.MAX_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
): Param<number> => ({
  parse: (raw) => {
    const value = raw === null || raw.trim() === '' ? NaN : Number(raw);
    return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
  },
  serialize: (value) => {
    if (!Number.isFinite(value) || value < min || value > max)
      throw new RangeError('Numeric parameter out of bounds.');
    return value === fallback ? null : String(value);
  },
});
export const booleanParam = (fallback = false): Param<boolean> => ({
  parse: (raw) => (raw === 'true' ? true : raw === 'false' ? false : fallback),
  serialize: (value) => {
    if (typeof value !== 'boolean') throw new TypeError('Boolean parameter required.');
    return value === fallback ? null : String(value);
  },
});
type Schema = Record<string, Param<any>>;
export type UrlValues<S extends Schema> = {
  [K in keyof S]: ReturnType<S[K]['parse']>;
};
export function useUrlState<S extends Schema>(
  schema: S,
  {
    mode = 'replace',
    maxLength = 8192,
  }: {
    mode?: 'push' | 'replace';
    maxLength?: number;
  } = {},
) {
  const keys = Object.keys(schema);
  if (
    keys.length > 100 ||
    keys.some(
      (key) =>
        !/^[\w-]{1,64}$/.test(key) || ['__proto__', 'constructor', 'prototype'].includes(key),
    ) ||
    !['push', 'replace'].includes(mode) ||
    !Number.isInteger(maxLength) ||
    maxLength < 1 ||
    maxLength > 32768
  )
    throw new TypeError('Invalid URL schema or limits.');
  const defaults = () =>
    Object.fromEntries(keys.map((key) => [key, schema[key]!.parse(null)])) as UrlValues<S>;
  const [state, setInternal] = useState(defaults);
  const reference = useRef(state);
  reference.current = state;
  const config = useRef(schema);
  config.current = schema;
  const [error, setError] = useState<Error | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const signature = keys.join('|');
  useEffect(() => {
    const read = () => {
      try {
        if (new TextEncoder().encode(window.location.search).length > maxLength)
          throw new RangeError('URL query limit exceeded.');
        const params = new URLSearchParams(window.location.search);
        const next = Object.fromEntries(
          Object.keys(config.current).map((key) => [
            key,
            config.current[key]!.parse(params.get(key)),
          ]),
        ) as UrlValues<S>;
        reference.current = next;
        setInternal(next);
        setError(null);
      } catch (reason) {
        setError(reason instanceof Error ? reason : new Error(String(reason)));
      } finally {
        setHydrated(true);
      }
    };
    read();
    window.addEventListener('popstate', read);
    window.addEventListener('lp-url-state', read);
    return () => {
      window.removeEventListener('popstate', read);
      window.removeEventListener('lp-url-state', read);
    };
  }, [signature, maxLength]);
  const setState = (
    patch: Partial<UrlValues<S>> | ((old: UrlValues<S>) => Partial<UrlValues<S>>),
  ): boolean => {
    try {
      const updates = typeof patch === 'function' ? patch(reference.current) : patch;
      if (Object.keys(updates).some((key) => !Object.hasOwn(config.current, key)))
        throw new TypeError('Unknown URL state key.');
      const next = { ...reference.current, ...updates };
      const url = new URL(window.location.href);
      for (const key of Object.keys(config.current)) {
        const text = config.current[key]!.serialize(next[key]);
        if (text === null) url.searchParams.delete(key);
        else url.searchParams.set(key, text);
      }
      if (new TextEncoder().encode(url.search).length > maxLength)
        throw new RangeError('URL query limit exceeded.');
      if (mode === 'push') window.history.pushState(null, '', url);
      else window.history.replaceState(null, '', url);
      reference.current = next;
      setInternal(next);
      setError(null);
      window.dispatchEvent(new window.Event('lp-url-state'));
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason : new Error(String(reason)));
      return false;
    }
  };
  return { state, setState, error, hydrated };
}
export default useUrlState;
