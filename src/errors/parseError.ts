export enum ParseErrorReason {
    INVALID_ADDRESS = 'Invalid address',
    INVALID_REWARD_ACCOUNT = 'Invalid reward account',
    INVALID_COIN = 'Invalid coin',
    INVALID_EPOCH = 'Invalid epoch',

    INVALID_POLICY_ID = 'Invalid policy id',
    INVALID_ASSET_NAME = 'Invalid asset name',
    INVALID_MULTIASSET = 'Invalid multiasset map',

    INVALID_TRANSACTION_ID = 'Invalid transaction id',
    INVALID_TX_INPUT_INDEX = 'Invalid transaction input index',
    INVALID_TX_INPUT = 'Invalid transaction input',

    INVALID_TX_COLLATERAL_INPUT_INDEX = 'Invalid transaction collateral input index',
    INVALID_TX_COLLATERAL_INPUT = 'Invalid transaction collateral input',

    INVALID_OUTPUT_ADDRESS = 'Invalid output address',
    INVALID_OUTPUT_AMOUNT = 'Invalid output amount',
    INVALID_OUTPUT_MULTIASSET = 'Invalid output multiasset',
    INVALID_OUTPUT_DATUM_HASH = 'Invalid output datum hash',
    INVALID_TX_OUTPUT = 'Invalid transaction output',

    INVALID_CERTIFICATE_TYPE = 'Invalid certificate type',
    INVALID_STAKE_CREDENTIAL_TYPE = 'Invalid stake credential type',
    INVALID_STAKE_CREDENTIAL_KEY_HASH = 'Invalid stake credential key hash',
    INVALID_STAKE_CREDENTIAL_SCRIPT_HASH = 'Invalid stake credential script hash',
    INVALID_STAKE_CREDENTIAL = 'Invalid stake credential',
    INVALID_POOL_KEY_HASH = 'Invalid pool key hash',
    INVALID_VRF_KEY_HASH = 'Invalid vrf key hash',
    INVALID_POOL_PARAMS = 'Invalid pool params',
    INVALID_UNIT_INTERVAL = 'Invalid unit interval',
    INVALID_UNIT_INTERVAL_START = 'Invalid unit interval start',
    INVALID_UNIT_INTERVAL_END = 'Invalid unit interval end',
    INVALID_POOL_OWNER = 'Invalid pool owner',
    INVALID_POOL_OWNERS = 'Invalid pool owners',
    INVALID_RELAY_TYPE = 'Invalid relay type',
    INVALID_RELAY_PORT = 'Invalid relay port',
    INVALID_RELAY_IPV4 = 'Invalid relay IPv4',
    INVALID_RELAY_IPV6 = 'Invalid relay IPv6',
    INVALID_RELAY_DNS_NAME = 'Invalid relay DNS name',
    INVALID_RELAY = 'Invalid relay',
    INVALID_RELAYS = 'Invalid relays',
    INVALID_POOL_METADATA_URL = 'Invalid pool metadata url',
    INVALID_POOL_METADATA_METADATA_HASH = 'Invalid pool metadata metadata hash',
    INVALID_POOL_METADATA = 'Invalid pool metadata',
    INVALID_CERTIFICATE = 'Invalid certificate',

    INVALID_WITHDRAWAL_AMOUNT = 'Invalid withdrawal amount',

    INVALID_MINT_AMOUNT = 'Invalid mint amount',

    INVALID_TX_BODY_CBOR = 'Invalid transaction body CBOR',
    INVALID_TX_INPUTS = 'Invalid transaction inputs',
    INVALID_TX_OUTPUTS = 'Invalid transaction outputs',
    INVALID_TX_FEE = 'Invalid transaction fee',
    INVALID_TX_TTL = 'Invalid transaction ttl',
    INVALID_TX_CERTIFICATES = 'Invalid transaction certificates',
    INVALID_TX_WITHDRAWALS = 'Invalid transaction withdrawals',
    INVALID_TX_METADATA_HASH = 'Invalid transaction metadata hash',
    INVALID_TX_VALIDITY_INTERVAL_START = 'Invalid transaction validity interval start',
    INVALID_TX_MINT = 'Invalid transaction mint',
    INVALID_TX_SCRIPT_DATA_HASH = 'Invalid transaction script data hash',
    INVALID_TX_COLLATERAL_INPUTS = 'Invalid transaction collateral inputs',
    INVALID_TX_REQUIRED_SIGNERS = 'Invalid transaction required signers',
    INVALID_TX_NETWORK_ID = 'Invalid transaction network id',

    INVALID_TX_CBOR = 'Invalid transaction CBOR',
    INVALID_RAW_TX_CBOR = 'Invalid raw transaction CBOR',
}

export class ParseError extends Error {
    public constructor(reason: ParseErrorReason) {
        super(reason)
        this.name = 'ParseError'
    }
}
