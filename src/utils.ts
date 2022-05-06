import cbor from 'cbor'

import type { RewardAccount} from './types'
import { StakeCredentialType } from './types'

export enum CborTag {
    TUPLE = 30,
}

export const decodeCbor = (buffer: Buffer) => cbor.decode(buffer, {
    preventDuplicateKeys: true,
    tags: {
        // Specifies that tag 30 should be parsed only as a tuple. For example
        // the CDDL specifies unit_interval as:
        // unit_interval = #6.30([uint, uint])
        [CborTag.TUPLE]: (v: any) => {
            if (!Array.isArray(v) || v.length != 2) {
                throw new Error('Invalid tuple')
            }
            return v
        },
    },
})

export const encodeToCbor = (x: any) => cbor.encodeOne(x, {canonical: true})

export const addIndefiniteLengthFlag = (x: any) => {
    x.encodeCBOR = cbor.Encoder.encodeIndefinite
    return x
}

export const bind = <A, R, T extends any[]>(fn: (x: A, ...args: T) => R, ...args: T): (x: A) => R => (x: A) => fn(x, ...args)

export const undefinedOnlyAtTheEnd = (xs: any[]): boolean => {
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
export const filteredMap = <K, V>(entries: [K, V | undefined][]): Map<K, V> => new Map<K, V>(
    entries.filter(([_, value]) => value !== undefined) as [K, V][]
)

export const getRewardAccountStakeCredentialType = (rewardAccount: RewardAccount) => {
    switch(rewardAccount[0] >> 4 & 1) {
    case 0:
        return StakeCredentialType.KEY_HASH
    case 1:
        return StakeCredentialType.SCRIPT_HASH
    default:
        throw Error('Invalid reward account type')
    }
}

export enum TransactionBodyKeys {
    INPUTS = 0,
    OUTPUTS = 1,
    FEE = 2,
    TTL = 3,
    CERTIFICATES = 4,
    WITHDRAWALS = 5,
    UPDATE = 6,
    METADATA_HASH = 7,
    VALIDITY_INTERVAL_START = 8,
    MINT = 9,
    SCRIPT_DATA_HASH = 11,
    COLLATERAL_INPUTS = 13,
    REQUIRED_SIGNERS = 14,
    NETWORK_ID = 15,
}
