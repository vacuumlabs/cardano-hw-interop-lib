import { Tagged } from 'cbor'

import type { Amount, AssetName, Certificate, Coin, Multiasset, PolicyId, PoolMetadata, PoolParams, RawTransaction, Relay, RewardAccount, StakeCredential, Transaction, TransactionBody, TransactionInput, TransactionOutput, Withdrawal } from './types'
import { AmountType, CertificateType, RelayType } from './types'

const identity = <T>(x: T): T => x

const serializeTxInput = (input: TransactionInput) =>
    [input.transactionId, input.index]

const serializeMultiasset = <T>(multiasset: Multiasset<T>): Map<PolicyId, Map<AssetName, T>> =>
    new Map(
        multiasset.map(({policyId, tokens}) => [
            policyId,
            new Map(tokens.map(({assetName, amount}) => [assetName, amount])),
        ])
    )

const serializeAmount = (amount: Amount) => {
    switch (amount.type) {
    case AmountType.WITHOUT_MULTIASSET:
        return amount.coin
    case AmountType.WITH_MULTIASSET:
        return [amount.coin, serializeMultiasset(amount.multiasset)]
    }
}

const serializeTxOutput = (output: TransactionOutput) =>
    [output.address, serializeAmount(output.amount)]

const serializeWithdrawals = (withdrawals: Withdrawal[]): Map<RewardAccount, Coin> =>
    new Map(withdrawals.map(({rewardAccount, amount}) => [rewardAccount, amount]))

const serializeRelay = (relay: Relay) => {
    switch (relay.type) {
    case RelayType.SINGLE_HOST_ADDRESS:
        return [relay.type, relay.port, relay.ipv4, relay.ipv6]
    case RelayType.SINGLE_HOST_NAME:
        return [relay.type, relay.port, relay.dnsName]
    case RelayType.MULTI_HOST_NAME:
        return [relay.type, relay.dnsName]
    }
}

const serializePoolMetadata = (poolMetadata: PoolMetadata) =>
    [poolMetadata.url, poolMetadata.metadataHash]

const serializePoolParams = (poolParams: PoolParams) => [
    poolParams.operator,
    poolParams.vrfKeyHash,
    poolParams.pledge,
    poolParams.cost,
    new Tagged(30, poolParams.margin),
    poolParams.rewardAccount,
    poolParams.poolOwners,
    poolParams.relays.map(serializeRelay),
    poolParams.poolMetadata && serializePoolMetadata(poolParams.poolMetadata),
]

const serializeStakeCredential = (stakeCredential: StakeCredential) =>
    [stakeCredential.type, stakeCredential.hash]

const serializeTxCertificate = (certificate: Certificate) => {
    switch (certificate.type) {
    case CertificateType.STAKE_REGISTRATION:
    case CertificateType.STAKE_DEREGISTRATION:
        return [certificate.type, serializeStakeCredential(certificate.stakeCredential)]
    case CertificateType.STAKE_DELEGATION:
        return [certificate.type, serializeStakeCredential(certificate.stakeCredential), certificate.poolKeyHash]
    case CertificateType.POOL_REGISTRATION:
        return [certificate.type, ...serializePoolParams(certificate.poolParams)]
    case CertificateType.POOL_RETIREMENT:
        return [certificate.type, certificate.poolKeyHash, certificate.epoch]
    case CertificateType.GENESIS_KEY_DELEGATION:
    case CertificateType.MOVE_INSTANTANEOUS_REWARDS_CERT:
        return [certificate.type, ...certificate.restOfData]
    }
}

export const serializeTxBody = (txBody: TransactionBody) => new Map(([
    [0, txBody.inputs.map(serializeTxInput)],
    [1, txBody.outputs.map(serializeTxOutput)],
    [2, identity(txBody.fee)],
    [3, identity(txBody.ttl)],
    [4, txBody.certificates?.map(serializeTxCertificate)],
    [5, txBody.withdrawals && serializeWithdrawals(txBody.withdrawals)],
    [6, identity(txBody.update)],
    [7, identity(txBody.metadataHash)],
    [8, identity(txBody.validityIntervalStart)],
    [9, txBody.mint && serializeMultiasset(txBody.mint)],
]).filter(([_, value]) => value !== undefined) as [number, unknown][])

export const serializeTx = (tx: Transaction) => [
    serializeTxBody(tx.body),
    tx.witnessSet,
    tx.auxiliaryData,
]

export const serializeRawTx = (rawTx: RawTransaction) => {
    // older versions of cardano-cli did not include scriptWitnesses
    if (rawTx.scriptWitnesses === undefined) {
        return [
            serializeTxBody(rawTx.body),
            rawTx.auxiliaryData,
        ]
    }
    return [
        serializeTxBody(rawTx.body),
        rawTx.scriptWitnesses,
        rawTx.auxiliaryData,
    ]
}
