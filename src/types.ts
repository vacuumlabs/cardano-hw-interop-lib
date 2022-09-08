export type Unparsed = unknown

export type Uint = (number | bigint) & { __type: 'uint' }
export type Int = (number | bigint) & { __type: 'int' }

export type MaxlenString<N> = string & { __maxLength: N }
export type FixlenBuffer<N> = Buffer & { __length: N }
export type MaxlenBuffer<N> = Buffer & { __maxLength: N }
export type MaxsizeUint<N> = Uint & { __maxSize: N }

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
export type KeyHash = FixlenBuffer<typeof KEY_HASH_LENGTH>
export type ScriptHash = FixlenBuffer<typeof SCRIPT_HASH_LENGTH>
export type RewardAccount = FixlenBuffer<typeof REWARD_ACCOUNT_LENGTH>
export type Coin = Uint
export type Epoch = Uint

// Transaction input
export type TransactionInput = {
  transactionId: FixlenBuffer<typeof TX_ID_HASH_LENGTH>
  index: Uint
}

// Multiasset
export type PolicyId = FixlenBuffer<typeof SCRIPT_HASH_LENGTH>
export type AssetName = MaxlenBuffer<typeof ASSET_NAME_MAX_LENGTH>
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
  hash: FixlenBuffer<typeof DATUM_HASH_LENGTH>
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

export enum StakeCredentialType {
  KEY_HASH = 0,
  SCRIPT_HASH = 1,
}

export type StakeCredentialKey = {
  type: StakeCredentialType.KEY_HASH
  hash: KeyHash
}

export type StakeCredentialScript = {
  type: StakeCredentialType.SCRIPT_HASH
  hash: ScriptHash
}

export type StakeCredential = StakeCredentialKey | StakeCredentialScript

export type StakeRegistrationCertificate = {
  type: CertificateType.STAKE_REGISTRATION
  stakeCredential: StakeCredential
}

export type StakeDeregistrationCertificate = {
  type: CertificateType.STAKE_DEREGISTRATION
  stakeCredential: StakeCredential
}

export type StakeDelegationCertificate = {
  type: CertificateType.STAKE_DELEGATION
  stakeCredential: StakeCredential
  poolKeyHash: FixlenBuffer<typeof POOL_KEY_HASH_LENGTH>
}

export type UnitInterval = [Uint, Uint]

export type Port = MaxsizeUint<typeof PORT_MAX_SIZE>

export type DNSName = MaxlenString<typeof DNS_NAME_MAX_LENGTH>

export enum RelayType {
  SINGLE_HOST_ADDRESS = 0,
  SINGLE_HOST_NAME = 1,
  MULTI_HOST_NAME = 2,
}

export type RelaySingleHostAddress = {
  type: RelayType.SINGLE_HOST_ADDRESS
  port: Port | null
  ipv4: FixlenBuffer<typeof IPV4_LENGTH> | null
  ipv6: FixlenBuffer<typeof IPV6_LENGTH> | null
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
  url: MaxlenString<typeof URL_MAX_LENGTH>
  metadataHash: FixlenBuffer<typeof POOL_METADATA_HASH_LENGTH>
}

export type PoolParams = {
  operator: FixlenBuffer<typeof POOL_KEY_HASH_LENGTH>
  vrfKeyHash: FixlenBuffer<typeof VRF_KEY_HASH_LENGTH>
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
  poolKeyHash: FixlenBuffer<typeof POOL_KEY_HASH_LENGTH>
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
export type RequiredSigner = FixlenBuffer<typeof KEY_HASH_LENGTH>

// Transaction body
export type TransactionBody = {
  inputs: TransactionInput[]
  outputs: TransactionOutput[]
  fee: Coin
  ttl?: Uint
  certificates?: Certificate[]
  withdrawals?: Withdrawal[]
  update?: Unparsed
  auxiliaryDataHash?: FixlenBuffer<typeof AUXILIARY_DATA_HASH_LENGTH>
  validityIntervalStart?: Uint
  mint?: Mint
  scriptDataHash?: FixlenBuffer<typeof SCRIPT_DATA_HASH_LENGTH>
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

// raw tx items
// https://github.com/input-output-hk/cardano-node/blob/54119c80057f88af5acdd7d54969dd461e4cf26e/cardano-api/src/Cardano/Api/TxBody.hs#L1591-L1598
// Note that we will probably want to remove this type and support only Transaction.
export type RawTransaction = {
  body: TransactionBody
  scriptWitnesses?: Unparsed // indefinite-length array
  datumWitnesses?: Unparsed // array
  redeemerWitnesses?: Unparsed // array
  scriptValidity?: Unparsed // bool
  auxiliaryData: Unparsed // null / obj
}
