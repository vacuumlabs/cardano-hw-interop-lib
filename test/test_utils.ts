import { bech32 } from 'bech32'
import { expect } from 'chai'

import type { ParseErrorReason } from '../src/errors'
import { ParseError } from '../src/errors'
import type { Parser } from '../src/parsers'
import type {
  FixLenBuffer,
  Int,
  MaxLenString,
  RewardAccount,
  Uint,
} from '../src/types'
import { decodeCbor } from '../src/utils'

export const ipv4ToBuffer = (ipv4: string): FixLenBuffer<4> =>
  Buffer.from(
    ipv4.split('.').map((n) => Number.parseInt(n, 10)),
  ) as FixLenBuffer<4>

export const toFixLenBuffer = <N extends number>(
  str: string,
  length: N,
): FixLenBuffer<N> => Buffer.from(str, 'hex') as FixLenBuffer<typeof length>

export const toMaxLenString = <N extends number>(
  str: string,
  length: N,
): MaxLenString<N> => str as MaxLenString<typeof length>

export const toUint = (n: string | number): Uint =>
  (typeof n === 'string' ? BigInt(n) : n) as Uint

export const toInt = (n: string | number): Int =>
  (typeof n === 'string' ? BigInt(n) : n) as Int

export const fromBech32 = (str: string): Buffer =>
  Buffer.from(bech32.fromWords(bech32.decode(str, 1000).words))

export const rewardAccount = (str: string): RewardAccount =>
  fromBech32(str) as RewardAccount

export type ValidParseTestCase<T> = {
  testName: string
  cbor: string
  parsed: T
}

export type InvalidParseTestCase = {
  testName: string
  cbor: string
  errMsg: ParseErrorReason
}

export const registerTests = <T>(
  name: string,
  parseFn: Parser<T>,
  validTestCases: ValidParseTestCase<T>[],
  invalidTestCases: InvalidParseTestCase[],
) =>
  describe(name, () => {
    describe('Valid', () => {
      for (const { testName, cbor, parsed: expectedParsed } of validTestCases) {
        it(testName, () => {
          const parsed = parseFn(decodeCbor(Buffer.from(cbor, 'hex')))

          expect(parsed).to.deep.equal(expectedParsed)
        })
      }
    })

    describe('Invalid', () => {
      for (const {
        testName,
        cbor,
        errMsg: expectedErrMsg,
      } of invalidTestCases) {
        it(testName, () => {
          expect(() => parseFn(decodeCbor(Buffer.from(cbor, 'hex')))).to.throw(
            ParseError,
            expectedErrMsg,
          )
        })
      }
    })
  })
