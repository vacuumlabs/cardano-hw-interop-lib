import {Tagged} from 'cbor'

import type {
  Amount,
  AssetName,
  BabbageTransactionOutput,
  Certificate,
  Coin,
  Datum,
  LegacyTransactionOutput,
  Multiasset,
  PolicyId,
  PoolMetadata,
  PoolParams,
  ReferenceScript,
  Relay,
  RewardAccount,
  StakeCredential,
  Transaction,
  TransactionBody,
  TransactionInput,
  TransactionOutput,
  Withdrawal,
} from './types'
import {
  AmountType,
  CertificateType,
  DatumType,
  RelayType,
  TxOutputFormat,
} from './types'
import {
  BabbageTransactionOutputKeys,
  CborTag,
  filteredMap,
  TransactionBodyKeys,
  unreachable,
} from './utils'

const identity = <T>(x: T): T => x

const serializeTxInput = (input: TransactionInput) => [
  input.transactionId,
  input.index,
]

const serializeMultiasset = <T>(
  multiasset: Multiasset<T>,
): Map<PolicyId, Map<AssetName, T>> =>
  new Map(
    multiasset.map(({policyId, tokens}) => [
      policyId,
      new Map(tokens.map(({assetName, amount}) => [assetName, amount])),
    ]),
  )

const serializeAmount = (amount: Amount) => {
  switch (amount.type) {
    case AmountType.WITHOUT_MULTIASSET:
      return amount.coin
    case AmountType.WITH_MULTIASSET:
      return [amount.coin, serializeMultiasset(amount.multiasset)]
    default:
      unreachable(amount)
  }
}

const serializeLegacyTxOutput = (output: LegacyTransactionOutput) =>
  output.datumHash
    ? [output.address, serializeAmount(output.amount), output.datumHash.hash]
    : [output.address, serializeAmount(output.amount)]

const serializeDatum = (datum: Datum) => {
  switch (datum.type) {
    case DatumType.HASH:
      return [datum.type, datum.hash]
    case DatumType.INLINE:
      return [datum.type, new Tagged(CborTag.ENCODED_CBOR, datum.bytes)]
    default:
      unreachable(datum)
  }
}

const serializeReferenceScript = (referenceScript: ReferenceScript) =>
  new Tagged(CborTag.ENCODED_CBOR, referenceScript)

const serializeBabbageTxOutput = (output: BabbageTransactionOutput) =>
  filteredMap<BabbageTransactionOutputKeys, unknown>([
    [BabbageTransactionOutputKeys.ADDRESS, identity(output.address)],
    [BabbageTransactionOutputKeys.AMOUNT, serializeAmount(output.amount)],
    [
      BabbageTransactionOutputKeys.DATUM,
      output.datum && serializeDatum(output.datum),
    ],
    [
      BabbageTransactionOutputKeys.REFERENCE_SCRIPT,
      output.referenceScript &&
        serializeReferenceScript(output.referenceScript),
    ],
  ])

const serializeTxOutput = (output: TransactionOutput) => {
  switch (output.format) {
    case TxOutputFormat.ARRAY_LEGACY:
      return serializeLegacyTxOutput(output)
    case TxOutputFormat.MAP_BABBAGE:
      return serializeBabbageTxOutput(output)
    default:
      unreachable(output)
  }
}

const serializeWithdrawals = (
  withdrawals: Withdrawal[],
): Map<RewardAccount, Coin> =>
  new Map(withdrawals.map(({rewardAccount, amount}) => [rewardAccount, amount]))

const serializeRelay = (relay: Relay) => {
  switch (relay.type) {
    case RelayType.SINGLE_HOST_ADDRESS:
      return [relay.type, relay.port, relay.ipv4, relay.ipv6]
    case RelayType.SINGLE_HOST_NAME:
      return [relay.type, relay.port, relay.dnsName]
    case RelayType.MULTI_HOST_NAME:
      return [relay.type, relay.dnsName]
    default:
      unreachable(relay)
  }
}

const serializePoolMetadata = (poolMetadata: PoolMetadata) => [
  poolMetadata.url,
  poolMetadata.metadataHash,
]

const serializePoolParams = (poolParams: PoolParams) => [
  poolParams.operator,
  poolParams.vrfKeyHash,
  poolParams.pledge,
  poolParams.cost,
  new Tagged(CborTag.TUPLE, poolParams.margin),
  poolParams.rewardAccount,
  poolParams.poolOwners,
  poolParams.relays.map(serializeRelay),
  poolParams.poolMetadata && serializePoolMetadata(poolParams.poolMetadata),
]

const serializeStakeCredential = (stakeCredential: StakeCredential) => [
  stakeCredential.type,
  stakeCredential.hash,
]

const serializeCertificate = (certificate: Certificate) => {
  switch (certificate.type) {
    case CertificateType.STAKE_REGISTRATION:
    case CertificateType.STAKE_DEREGISTRATION:
      return [
        certificate.type,
        serializeStakeCredential(certificate.stakeCredential),
      ]
    case CertificateType.STAKE_DELEGATION:
      return [
        certificate.type,
        serializeStakeCredential(certificate.stakeCredential),
        certificate.poolKeyHash,
      ]
    case CertificateType.POOL_REGISTRATION:
      return [certificate.type, ...serializePoolParams(certificate.poolParams)]
    case CertificateType.POOL_RETIREMENT:
      return [certificate.type, certificate.poolKeyHash, certificate.epoch]
    case CertificateType.GENESIS_KEY_DELEGATION:
    case CertificateType.MOVE_INSTANTANEOUS_REWARDS_CERT:
      return [certificate.type, ...certificate.restOfData]
    default:
      unreachable(certificate)
  }
}

const serializeCollateralInput = (collateralInput: TransactionInput) => [
  collateralInput.transactionId,
  collateralInput.index,
]

export const serializeTxBody = (txBody: TransactionBody) =>
  filteredMap<TransactionBodyKeys, unknown>([
    [TransactionBodyKeys.INPUTS, txBody.inputs.map(serializeTxInput)],
    [TransactionBodyKeys.OUTPUTS, txBody.outputs.map(serializeTxOutput)],
    [TransactionBodyKeys.FEE, identity(txBody.fee)],
    [TransactionBodyKeys.TTL, identity(txBody.ttl)],
    [
      TransactionBodyKeys.CERTIFICATES,
      txBody.certificates?.map(serializeCertificate),
    ],
    [
      TransactionBodyKeys.WITHDRAWALS,
      txBody.withdrawals && serializeWithdrawals(txBody.withdrawals),
    ],
    [TransactionBodyKeys.UPDATE, identity(txBody.update)],
    [
      TransactionBodyKeys.AUXILIARY_DATA_HASH,
      identity(txBody.auxiliaryDataHash),
    ],
    [
      TransactionBodyKeys.VALIDITY_INTERVAL_START,
      identity(txBody.validityIntervalStart),
    ],
    [TransactionBodyKeys.MINT, txBody.mint && serializeMultiasset(txBody.mint)],
    [TransactionBodyKeys.SCRIPT_DATA_HASH, identity(txBody.scriptDataHash)],
    [
      TransactionBodyKeys.COLLATERAL_INPUTS,
      txBody.collateralInputs?.map(serializeCollateralInput),
    ],
    [TransactionBodyKeys.REQUIRED_SIGNERS, identity(txBody.requiredSigners)],
    [TransactionBodyKeys.NETWORK_ID, identity(txBody.networkId)],
    [
      TransactionBodyKeys.COLLATERAL_RETURN_OUTPUT,
      txBody.collateralReturnOutput &&
        serializeTxOutput(txBody.collateralReturnOutput),
    ],
    [TransactionBodyKeys.TOTAL_COLLATERAL, identity(txBody.totalCollateral)],
    [
      TransactionBodyKeys.REFERENCE_INPUTS,
      txBody.referenceInputs?.map(serializeTxInput),
    ],
  ])

export const serializeTx = (tx: Transaction) => {
  return [
    serializeTxBody(tx.body),
    tx.witnessSet,
    tx.scriptValidity,
    tx.auxiliaryData,
  ].filter((item) => item !== undefined)
}
