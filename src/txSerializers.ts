import {Tagged} from 'cbor'
import {
  AmountType,
  CertificateType,
  DatumType,
  RelayType,
  TxOutputFormat,
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
  Credential,
  Transaction,
  TransactionBody,
  TransactionInput,
  TransactionOutput,
  Withdrawal,
  DRep,
  DRepType,
  Anchor,
  VoterVotes,
  Voter,
  GovActionId,
  VotingProcedure,
  ProposalProcedure,
  Uint,
  Int,
  CddlSetBase,
} from './types'
import {
  BabbageTransactionOutputKeys,
  CborTag,
  filteredMap,
  TransactionBodyKeys,
  unreachable,
} from './utils'

export const identity = <T>(x: T): T => x

export type Serializer<T> = (data: T) => unknown

const serializeCddlSetBase = <T>(
  set: CddlSetBase<T>,
  serializeEntry: Serializer<T>,
) => {
  const data = set.items.map(serializeEntry)
  if (set.hasTag) {
    return new Tagged(CborTag.SET, data)
  } else {
    return data
  }
}

const serializeCddlSetBaseOrUndefined = <T>(
  set: CddlSetBase<T> | undefined,
  serializeEntry: Serializer<T>,
) => {
  if (set === undefined) {
    return undefined
  }
  return serializeCddlSetBase(set, serializeEntry)
}

// export needed because of uniqueness check during parsing
export const serializeTxInput = (input: TransactionInput) => [
  input.transactionId,
  input.index,
]

const serializeMultiasset = <T extends Int | Uint>(
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
  new Tagged(CborTag.UNIT_INTERVAL, poolParams.margin),
  poolParams.rewardAccount,
  serializeCddlSetBase(poolParams.poolOwners, identity),
  poolParams.relays.map(serializeRelay),
  poolParams.poolMetadata && serializePoolMetadata(poolParams.poolMetadata),
]

const serializeCredential = (credential: Credential) => [
  credential.type,
  credential.hash,
]

const serializeDRep = (dRep: DRep) => {
  switch (dRep.type) {
    case DRepType.KEY_HASH:
      return [dRep.type, dRep.keyHash]
    case DRepType.SCRIPT_HASH:
      return [dRep.type, dRep.scriptHash]
    case DRepType.ALWAYS_ABSTAIN:
    case DRepType.ALWAYS_NO_CONFIDENCE:
      return [dRep.type]
    default:
      unreachable(dRep)
  }
}

const serializeAnchor = (anchor: Anchor | null) => {
  if (anchor === null) {
    return null
  }
  return [anchor.url, anchor.dataHash]
}

// export needed because of uniqueness check during parsing
export const serializeCertificate = (certificate: Certificate) => {
  switch (certificate.type) {
    case CertificateType.STAKE_REGISTRATION:
    case CertificateType.STAKE_DEREGISTRATION:
      return [
        certificate.type,
        serializeCredential(certificate.stakeCredential),
      ]
    case CertificateType.STAKE_DELEGATION:
      return [
        certificate.type,
        serializeCredential(certificate.stakeCredential),
        certificate.poolKeyHash,
      ]
    case CertificateType.POOL_REGISTRATION:
      return [certificate.type, ...serializePoolParams(certificate.poolParams)]
    case CertificateType.POOL_RETIREMENT:
      return [certificate.type, certificate.poolKeyHash, certificate.epoch]
    case CertificateType.GENESIS_KEY_DELEGATION:
    case CertificateType.MOVE_INSTANTANEOUS_REWARDS_CERT:
      return [certificate.type, ...certificate.restOfData]
    case CertificateType.STAKE_REGISTRATION_CONWAY:
    case CertificateType.STAKE_DEREGISTRATION_CONWAY:
      return [
        certificate.type,
        serializeCredential(certificate.stakeCredential),
        certificate.deposit,
      ]
    case CertificateType.VOTE_DELEGATION:
      return [
        certificate.type,
        serializeCredential(certificate.stakeCredential),
        serializeDRep(certificate.dRep),
      ]
    case CertificateType.STAKE_AND_VOTE_DELEGATION:
      return [
        certificate.type,
        serializeCredential(certificate.stakeCredential),
        certificate.poolKeyHash,
        serializeDRep(certificate.dRep),
      ]
    case CertificateType.STAKE_REGISTRATION_AND_DELEGATION:
      return [
        certificate.type,
        serializeCredential(certificate.stakeCredential),
        certificate.poolKeyHash,
        certificate.deposit,
      ]
    case CertificateType.STAKE_REGISTRATION_WITH_VOTE_DELEGATION:
      return [
        certificate.type,
        serializeCredential(certificate.stakeCredential),
        serializeDRep(certificate.dRep),
        certificate.deposit,
      ]
    case CertificateType.STAKE_REGISTRATION_WITH_STAKE_AND_VOTE_DELEGATION:
      return [
        certificate.type,
        serializeCredential(certificate.stakeCredential),
        certificate.poolKeyHash,
        serializeDRep(certificate.dRep),
        certificate.deposit,
      ]
    case CertificateType.AUTHORIZE_COMMITTEE_HOT:
      return [
        certificate.type,
        serializeCredential(certificate.coldCredential),
        serializeCredential(certificate.hotCredential),
      ]
    case CertificateType.RESIGN_COMMITTEE_COLD:
      return [
        certificate.type,
        serializeCredential(certificate.coldCredential),
        serializeAnchor(certificate.anchor),
      ]
    case CertificateType.DREP_REGISTRATION:
      return [
        certificate.type,
        serializeCredential(certificate.dRepCredential),
        certificate.deposit,
        serializeAnchor(certificate.anchor),
      ]
    case CertificateType.DREP_DEREGISTRATION:
      return [
        certificate.type,
        serializeCredential(certificate.dRepCredential),
        certificate.deposit,
      ]
    case CertificateType.DREP_UPDATE:
      return [
        certificate.type,
        serializeCredential(certificate.dRepCredential),
        serializeAnchor(certificate.anchor),
      ]
    default:
      unreachable(certificate)
  }
}

// export needed because of uniqueness check during parsing
export const serializeCollateralInput = (collateralInput: TransactionInput) => [
  collateralInput.transactionId,
  collateralInput.index,
]

const serializeVoter = (voter: Voter) => [voter.type, voter.hash]

const serializeGovActionId = (govActionId: GovActionId) => [
  govActionId.transactionId,
  govActionId.index,
]

const serializeVotingProcedure = (votingProcedure: VotingProcedure) => [
  votingProcedure.voteOption,
  serializeAnchor(votingProcedure.anchor),
]

const serializeVotingProcedures = (ballots: VoterVotes[]) =>
  new Map(
    ballots.map(({voter, votes}) => [
      serializeVoter(voter),
      new Map(
        votes.map(({govActionId, votingProcedure}) => [
          serializeGovActionId(govActionId),
          serializeVotingProcedure(votingProcedure),
        ]),
      ),
    ]),
  )

// export needed because of uniqueness check during parsing
export const serializeProposalProcedure = (procedure: ProposalProcedure) => [
  procedure.deposit,
  procedure.rewardAccount,
  procedure.govAction,
  serializeAnchor(procedure.anchor),
]

export const serializeTxBody = (txBody: TransactionBody) =>
  filteredMap<TransactionBodyKeys, unknown>([
    [
      TransactionBodyKeys.INPUTS,
      serializeCddlSetBase(txBody.inputs, serializeTxInput),
    ],
    [TransactionBodyKeys.OUTPUTS, txBody.outputs.map(serializeTxOutput)],
    [TransactionBodyKeys.FEE, identity(txBody.fee)],
    [TransactionBodyKeys.TTL, identity(txBody.ttl)],
    [
      TransactionBodyKeys.CERTIFICATES,
      serializeCddlSetBaseOrUndefined(
        txBody.certificates,
        serializeCertificate,
      ),
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
      serializeCddlSetBaseOrUndefined(
        txBody.collateralInputs,
        serializeCollateralInput,
      ),
    ],
    [
      TransactionBodyKeys.REQUIRED_SIGNERS,
      serializeCddlSetBaseOrUndefined(txBody.requiredSigners, identity),
    ],
    [TransactionBodyKeys.NETWORK_ID, identity(txBody.networkId)],
    [
      TransactionBodyKeys.COLLATERAL_RETURN_OUTPUT,
      txBody.collateralReturnOutput &&
        serializeTxOutput(txBody.collateralReturnOutput),
    ],
    [TransactionBodyKeys.TOTAL_COLLATERAL, identity(txBody.totalCollateral)],
    [
      TransactionBodyKeys.REFERENCE_INPUTS,
      serializeCddlSetBaseOrUndefined(txBody.referenceInputs, serializeTxInput),
    ],
    [
      TransactionBodyKeys.VOTING_PROCEDURES,
      txBody.votingProcedures &&
        serializeVotingProcedures(txBody.votingProcedures),
    ],
    [
      TransactionBodyKeys.PROPOSAL_PROCEDURES,
      serializeCddlSetBaseOrUndefined(
        txBody.proposalProcedures,
        serializeProposalProcedure,
      ),
    ],
    [TransactionBodyKeys.TREASURY, identity(txBody.treasury)],
    [TransactionBodyKeys.DONATION, identity(txBody.donation)],
  ])

export const serializeTx = (tx: Transaction) => {
  return [
    serializeTxBody(tx.body),
    tx.witnessSet,
    tx.scriptValidity,
    tx.auxiliaryData,
  ].filter((item) => item !== undefined)
}
