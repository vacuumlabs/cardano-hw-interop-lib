import cbor from 'cbor'

import type { RewardAccount} from './types'
import { StakeCredentialType } from './types'

export const decodeCbor = (buffer: Buffer) => cbor.decode(buffer, {
    preventDuplicateKeys: true,
    tags: {
        // Specifies that tag 30 should be parsed only as a tuple. For example
        // the CDDL specifies unit_interval as:
        // unit_interval = #6.30([uint, uint])
        30: (v: any) => {
            if (!Array.isArray(v) || v.length != 2) {
                throw new Error('Invalid tuple')
            }
            return v
        },
    },
})

export const encodeToCbor = (x: any) => cbor.encodeOne(x, {canonical: true})

export const bind = <A, R, T extends any[]>(fn: (x: A, ...args: T) => R, ...args: T): (x: A) => R => (x: A) => fn(x, ...args)

export const getRewardAccountStakeCredentialType = (rewardAccount: RewardAccount) => {
    switch(rewardAccount[0] >> 4 & 1) {
    case 0:
        return StakeCredentialType.ADDRESS_KEY_HASH
    case 1:
        return StakeCredentialType.SCRIPT_HASH
    default:
        throw Error('Invalid reward account type')
    }
}

