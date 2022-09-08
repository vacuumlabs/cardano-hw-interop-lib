import { bech32 } from 'bech32'
import { expect } from 'chai'

import type { ParseErrorReason } from '../src/errors'
import { ParseError } from '../src/errors'
import type { Parser } from '../src/parsers'
import type {
  FixlenBuffer,
  Int,
  MaxlenString,
  RewardAccount,
  Uint,
} from '../src/types'
import { decodeCbor } from '../src/utils'

export const ipv4ToBuffer = (ipv4: string): FixlenBuffer<4> =>
  Buffer.from(
    ipv4.split('.').map((n) => Number.parseInt(n, 10)),
  ) as FixlenBuffer<4>

export const toFixlenBuffer = <N extends number>(
  str: string,
  length: N,
): FixlenBuffer<N> => Buffer.from(str, 'hex') as FixlenBuffer<typeof length>

export const toMaxLenString = <N extends number>(
  str: string,
  length: N,
): MaxlenString<N> => str as MaxlenString<typeof length>

export const toUint = (n: string | number): Uint =>
  (typeof n === 'string' ? BigInt(n) : n) as Uint

export const toInt = (n: string | number): Int =>
  (typeof n === 'string' ? BigInt(n) : n) as Int

export const fromBech32 = (str: string): Buffer =>
  Buffer.from(bech32.fromWords(bech32.decode(str, 1000).words))

export const rewardAccount = (str: string): RewardAccount =>
  fromBech32(str) as RewardAccount

export type ValidParseTestcase<T> = {
  testname: string
  cbor: string
  parsed: T
}

export type InvalidParseTestcase = {
  testname: string
  cbor: string
  errMsg: ParseErrorReason
}

export const registerTests = <T>(
  name: string,
  parseFn: Parser<T>,
  validTestcases: ValidParseTestcase<T>[],
  invalidTestcases: InvalidParseTestcase[],
) =>
  describe(name, () => {
    describe('Valid', () => {
      for (const { testname, cbor, parsed: expectedParsed } of validTestcases) {
        it(testname, () => {
          const parsed = parseFn(decodeCbor(Buffer.from(cbor, 'hex')))

          expect(parsed).to.deep.equal(expectedParsed)
        })
      }
    })

    describe('Invalid', () => {
      for (const {
        testname,
        cbor,
        errMsg: expectedErrMsg,
      } of invalidTestcases) {
        it(testname, () => {
          expect(() => parseFn(decodeCbor(Buffer.from(cbor, 'hex')))).to.throw(
            ParseError,
            expectedErrMsg,
          )
        })
      }
    })
  })
