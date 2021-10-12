export type Unparsed = unknown

export type Uint = (number | bigint) & { __type: 'uint' }
export type Int = (number | bigint) & { __type: 'int' }

export type MaxlenString<N> = string & { __maxLength: N }
export type FixlenBuffer<N> = Buffer & { __length: N }
export type MaxlenBuffer<N> = Buffer & { __maxLength: N }
export type MaxsizeUint<N> = Uint & { __maxSize: N }

export const ADDRESS_KEY_HASH_LENGTH = 28
export const SCRIPT_HASH_LENGTH = 28
export const GENESIS_DELEGATE_HASH_LENGTH = 28
export const POOL_KEY_HASH_LENGTH = 28
export const GENESIS_HASH_LENGTH = 28
export const REWARD_ACCOUNT_LENGTH = 29
export const VRF_KEY_HASH_LENGTH = 32
export const METADATA_HASH_LENGTH = 32
export const TX_ID_HASH_LENGTH = 32

export const IPV4_LENGTH = 4
export const IPV6_LENGTH = 16

export const ASSET_NAME_MAX_LENGTH = 32
export const URL_MAX_LENGTH = 64
export const DNS_NAME_MAX_LENGTH = 64

export const PORT_MAX_SIZE = 65535

export type Address = Buffer
export type RewardAccount = FixlenBuffer<typeof REWARD_ACCOUNT_LENGTH>
export type Coin = Uint
export type Epoch = Uint

// Multiasset
export type PolicyId = FixlenBuffer<typeof SCRIPT_HASH_LENGTH>
export type AssetName = MaxlenBuffer<typeof ASSET_NAME_MAX_LENGTH>
export type Token<T> = {
    assetName: AssetName,
    amount: T,
}
export type AssetGroup<T> = {
    policyId: PolicyId,
    tokens: Token<T>[],
}
export type Multiasset<T> = AssetGroup<T>[]

// Transaction input
export type TransactionInput = {
    transactionId: FixlenBuffer<typeof TX_ID_HASH_LENGTH>,
    index: Uint,
}

// Transaction output
export enum AmountType {
    WITHOUT_MULTIASSET,
    WITH_MULTIASSET,
}

export type Amount = {
    type: AmountType.WITHOUT_MULTIASSET,
    coin: Coin,
} | {
    type: AmountType.WITH_MULTIASSET,
    coin: Coin,
    multiasset: Multiasset<Uint>,
}

export type TransactionOutput = {
    address: Address,
    amount: Amount,
}

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
    ADDRESS_KEY_HASH = 0,
    SCRIPT_HASH = 1,
}

export type StakeCredentialAddress = {
    type: StakeCredentialType.ADDRESS_KEY_HASH,
    hash: FixlenBuffer<typeof ADDRESS_KEY_HASH_LENGTH>,
}

export type StakeCredentialScript = {
    type: StakeCredentialType.SCRIPT_HASH,
    hash: FixlenBuffer<typeof SCRIPT_HASH_LENGTH>,
}

export type StakeCredential = StakeCredentialAddress | StakeCredentialScript

export type StakeRegistrationCertificate = {
    type: CertificateType.STAKE_REGISTRATION,
    stakeCredential: StakeCredential,
}

export type StakeDeregistrationCertificate = {
    type: CertificateType.STAKE_DEREGISTRATION,
    stakeCredential: StakeCredential,
}

export type StakeDelegationCertificate = {
    type: CertificateType.STAKE_DELEGATION,
    stakeCredential: StakeCredential,
    poolKeyHash: FixlenBuffer<typeof POOL_KEY_HASH_LENGTH>,
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
    type: RelayType.SINGLE_HOST_ADDRESS,
    port: Port | null,
    ipv4: FixlenBuffer<typeof IPV4_LENGTH> | null,
    ipv6: FixlenBuffer<typeof IPV6_LENGTH> | null,
}

export type RelaySingleHostName = {
    type: RelayType.SINGLE_HOST_NAME,
    port: Port | null,
    dnsName: DNSName,
}

export type RelayMultiHostName = {
    type: RelayType.MULTI_HOST_NAME,
    dnsName: DNSName,
}

export type Relay = RelaySingleHostAddress | RelaySingleHostName | RelayMultiHostName

export type PoolMetadata = {
    url: MaxlenString<typeof URL_MAX_LENGTH>,
    metadataHash: FixlenBuffer<typeof METADATA_HASH_LENGTH>,
}

export type PoolParams = {
    operator: FixlenBuffer<typeof POOL_KEY_HASH_LENGTH>,
    vrfKeyHash: FixlenBuffer<typeof VRF_KEY_HASH_LENGTH>,
    pledge: Coin,
    cost: Coin,
    margin: UnitInterval,
    rewardAccount: RewardAccount,
    poolOwners: FixlenBuffer<typeof ADDRESS_KEY_HASH_LENGTH>[],
    relays: Relay[],
    poolMetadata: PoolMetadata | null,
}

export type PoolRegistrationCertificate = {
    type: CertificateType.POOL_REGISTRATION,
    poolParams: PoolParams,
}

export type PoolRetirementCertificate = {
    type: CertificateType.POOL_RETIREMENT,
    poolKeyHash: FixlenBuffer<typeof POOL_KEY_HASH_LENGTH>,
    epoch: Epoch,
}

export type GenesisKeyDelegation = {
    type: CertificateType.GENESIS_KEY_DELEGATION,
    restOfData: Unparsed[],
}

export type MoveInstantaneousRewardsCertificate = {
    type: CertificateType.MOVE_INSTANTANEOUS_REWARDS_CERT,
    restOfData: Unparsed[],
}

export type Certificate = StakeRegistrationCertificate
    | StakeDeregistrationCertificate
    | StakeDelegationCertificate
    | PoolRegistrationCertificate
    | PoolRetirementCertificate
    | GenesisKeyDelegation
    | MoveInstantaneousRewardsCertificate

// Withdrawal
export type Withdrawal = {
    rewardAccount: RewardAccount,
    amount: Coin,
}

// Mint
export type Mint = Multiasset<Int>

// Transaction body
export type TransactionBody = {
    inputs: TransactionInput[],
    outputs: TransactionOutput[],
    fee: Uint,
    ttl?: Uint,
    certificates?: Certificate[],
    withdrawals?: Withdrawal[],
    update?: Unparsed,
    metadataHash?: FixlenBuffer<typeof METADATA_HASH_LENGTH>,
    validityIntervalStart?: Uint,
    mint?: Mint,
}

export type SignedTransaction = {
    body: TransactionBody,
    witnessSet: Unparsed,
    auxiliaryData: Unparsed,
}

export type RawTransaction = {
    body: TransactionBody,
    nativeScriptWitnesses: Unparsed,
    auxiliaryData: Unparsed,
}

