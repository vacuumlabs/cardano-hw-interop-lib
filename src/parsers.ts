import type { ParseErrorReason } from './errors'
import { ParseError } from './errors'
import type { FixlenBuffer, Int, MaxlenBuffer, MaxlenString, MaxsizeUint, Uint } from './types'

export function validate(cond: boolean, errMsg: ParseErrorReason): asserts cond {
    if (!cond) throw new ParseError(errMsg)
}

export const isArray = (data: unknown): data is Array<unknown> =>
    Array.isArray(data)

export const isMap = (data: unknown): data is Map<unknown, unknown> =>
    data instanceof Map

export const isMapWithKeysOfType = <K>(data: unknown, keyTypeAssert: (key: unknown) => key is K): data is Map<K, unknown> =>
    isMap(data) && Array.from(data.keys()).every(keyTypeAssert)

export const isStringOfMaxLength = <L extends number>(data: unknown, maxLength: L): data is MaxlenString<L> =>
    typeof data === 'string' && data.length <= maxLength

export const isBuffer = (data: unknown): data is Buffer =>
    Buffer.isBuffer(data)

export const isBufferOfLength = <L extends number>(data: unknown, expectedLength: L): data is FixlenBuffer<L> =>
    isBuffer(data) && data.length === expectedLength

export const isBufferOfMaxLength = <L extends number>(data: unknown, maxLength: L): data is MaxlenBuffer<L> =>
    isBuffer(data) && data.length <= maxLength

export const isNumber = (data: unknown): data is number =>
    typeof data === 'number'

export const isInt = (data: unknown): data is Int =>
    isNumber(data) || typeof data === 'bigint'

export const isUint = (data: unknown): data is Uint =>
    isInt(data) && data >= 0

export const isUintOfMaxSize = <N extends number>(data: unknown, maxSize: N): data is MaxsizeUint<N> =>
    isUint(data) && data <= maxSize

export const parseInt = (data: unknown, errMsg: ParseErrorReason): Int => {
    validate(isInt(data), errMsg)
    return data
}

export const parseUint = (data: unknown, errMsg: ParseErrorReason): Uint => {
    validate(isUint(data), errMsg)
    return data
}

export const parseStringOfMaxLength = <L extends number>(data: unknown, maxLength: L, errMsg: ParseErrorReason): MaxlenString<L> => {
    validate(isStringOfMaxLength(data, maxLength), errMsg)
    return data
}

export const parseBuffer = (data: unknown, errMsg: ParseErrorReason): Buffer => {
    validate(isBuffer(data), errMsg)
    return data
}

export const parseBufferOfLength = <L extends number>(data: unknown, length: L, errMsg: ParseErrorReason): FixlenBuffer<L> => {
    validate(isBufferOfLength(data, length), errMsg)
    return data
}

export const parseBufferOfMaxLength = <L extends number>(data: unknown, maxLength: L, errMsg: ParseErrorReason): MaxlenBuffer<L> => {
    validate(isBufferOfMaxLength(data, maxLength), errMsg)
    return data
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
export function createParser<L extends number>(parser: (data: unknown, length: L, errMsg: ParseErrorReason) => FixlenBuffer<L>, length: L, errMsg: ParseErrorReason): Parser<FixlenBuffer<L>>
export function createParser<L extends number>(parser: (data: unknown, maxLength: L, errMsg: ParseErrorReason) => MaxlenBuffer<L>, maxLength: L, errMsg: ParseErrorReason): Parser<MaxlenBuffer<L>>
export function createParser<L extends number>(parser: (data: unknown, maxLength: L, errMsg: ParseErrorReason) => MaxlenString<L>, maxLength: L, errMsg: ParseErrorReason): Parser<MaxlenString<L>>
export function createParser<T, A extends any[]>(parser: (data: unknown, ...args: [...A]) => T, ...args: [...A]): Parser<T>
export function createParser<T, A extends any[]>(parser: (data: unknown, ...args: [...A]) => T, ...args: [...A]): Parser<T> {
    return (data: unknown) => parser(data, ...args)
}

export const parseMap = <K, V>(
    data: unknown,
    parseKey: Parser<K>,
    parseValue: Parser<V>,
    errMsg: ParseErrorReason,
): Map<K, V> => {
    validate(isMap(data), errMsg)
    return new Map(Array.from(data.entries()).map(([key, value]) => [parseKey(key), parseValue(value)]))
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
 * Parses the data as an array of length of the provided parsers
 *
 * @example
 *     // returns [123N, -1N]
 *     parseTuple([123, -1], InvalidDataReason.INVALID, parseUint64, parseInt64)
 */
export const parseTuple = <T extends any[]>(data: unknown, errMsg: ParseErrorReason, ...parsers: { [K in keyof T]: Parser<T[K]> }): T => {
    validate(isArray(data), errMsg)
    validate(data.length <= parsers.length, errMsg)

    return parsers.map((parser, index) => parser(data[index])) as T
}

export const parseOptional = <T>(data: unknown, parser: Parser<T>): T | undefined =>
    data === undefined ? undefined : parser(data)

export const parseNullable = <T>(data: unknown, parser: Parser<T>): T | null =>
    data === null ? null : parser(data)

export type WithoutType<T> = Omit<T, 'type'>
type ArrayParser<T> = (data: unknown[]) => T
type ParsersWithoutType<T> = { [K in keyof T]: ArrayParser<WithoutType<T[K]>> }

export const parseBasedOnType = <T extends number, U extends any[]>(
    data: unknown, errMsg: ParseErrorReason, typeParser: Parser<T>, ...parsers: [...ParsersWithoutType<U>]
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
