export type Unparsed = unknown

export type Uint = (number | bigint) & {__type: 'uint'}
export type Int = (number | bigint) & {__type: 'int'}

export type MaxLenString<N> = string & {__maxLength: N}
export type FixLenBuffer<N> = Buffer & {__length: N}
export type MaxLenBuffer<N> = Buffer & {__maxLength: N}
export type MaxSizeUint<N> = Uint & {__maxSize: N}

export type CddlSetBase<T> = {
  items: T[]
  hasTag: boolean // 258 tag, existing since Conway, using the tag is optional in Conway
}
export type CddlSet<T> = CddlSetBase<T> & {
  _nonEmpty: false
  _ordered: false
}
export type CddlNonEmptySet<T> = CddlSetBase<T> & {
  _nonEmpty: true
  _ordered: false
}
export type CddlNonEmptyOrderedSet<T> = CddlSetBase<T> & {
  _nonEmpty: true
  _ordered: true
}

export const KEY_HASH_LENGTH = 28
export const SCRIPT_HASH_LENGTH = 28
export const GENESIS_DELEGATE_HASH_LENGTH = 28
export const POOL_KEY_HASH_LENGTH = 28
export const POOL_METADATA_HASH_LENGTH = 32
export const GENESIS_HASH_LENGTH = 28
export const REWARD_ACCOUNT_LENGTH = 29
export const VRF_KEY_HASH_LENGTH = 32
export const AUXILIARY_DATA_HASH_LENGTH = 32
export const TX_ID_HASH_LENGTH = 32
export const DATUM_HASH_LENGTH = 32
export const SCRIPT_DATA_HASH_LENGTH = 32
export const ANCHOR_DATA_HASH_LENGTH = 32

export const IPV4_LENGTH = 4
export const IPV6_LENGTH = 16

export const ASSET_NAME_MAX_LENGTH = 32
export const URL_MAX_LENGTH = 64
export const DNS_NAME_MAX_LENGTH = 64

export const PORT_MAX_SIZE = 65535

export type Address = Buffer
export type KeyHash = FixLenBuffer<typeof KEY_HASH_LENGTH>
export type ScriptHash = FixLenBuffer<typeof SCRIPT_HASH_LENGTH>
export type RewardAccount = FixLenBuffer<typeof REWARD_ACCOUNT_LENGTH>
export type Coin = Uint
export type Epoch = Uint

// Transaction input
export type TransactionInput = {
  transactionId: FixLenBuffer<typeof TX_ID_HASH_LENGTH>
  index: Uint
}

// Multiasset
export type PolicyId = FixLenBuffer<typeof SCRIPT_HASH_LENGTH>
export type AssetName = MaxLenBuffer<typeof ASSET_NAME_MAX_LENGTH>
export type Token<T extends Int | Uint> = {
  assetName: AssetName
  amount: T
}
export type AssetGroup<T extends Int | Uint> = {
  policyId: PolicyId
  tokens: Token<T>[]
}
export type Multiasset<T extends Int | Uint> = AssetGroup<T>[]

// Amount
export enum AmountType {
  WITHOUT_MULTIASSET,
  WITH_MULTIASSET,
}

export type Amount =
  | {
      type: AmountType.WITHOUT_MULTIASSET
      coin: Coin
    }
  | {
      type: AmountType.WITH_MULTIASSET
      coin: Coin
      multiasset: Multiasset<Uint>
    }

// Datum
export enum DatumType {
  HASH = 0,
  INLINE = 1,
}

export type DatumHash = {
  type: DatumType.HASH
  hash: FixLenBuffer<typeof DATUM_HASH_LENGTH>
}

export type DatumInline = {
  type: DatumType.INLINE
  bytes: Buffer
}

export type Datum = DatumHash | DatumInline

// Transaction output
export enum TxOutputFormat {
  ARRAY_LEGACY,
  MAP_BABBAGE,
}

export type LegacyTransactionOutput = {
  format: TxOutputFormat.ARRAY_LEGACY
  address: Address
  amount: Amount
  datumHash?: DatumHash
}

export type ReferenceScript = Buffer

export type BabbageTransactionOutput = {
  format: TxOutputFormat.MAP_BABBAGE
  address: Address
  amount: Amount
  datum?: Datum
  referenceScript?: ReferenceScript
}

export type TransactionOutput =
  | LegacyTransactionOutput
  | BabbageTransactionOutput

// Certificate
export enum CertificateType {
  STAKE_REGISTRATION = 0,
  STAKE_DEREGISTRATION = 1,
  STAKE_DELEGATION = 2,
  POOL_REGISTRATION = 3,
  POOL_RETIREMENT = 4,
  GENESIS_KEY_DELEGATION = 5, // deprecated since Conway
  MOVE_INSTANTANEOUS_REWARDS_CERT = 6, // deprecated since Conway
  STAKE_REGISTRATION_CONWAY = 7,
  STAKE_DEREGISTRATION_CONWAY = 8,
  VOTE_DELEGATION = 9,
  STAKE_AND_VOTE_DELEGATION = 10,
  STAKE_REGISTRATION_AND_DELEGATION = 11,
  STAKE_REGISTRATION_WITH_VOTE_DELEGATION = 12,
  STAKE_REGISTRATION_WITH_STAKE_AND_VOTE_DELEGATION = 13,
  AUTHORIZE_COMMITTEE_HOT = 14,
  RESIGN_COMMITTEE_COLD = 15,
  DREP_REGISTRATION = 16,
  DREP_DEREGISTRATION = 17,
  DREP_UPDATE = 18,
}

export enum CredentialType {
  KEY_HASH = 0,
  SCRIPT_HASH = 1,
}

export type KeyCredential = {
  type: CredentialType.KEY_HASH
  hash: KeyHash
}

export type ScriptCredential = {
  type: CredentialType.SCRIPT_HASH
  hash: ScriptHash
}

export type Credential = KeyCredential | ScriptCredential

export type StakeRegistrationCertificate = {
  type: CertificateType.STAKE_REGISTRATION
  stakeCredential: Credential
}

export type StakeDeregistrationCertificate = {
  type: CertificateType.STAKE_DEREGISTRATION
  stakeCredential: Credential
}

export type StakeDelegationCertificate = {
  type: CertificateType.STAKE_DELEGATION
  stakeCredential: Credential
  poolKeyHash: FixLenBuffer<typeof POOL_KEY_HASH_LENGTH>
}

export type UnitInterval = [Uint, Uint]

export type Port = MaxSizeUint<typeof PORT_MAX_SIZE>

export type DNSName = MaxLenString<typeof DNS_NAME_MAX_LENGTH>

export enum RelayType {
  SINGLE_HOST_ADDRESS = 0,
  SINGLE_HOST_NAME = 1,
  MULTI_HOST_NAME = 2,
}

export type RelaySingleHostAddress = {
  type: RelayType.SINGLE_HOST_ADDRESS
  port: Port | null
  ipv4: FixLenBuffer<typeof IPV4_LENGTH> | null
  ipv6: FixLenBuffer<typeof IPV6_LENGTH> | null
}

export type RelaySingleHostName = {
  type: RelayType.SINGLE_HOST_NAME
  port: Port | null
  dnsName: DNSName
}

export type RelayMultiHostName = {
  type: RelayType.MULTI_HOST_NAME
  dnsName: DNSName
}

export type Relay =
  | RelaySingleHostAddress
  | RelaySingleHostName
  | RelayMultiHostName

export type PoolMetadata = {
  url: MaxLenString<typeof URL_MAX_LENGTH>
  metadataHash: FixLenBuffer<typeof POOL_METADATA_HASH_LENGTH>
}

export type PoolParams = {
  operator: FixLenBuffer<typeof POOL_KEY_HASH_LENGTH>
  vrfKeyHash: FixLenBuffer<typeof VRF_KEY_HASH_LENGTH>
  pledge: Coin
  cost: Coin
  margin: UnitInterval
  rewardAccount: RewardAccount
  poolOwners: CddlSet<KeyHash>
  relays: Relay[]
  poolMetadata: PoolMetadata | null
}

export type PoolRegistrationCertificate = {
  type: CertificateType.POOL_REGISTRATION
  poolParams: PoolParams
}

export type PoolRetirementCertificate = {
  type: CertificateType.POOL_RETIREMENT
  poolKeyHash: FixLenBuffer<typeof POOL_KEY_HASH_LENGTH>
  epoch: Epoch
}

export type GenesisKeyDelegation = {
  type: CertificateType.GENESIS_KEY_DELEGATION
  restOfData: Unparsed[]
}

export type MoveInstantaneousRewardsCertificate = {
  type: CertificateType.MOVE_INSTANTANEOUS_REWARDS_CERT
  restOfData: Unparsed[]
}

export type StakeRegistrationConwayCertificate = {
  type: CertificateType.STAKE_REGISTRATION_CONWAY
  stakeCredential: Credential
  deposit: Coin
}

export type StakeDeregistrationConwayCertificate = {
  type: CertificateType.STAKE_DEREGISTRATION_CONWAY
  stakeCredential: Credential
  deposit: Coin
}

export enum DRepType {
  KEY_HASH = 0,
  SCRIPT_HASH = 1,
  ALWAYS_ABSTAIN = 2,
  ALWAYS_NO_CONFIDENCE = 3,
}

export type KeyHashDRep = {
  type: DRepType.KEY_HASH
  keyHash: KeyHash
}

export type ScriptHashDRep = {
  type: DRepType.SCRIPT_HASH
  scriptHash: ScriptHash
}

export type AlwaysAbstainDRep = {
  type: DRepType.ALWAYS_ABSTAIN
}

export type AlwaysNoConfidenceDRep = {
  type: DRepType.ALWAYS_NO_CONFIDENCE
}

export type DRep =
  | KeyHashDRep
  | ScriptHashDRep
  | AlwaysAbstainDRep
  | AlwaysNoConfidenceDRep

export type VoteDelegationCertificate = {
  type: CertificateType.VOTE_DELEGATION
  stakeCredential: Credential
  dRep: DRep
}

export type StakeAndVoteDelegationCertificate = {
  type: CertificateType.STAKE_AND_VOTE_DELEGATION
  stakeCredential: Credential
  poolKeyHash: FixLenBuffer<typeof POOL_KEY_HASH_LENGTH>
  dRep: DRep
}

export type StakeRegistrationAndDelegationCertificate = {
  type: CertificateType.STAKE_REGISTRATION_AND_DELEGATION
  stakeCredential: Credential
  poolKeyHash: FixLenBuffer<typeof POOL_KEY_HASH_LENGTH>
  deposit: Coin
}

export type StakeRegistrationWithVoteDelegationCertificate = {
  type: CertificateType.STAKE_REGISTRATION_WITH_VOTE_DELEGATION
  stakeCredential: Credential
  dRep: DRep
  deposit: Coin
}

export type StakeRegistrationWithStakeAndVoteDelegationCertificate = {
  type: CertificateType.STAKE_REGISTRATION_WITH_STAKE_AND_VOTE_DELEGATION
  stakeCredential: Credential
  poolKeyHash: FixLenBuffer<typeof POOL_KEY_HASH_LENGTH>
  dRep: DRep
  deposit: Coin
}

export type Anchor = {
  url: MaxLenString<typeof URL_MAX_LENGTH>
  dataHash: FixLenBuffer<typeof ANCHOR_DATA_HASH_LENGTH>
}

export type AuthorizeCommitteeHotCertificate = {
  type: CertificateType.AUTHORIZE_COMMITTEE_HOT
  coldCredential: Credential
  hotCredential: Credential
}

export type ResignCommitteeColdCertificate = {
  type: CertificateType.RESIGN_COMMITTEE_COLD
  coldCredential: Credential
  anchor: Anchor | null
}

export type DRepRegistrationCertificate = {
  type: CertificateType.DREP_REGISTRATION
  dRepCredential: Credential
  deposit: Coin
  anchor: Anchor | null
}

export type DRepDeregistrationCertificate = {
  type: CertificateType.DREP_DEREGISTRATION
  dRepCredential: Credential
  deposit: Coin
}

export type DRepUpdateCertificate = {
  type: CertificateType.DREP_UPDATE
  dRepCredential: Credential
  anchor: Anchor | null
}

export type Certificate =
  | StakeRegistrationCertificate
  | StakeDeregistrationCertificate
  | StakeDelegationCertificate
  | PoolRegistrationCertificate
  | PoolRetirementCertificate
  | GenesisKeyDelegation
  | MoveInstantaneousRewardsCertificate
  | StakeRegistrationConwayCertificate
  | StakeDeregistrationConwayCertificate
  | VoteDelegationCertificate
  | StakeAndVoteDelegationCertificate
  | StakeRegistrationAndDelegationCertificate
  | StakeRegistrationWithVoteDelegationCertificate
  | StakeRegistrationWithStakeAndVoteDelegationCertificate
  | AuthorizeCommitteeHotCertificate
  | ResignCommitteeColdCertificate
  | DRepRegistrationCertificate
  | DRepDeregistrationCertificate
  | DRepUpdateCertificate

// Withdrawal
export type Withdrawal = {
  rewardAccount: RewardAccount
  amount: Coin
}

// Mint
export type Mint = Multiasset<Int>

// Required signer
export type RequiredSigner = FixLenBuffer<typeof KEY_HASH_LENGTH>

export enum VoterType {
  COMMITTEE_KEY = 0,
  COMMITTEE_SCRIPT = 1,
  DREP_KEY = 2,
  DREP_SCRIPT = 3,
  STAKE_POOL = 4,
}

export type CommitteeKeyVoter = {
  type: VoterType.COMMITTEE_KEY
  hash: KeyHash
}

export type CommitteeScriptVoter = {
  type: VoterType.COMMITTEE_SCRIPT
  hash: ScriptHash
}

export type DRepKeyVoter = {
  type: VoterType.DREP_KEY
  hash: KeyHash
}

export type DRepScriptVoter = {
  type: VoterType.DREP_SCRIPT
  hash: ScriptHash
}

export type StakePoolVoter = {
  type: VoterType.STAKE_POOL
  hash: KeyHash
}

export type Voter =
  | CommitteeKeyVoter
  | CommitteeScriptVoter
  | DRepKeyVoter
  | DRepScriptVoter
  | StakePoolVoter

// Governance action id
export type GovActionId = {
  transactionId: FixLenBuffer<typeof TX_ID_HASH_LENGTH>
  index: Uint
}

export enum VoteOption {
  NO = 0,
  YES = 1,
  ABSTAIN = 2,
}

export type VotingProcedure = {
  voteOption: VoteOption
  anchor: Anchor | null
}

export type Vote = {
  govActionId: GovActionId
  votingProcedure: VotingProcedure
}

export type VoterVotes = {
  voter: Voter
  votes: Vote[]
}

export type ProposalProcedure = {
  deposit: Coin
  rewardAccount: RewardAccount
  govAction: Unparsed
  anchor: Anchor
}

// Transaction body
export type TransactionBody = {
  inputs: CddlSet<TransactionInput>
  outputs: TransactionOutput[]
  fee: Coin
  ttl?: Uint
  certificates?: CddlNonEmptyOrderedSet<Certificate>
  withdrawals?: Withdrawal[]
  update?: Unparsed
  auxiliaryDataHash?: FixLenBuffer<typeof AUXILIARY_DATA_HASH_LENGTH>
  validityIntervalStart?: Uint
  mint?: Mint
  scriptDataHash?: FixLenBuffer<typeof SCRIPT_DATA_HASH_LENGTH>
  collateralInputs?: CddlNonEmptySet<TransactionInput>
  requiredSigners?: CddlNonEmptySet<RequiredSigner>
  networkId?: Uint
  collateralReturnOutput?: TransactionOutput
  totalCollateral?: Coin
  referenceInputs?: CddlNonEmptySet<TransactionInput>
  votingProcedures?: VoterVotes[]
  proposalProcedures?: CddlNonEmptyOrderedSet<ProposalProcedure>
  treasury?: Coin
  donation?: Coin
}

export type Transaction = {
  body: TransactionBody
  witnessSet: Unparsed
  scriptValidity?: Unparsed
  auxiliaryData: Unparsed
}
