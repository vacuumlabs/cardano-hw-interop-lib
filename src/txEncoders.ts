import { Tagged } from 'cbor'

import type { Amount, AssetName, Certificate, Coin, Multiasset, PolicyId, PoolMetadata, PoolParams, RawTransaction, Relay, RewardAccount, Transaction, StakeCredential, TransactionBody, TransactionInput, TransactionOutput, Withdrawal } from './types'
import { AmountType, CertificateType, RelayType } from './types'

const identity = <T>(x: T): T => x

const encodeTxInput = (input: TransactionInput) =>
    [input.transactionId, input.index]

const encodeMultiasset = <T>(multiasset: Multiasset<T>): Map<PolicyId, Map<AssetName, T>> =>
    new Map(
        multiasset.map(({policyId, tokens}) => [
            policyId,
            new Map(tokens.map(({assetName, amount}) => [assetName, amount])),
        ])
    )

const encodeAmount = (amount: Amount) => {
    switch (amount.type) {
    case AmountType.WITHOUT_MULTIASSET:
        return amount.coin
    case AmountType.WITH_MULTIASSET:
        return [amount.coin, encodeMultiasset(amount.multiasset)]
    }
}

const encodeTxOutput = (output: TransactionOutput) =>
    [output.address, encodeAmount(output.amount)]

const encodeWithdrawals = (withdrawals: Withdrawal[]): Map<RewardAccount, Coin> =>
    new Map(withdrawals.map(({rewardAccount, amount}) => [rewardAccount, amount]))

const encodeRelay = (relay: Relay) => {
    switch (relay.type) {
    case RelayType.SINGLE_HOST_ADDRESS:
        return [relay.type, relay.port, relay.ipv4, relay.ipv6]
    case RelayType.SINGLE_HOST_NAME:
        return [relay.type, relay.port, relay.dnsName]
    case RelayType.MULTI_HOST_NAME:
        return [relay.type, relay.dnsName]
    }
}

const encodePoolMetadata = (poolMetadata: PoolMetadata) =>
    [poolMetadata.url, poolMetadata.metadataHash]

const encodePoolParams = (poolParams: PoolParams) => [
    poolParams.operator,
    poolParams.vrfKeyHash,
    poolParams.pledge,
    poolParams.cost,
    new Tagged(30, poolParams.margin),
    poolParams.rewardAccount,
    poolParams.poolOwners,
    poolParams.relays.map(encodeRelay),
    poolParams.poolMetadata && encodePoolMetadata(poolParams.poolMetadata),
]

const encodeStakeCredential = (stakeCredential: StakeCredential) => [
    stakeCredential.type, stakeCredential.hash,
]

const encodeTxCertificate = (certificate: Certificate) => {
    switch (certificate.type) {
    case CertificateType.STAKE_REGISTRATION:
    case CertificateType.STAKE_DEREGISTRATION:
        return [certificate.type, encodeStakeCredential(certificate.stakeCredential)]
    case CertificateType.STAKE_DELEGATION:
        return [certificate.type, encodeStakeCredential(certificate.stakeCredential), certificate.poolKeyHash]
    case CertificateType.POOL_REGISTRATION:
        return [certificate.type, ...encodePoolParams(certificate.poolParams)]
    case CertificateType.POOL_RETIREMENT:
        return [certificate.type, certificate.poolKeyHash, certificate.epoch]
    case CertificateType.GENESIS_KEY_DELEGATION:
    case CertificateType.MOVE_INSTANTANEOUS_REWARDS_CERT:
        return [certificate.type, ...certificate.restOfData]
    }
}

export const encodeTxBody = (txBody: TransactionBody) => new Map(([
    [0, txBody.inputs.map(encodeTxInput)],
    [1, txBody.outputs.map(encodeTxOutput)],
    [2, identity(txBody.fee)],
    [3, identity(txBody.ttl)],
    [4, txBody.certificates?.map(encodeTxCertificate)],
    [5, txBody.withdrawals && encodeWithdrawals(txBody.withdrawals)],
    [6, identity(txBody.update)],
    [7, identity(txBody.metadataHash)],
    [8, identity(txBody.validityIntervalStart)],
    [9, txBody.mint && encodeMultiasset(txBody.mint)],
]).filter(([_, value]) => value !== undefined) as [number, unknown][])

export const encodeTx = (tx: Transaction) => [
    encodeTxBody(tx.body),
    tx.witnessSet,
    tx.auxiliaryData,
]

export const encodeRawTx = (rawTx: RawTransaction) => [
    encodeTxBody(rawTx.body),
    rawTx.nativeScriptWitnesses,
    rawTx.auxiliaryData,
]
