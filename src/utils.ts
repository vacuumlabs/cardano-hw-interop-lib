import blake2b from 'blake2b'
import cbor from 'cbor'

import type {FixLenBuffer, RewardAccount} from './types'
import {CredentialType} from './types'

export function assert(cond: boolean, errMsg: string): asserts cond {
  const msg = errMsg ? `: ${errMsg}` : ''
  if (!cond) throw new Error(`Assertion failed${msg}`)
}

export function unreachable(_val: never): never {
  assert(false, 'Unreachable code hit')
}

export enum CborTag {
  ENCODED_CBOR = 24,
  TUPLE = 30,
}

export const decodeCbor = (buffer: Buffer) =>
  cbor.decode(buffer, {
    preventDuplicateKeys: true,
    tags: {
      // Specifies that tag 30 should be parsed only as a tuple. For example
      // the CDDL specifies unit_interval as:
      // unit_interval = #6.30([uint, uint])
      [CborTag.TUPLE]: (v: unknown) => {
        if (!Array.isArray(v) || v.length !== 2) {
          throw new Error('Invalid tuple')
        }
        return v
      },
    },
  })

export const encodeToCbor = (x: unknown) => cbor.encodeOne(x, {canonical: true})

export const bind =
  <A, R, T extends unknown[]>(
    fn: (x: A, ...args: T) => R,
    ...args: T
  ): ((x: A) => R) =>
  (x: A) =>
    fn(x, ...args)

export const undefinedOnlyAtTheEnd = (xs: unknown[]): boolean => {
  const firstUndefined = xs.indexOf(undefined)
  if (firstUndefined === -1) {
    return true
  }
  return xs.slice(firstUndefined).every((x) => x === undefined)
}

/**
 * Creates a map from the input `entries`.
 * If a value is `undefined`, the key-value pair is omitted entirely.
 */
export const filteredMap = <K, V>(entries: [K, V | undefined][]): Map<K, V> =>
  new Map<K, V>(entries.filter(([_, value]) => value !== undefined) as [K, V][])

export const getRewardAccountStakeCredentialType = (
  rewardAccount: RewardAccount,
) => {
  // eslint-disable-next-line no-bitwise
  switch ((rewardAccount[0] >> 4) & 1) {
    case 0:
      return CredentialType.KEY_HASH
    case 1:
      return CredentialType.SCRIPT_HASH
    default:
      throw Error('Invalid reward account type')
  }
}

export enum BabbageTransactionOutputKeys {
  ADDRESS = 0,
  AMOUNT = 1,
  DATUM = 2,
  REFERENCE_SCRIPT = 3,
}

export enum TransactionBodyKeys {
  INPUTS = 0,
  OUTPUTS = 1,
  FEE = 2,
  TTL = 3,
  CERTIFICATES = 4,
  WITHDRAWALS = 5,
  UPDATE = 6,
  AUXILIARY_DATA_HASH = 7,
  VALIDITY_INTERVAL_START = 8,
  MINT = 9,
  SCRIPT_DATA_HASH = 11,
  COLLATERAL_INPUTS = 13,
  REQUIRED_SIGNERS = 14,
  NETWORK_ID = 15,
  COLLATERAL_RETURN_OUTPUT = 16,
  TOTAL_COLLATERAL = 17,
  REFERENCE_INPUTS = 18,
}

export const blake2b256 = (data: unknown): FixLenBuffer<32> =>
  Buffer.from(blake2b(32).update(data).digest()) as FixLenBuffer<32>
