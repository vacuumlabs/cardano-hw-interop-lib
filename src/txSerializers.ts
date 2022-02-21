import { Tagged } from 'cbor'

import type { Amount, AssetName, Certificate, Coin, Collateral, Multiasset, PolicyId, PoolMetadata, PoolParams, RawTransaction, Relay, RewardAccount, StakeCredential, Transaction, TransactionBody, TransactionInput, TransactionOutput, Withdrawal } from './types'
import { AmountType, CertificateType, RelayType } from './types'
import { addIndefiniteLengthFlag, TransactionBodyKeys } from './utils'

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
    output.datumHash
        ? [output.address, serializeAmount(output.amount), output.datumHash]
        : [output.address, serializeAmount(output.amount)]

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

const serializeCollateral = (collateral: Collateral) =>
    [collateral.transactionId, collateral.index]

export const serializeTxBody = (txBody: TransactionBody) => new Map(([
    [TransactionBodyKeys.INPUTS, txBody.inputs.map(serializeTxInput)],
    [TransactionBodyKeys.OUTPUTS, txBody.outputs.map(serializeTxOutput)],
    [TransactionBodyKeys.FEE, identity(txBody.fee)],
    [TransactionBodyKeys.TTL, identity(txBody.ttl)],
    [TransactionBodyKeys.CERTIFICATES, txBody.certificates?.map(serializeTxCertificate)],
    [TransactionBodyKeys.WITHDRAWALS, txBody.withdrawals && serializeWithdrawals(txBody.withdrawals)],
    [TransactionBodyKeys.UPDATE, identity(txBody.update)],
    [TransactionBodyKeys.METADATA_HASH, identity(txBody.metadataHash)],
    [TransactionBodyKeys.VALIDITY_INTERVAL_START, identity(txBody.validityIntervalStart)],
    [TransactionBodyKeys.MINT, txBody.mint && serializeMultiasset(txBody.mint)],
    [TransactionBodyKeys.SCRIPT_DATA_HASH, txBody.scriptDataHash],
    [TransactionBodyKeys.COLLATERAL_INPUTS, txBody.collaterals?.map(serializeCollateral)],
    [TransactionBodyKeys.REQUIRED_SIGNERS, txBody.requiredSigners],
    [TransactionBodyKeys.NETWORK_ID, txBody.networkId],
]).filter(([_, value]) => value !== undefined) as [number, unknown][])

export const serializeTx = (tx: Transaction) => {
    return [
        serializeTxBody(tx.body),
        tx.witnessSet,
        tx.scriptValidity,
        tx.auxiliaryData,
    ].filter((item) => item !== undefined)
}

export const serializeRawTx = (rawTx: RawTransaction) => {
    if (rawTx.scriptWitnesses !== undefined) {
        // cardano-cli expects indefinite-length scriptWitnesses
        addIndefiniteLengthFlag(rawTx.scriptWitnesses)
    }

    return [
        serializeTxBody(rawTx.body),
        rawTx.scriptWitnesses,
        rawTx.datumWitnesses,
        rawTx.redeemerWitnesses,
        rawTx.scriptValidity,
        rawTx.auxiliaryData,
    ].filter((item) => item !== undefined)
}
