import {Tagged} from 'cbor'

import {ParseErrorReason, ParseError} from './errors'
import type {
  FixLenBuffer,
  Int,
  MaxLenBuffer,
  MaxLenString,
  MaxSizeUint,
  Uint,
} from './types'
import {CborTag} from './utils'

export function validate(
  cond: boolean,
  errMsg: ParseErrorReason,
): asserts cond {
  if (!cond) throw new ParseError(errMsg)
}

export const isArray = (data: unknown): data is Array<unknown> =>
  Array.isArray(data)

export const isMap = (data: unknown): data is Map<unknown, unknown> =>
  data instanceof Map

export const isMapWithKeysOfType = <K>(
  data: unknown,
  keyTypeAssert: (key: unknown) => key is K,
): data is Map<K, unknown> =>
  isMap(data) && Array.from(data.keys()).every(keyTypeAssert)

export const isStringOfMaxLength = <L extends number>(
  data: unknown,
  maxLength: L,
): data is MaxLenString<L> =>
  typeof data === 'string' && data.length <= maxLength

export const isBuffer = (data: unknown): data is Buffer => Buffer.isBuffer(data)

export const isBufferOfLength = <L extends number>(
  data: unknown,
  expectedLength: L,
): data is FixLenBuffer<L> => isBuffer(data) && data.length === expectedLength

export const isBufferOfMaxLength = <L extends number>(
  data: unknown,
  maxLength: L,
): data is MaxLenBuffer<L> => isBuffer(data) && data.length <= maxLength

export const isNumber = (data: unknown): data is number =>
  typeof data === 'number'

export const isInt = (data: unknown): data is Int =>
  isNumber(data) || typeof data === 'bigint'

export const isUint = (data: unknown): data is Uint => isInt(data) && data >= 0

export const isUintOfMaxSize = <N extends number>(
  data: unknown,
  maxSize: N,
): data is MaxSizeUint<N> => isUint(data) && data <= maxSize

export const parseInt = (data: unknown, errMsg: ParseErrorReason): Int => {
  validate(isInt(data), errMsg)
  return data
}

export const parseUint = (data: unknown, errMsg: ParseErrorReason): Uint => {
  validate(isUint(data), errMsg)
  return data
}

export const parseStringOfMaxLength = <L extends number>(
  data: unknown,
  maxLength: L,
  errMsg: ParseErrorReason,
): MaxLenString<L> => {
  validate(isStringOfMaxLength(data, maxLength), errMsg)
  return data
}

export const parseBuffer = (
  data: unknown,
  errMsg: ParseErrorReason,
): Buffer => {
  validate(isBuffer(data), errMsg)
  return data
}

export const parseBufferOfLength = <L extends number>(
  data: unknown,
  length: L,
  errMsg: ParseErrorReason,
): FixLenBuffer<L> => {
  validate(isBufferOfLength(data, length), errMsg)
  return data
}

export const parseBufferOfMaxLength = <L extends number>(
  data: unknown,
  maxLength: L,
  errMsg: ParseErrorReason,
): MaxLenBuffer<L> => {
  validate(isBufferOfMaxLength(data, maxLength), errMsg)
  return data
}

export const parseEmbeddedCborBytes = (
  data: unknown,
  errMsg: ParseErrorReason,
): Buffer => {
  validate(data instanceof Tagged, errMsg)
  validate(data.tag === CborTag.ENCODED_CBOR, errMsg)
  validate(isBuffer(data.value), errMsg)
  return data.value
}

/**
 * Defines a generic parser that takes only the data, it assumes other
 * arguments of the parser are already bound.
 * @see createParser
 */
export type Parser<T> = (data: unknown) => T

/**
 * Takes a parsing function and binds its arguments except for the data
 * returns a parser function that only requires the data to execute
 * @see Parser
 */
/* eslint-disable no-redeclare */
export function createParser<L extends number>(
  parser: (
    data: unknown,
    length: L,
    errMsg: ParseErrorReason,
  ) => FixLenBuffer<L>,
  length: L,
  errMsg: ParseErrorReason,
): Parser<FixLenBuffer<L>>
export function createParser<L extends number>(
  parser: (
    data: unknown,
    maxLength: L,
    errMsg: ParseErrorReason,
  ) => MaxLenBuffer<L>,
  maxLength: L,
  errMsg: ParseErrorReason,
): Parser<MaxLenBuffer<L>>
export function createParser<L extends number>(
  parser: (
    data: unknown,
    maxLength: L,
    errMsg: ParseErrorReason,
  ) => MaxLenString<L>,
  maxLength: L,
  errMsg: ParseErrorReason,
): Parser<MaxLenString<L>>
export function createParser<T, A extends unknown[]>(
  parser: (data: unknown, ...args: [...A]) => T,
  ...args: [...A]
): Parser<T>
export function createParser<T, A extends unknown[]>(
  parser: (data: unknown, ...args: [...A]) => T,
  ...args: [...A]
): Parser<T> {
  return (data: unknown) => parser(data, ...args)
}
/* eslint-enable no-redeclare */

export const parseMap = <K, V>(
  data: unknown,
  parseKey: Parser<K>,
  parseValue: Parser<V>,
  errMsg: ParseErrorReason,
): Map<K, V> => {
  validate(isMap(data), errMsg)
  return new Map(
    Array.from(data.entries()).map(([key, value]) => [
      parseKey(key),
      parseValue(value),
    ]),
  )
}

export const parseArray = <T>(
  data: unknown,
  parseEntry: Parser<T>,
  errMsg: ParseErrorReason,
): Array<T> => {
  validate(isArray(data), errMsg)
  return data.map((value) => parseEntry(value))
}

/**
 * Parses the data as an array of length of the provided parsers.
 * If the number of provided parsers exceeds the length of parsed array,
 * the missing elements are fed to the parsers as `undefined`.
 *
 * @example
 *     // returns [123N, -1N]
 *     parseTuple([123, -1], InvalidDataReason.INVALID, parseUint64, parseInt64)
 */
export const parseTuple = <T extends unknown[]>(
  data: unknown,
  errMsg: ParseErrorReason,
  ...parsers: {[K in keyof T]: Parser<T[K]>}
): T => {
  validate(isArray(data), errMsg)
  validate(data.length <= parsers.length, errMsg)

  return parsers.map((parser, index) => parser(data[index])) as T
}

export const parseOptional = <T>(
  data: unknown,
  parser: Parser<T>,
): T | undefined => (data === undefined ? undefined : parser(data))

export const parseNullable = <T>(data: unknown, parser: Parser<T>): T | null =>
  data === null ? null : parser(data)

export type WithoutType<T> = Omit<T, 'type'>
type ArrayParser<T> = (data: unknown[]) => T
type ParsersWithoutType<T> = {[K in keyof T]: ArrayParser<WithoutType<T[K]>>}

export const parseBasedOnType = <T extends number, U extends unknown[]>(
  data: unknown,
  errMsg: ParseErrorReason,
  typeParser: Parser<T>,
  ...parsers: [...ParsersWithoutType<U>]
): U[T] => {
  validate(isArray(data), errMsg)
  validate(data.length >= 1, errMsg)

  const [unparsedType, ...rest] = data
  const type = typeParser(unparsedType)
  validate(parsers[type] !== undefined, errMsg)

  return {
    type,
    ...parsers[type](rest),
  }
}
