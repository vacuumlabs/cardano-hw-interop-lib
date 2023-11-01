export type Unparsed = unknown

export type Uint = (number | bigint) & {__type: 'uint'}
export type Int = (number | bigint) & {__type: 'int'}

export type MaxLenString<N> = string & {__maxLength: N}
export type FixLenBuffer<N> = Buffer & {__length: N}
export type MaxLenBuffer<N> = Buffer & {__maxLength: N}
export type MaxSizeUint<N> = Uint & {__maxSize: N}

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
export type Token<T> = {
  assetName: AssetName
  amount: T
}
export type AssetGroup<T> = {
  policyId: PolicyId
  tokens: Token<T>[]
}
export type Multiasset<T> = AssetGroup<T>[]

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
  GENESIS_KEY_DELEGATION = 5,
  MOVE_INSTANTANEOUS_REWARDS_CERT = 6,
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
  poolOwners: KeyHash[]
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

export type Certificate =
  | StakeRegistrationCertificate
  | StakeDeregistrationCertificate
  | StakeDelegationCertificate
  | PoolRegistrationCertificate
  | PoolRetirementCertificate
  | GenesisKeyDelegation
  | MoveInstantaneousRewardsCertificate

// Withdrawal
export type Withdrawal = {
  rewardAccount: RewardAccount
  amount: Coin
}

// Mint
export type Mint = Multiasset<Int>

// Required signer
export type RequiredSigner = FixLenBuffer<typeof KEY_HASH_LENGTH>

// Transaction body
export type TransactionBody = {
  inputs: TransactionInput[]
  outputs: TransactionOutput[]
  fee: Coin
  ttl?: Uint
  certificates?: Certificate[]
  withdrawals?: Withdrawal[]
  update?: Unparsed
  auxiliaryDataHash?: FixLenBuffer<typeof AUXILIARY_DATA_HASH_LENGTH>
  validityIntervalStart?: Uint
  mint?: Mint
  scriptDataHash?: FixLenBuffer<typeof SCRIPT_DATA_HASH_LENGTH>
  collateralInputs?: TransactionInput[]
  requiredSigners?: RequiredSigner[]
  networkId?: Uint
  collateralReturnOutput?: TransactionOutput
  totalCollateral?: Coin
  referenceInputs?: TransactionInput[]
}

export type Transaction = {
  body: TransactionBody
  witnessSet: Unparsed
  scriptValidity?: Unparsed
  auxiliaryData: Unparsed
}
