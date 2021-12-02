import { Encoder } from 'cbor'

import { ParseErrorReason } from './errors'
import type { Parser, WithoutType } from './parsers'
import { isUint } from './parsers'
import { isUintOfMaxSize } from './parsers'
import { createParser, isMapWithKeysOfType, isNumber, parseArray, parseBasedOnType, parseBuffer, parseBufferOfLength, parseBufferOfMaxLength, parseInt, parseMap, parseNullable, parseOptional, parseStringOfMaxLength, parseTuple, parseUint, validate } from './parsers'
import type { Amount, GenesisKeyDelegation, MoveInstantaneousRewardsCertificate, Multiasset, PoolMetadata, PoolParams, PoolRegistrationCertificate, PoolRetirementCertificate, Port, RawTransaction, RelayMultiHostName, RelaySingleHostAddress, RelaySingleHostName, StakeCredentialKey, StakeCredentialScript, StakeDelegationCertificate, StakeDeregistrationCertificate, StakeRegistrationCertificate, Transaction, TransactionBody, TransactionInput, TransactionOutput, Unparsed, Withdrawal } from './types'
import { PORT_MAX_SIZE, REWARD_ACCOUNT_LENGTH } from './types'
import { AmountType } from './types'
import { ASSET_NAME_MAX_LENGTH, CertificateType,  DNS_NAME_MAX_LENGTH, IPV4_LENGTH, IPV6_LENGTH, KEY_HASH_LENGTH, METADATA_HASH_LENGTH, POOL_KEY_HASH_LENGTH, RelayType, SCRIPT_HASH_LENGTH, StakeCredentialType,TX_ID_HASH_LENGTH,  URL_MAX_LENGTH, VRF_KEY_HASH_LENGTH} from './types'

const dontParse: Parser<Unparsed> = (data: unknown) => data

const parseRewardAccount = createParser(parseBufferOfLength, REWARD_ACCOUNT_LENGTH, ParseErrorReason.INVALID_REWARD_ACCOUNT)
const parseCoin = createParser(parseUint, ParseErrorReason.INVALID_COIN)
const parseEpoch = createParser(parseUint, ParseErrorReason.INVALID_COIN)

const parsePolicyId = createParser(parseBufferOfLength, SCRIPT_HASH_LENGTH, ParseErrorReason.INVALID_POLICY_ID)
const parseAssetName = createParser(parseBufferOfMaxLength, ASSET_NAME_MAX_LENGTH, ParseErrorReason.INVALID_ASSET_NAME)

const parseMultiasset = <T>(unparsedMultiasset: unknown, parseAssetValue: Parser<T>, errMsg: ParseErrorReason): Multiasset<T> => {
    const multiassetMap = parseMap(
        unparsedMultiasset,
        parsePolicyId,
        createParser(
            parseMap,
            parseAssetName,
            parseAssetValue,
            errMsg,
        ),
        errMsg,
    )

    return Array.from(multiassetMap).map(([policyId, tokens]) => ({
        policyId,
        tokens: Array.from(tokens).map(([assetName, amount]) => ({assetName, amount})),
    }))
}

const parseTxInput = (unparsedTxInput: unknown): TransactionInput => {
    const [transactionId, index] = parseTuple(
        unparsedTxInput,
        ParseErrorReason.INVALID_TX_INPUTS,
        createParser(parseBufferOfLength, TX_ID_HASH_LENGTH, ParseErrorReason.INVALID_TRANSACTION_ID),
        createParser(parseUint, ParseErrorReason.INVALID_TX_INPUT_INDEX),
    )

    return {transactionId, index}
}

const parseAmountWithMultiasset = (unparsedAmount: unknown): Amount => {
    const [coin, multiasset] = parseTuple(
        unparsedAmount,
        ParseErrorReason.INVALID_OUTPUT_AMOUNT,
        createParser(parseUint, ParseErrorReason.INVALID_OUTPUT_AMOUNT),
        createParser(parseMultiasset, createParser(parseUint, ParseErrorReason.INVALID_OUTPUT_MULTIASSET), ParseErrorReason.INVALID_OUTPUT_MULTIASSET),
    )

    return {type: AmountType.WITH_MULTIASSET, coin, multiasset}
}

const parseAmountWithoutMultiasset = (unparsedAmount: unknown): Amount => ({
    type: AmountType.WITHOUT_MULTIASSET,
    coin: parseUint(unparsedAmount, ParseErrorReason.INVALID_OUTPUT_AMOUNT),
})

const parseAmount = (unparsedAmount: unknown): Amount =>
    isUint(unparsedAmount)
        ? parseAmountWithoutMultiasset(unparsedAmount)
        : parseAmountWithMultiasset(unparsedAmount)

const parseTxOutput = (unparsedTxOutput: unknown): TransactionOutput => {
    const [address, amount] = parseTuple(
        unparsedTxOutput,
        ParseErrorReason.INVALID_TX_OUTPUT,
        createParser(parseBuffer, ParseErrorReason.INVALID_OUTPUT_ADDRESS),
        parseAmount,
    )

    return {address, amount}
}

export const parseWithdrawals = (unparsedWithdrawals: unknown): Withdrawal[] => {
    const withdrawalsMap = parseMap(unparsedWithdrawals, parseRewardAccount, createParser(parseUint, ParseErrorReason.INVALID_WITHDRAWAL_AMOUNT), ParseErrorReason.INVALID_TX_WITHDRAWALS)

    return Array.from(withdrawalsMap).map(([rewardAccount, amount]) => ({rewardAccount, amount}))
}

const parseStakeCredentialType = (unparsedStakeCredentialType: unknown): StakeCredentialType => {
    validate(isNumber(unparsedStakeCredentialType), ParseErrorReason.INVALID_STAKE_CREDENTIAL_TYPE)
    validate(unparsedStakeCredentialType in StakeCredentialType, ParseErrorReason.INVALID_STAKE_CREDENTIAL_TYPE)
    return unparsedStakeCredentialType
}

const parseStakeCredentialKey = (data: unknown[]): WithoutType<StakeCredentialKey> => ({
    hash: parseBufferOfLength(data[0], KEY_HASH_LENGTH, ParseErrorReason.INVALID_STAKE_CREDENTIAL_KEY_HASH),
})

const parseStakeCredentialScript = (data: unknown[]): WithoutType<StakeCredentialScript> => ({
    hash: parseBufferOfLength(data[0], SCRIPT_HASH_LENGTH, ParseErrorReason.INVALID_STAKE_CREDENTIAL_SCRIPT_HASH),
})

const parseStakeCredential = createParser(
    parseBasedOnType,
    ParseErrorReason.INVALID_STAKE_CREDENTIAL,
    parseStakeCredentialType,
    parseStakeCredentialKey,
    parseStakeCredentialScript,
)

const parsePoolKeyHash = createParser(parseBufferOfLength, POOL_KEY_HASH_LENGTH, ParseErrorReason.INVALID_POOL_KEY_HASH)

const parseUnitInterval = createParser(
    parseTuple,
    ParseErrorReason.INVALID_UNIT_INTERVAL,
    createParser(parseUint, ParseErrorReason.INVALID_UNIT_INTERVAL_START),
    createParser(parseUint, ParseErrorReason.INVALID_UNIT_INTERVAL_END),
)

const parsePort = (data: unknown): Port => {
    validate(isUintOfMaxSize(data, PORT_MAX_SIZE), ParseErrorReason.INVALID_RELAY_PORT)
    return data
}

const parseDnsName = createParser(parseStringOfMaxLength, DNS_NAME_MAX_LENGTH, ParseErrorReason.INVALID_RELAY_DNS_NAME)

const parseRelayType = (unparsedRelayType: unknown): RelayType => {
    validate(isNumber(unparsedRelayType), ParseErrorReason.INVALID_RELAY_TYPE)
    validate(unparsedRelayType in RelayType, ParseErrorReason.INVALID_RELAY_TYPE)
    return unparsedRelayType
}

const parseRelaySingleHostAddress = (data: unknown[]): WithoutType<RelaySingleHostAddress> => ({
    port: parseNullable(data[0], parsePort),
    ipv4: parseNullable(data[1], createParser(parseBufferOfLength, IPV4_LENGTH, ParseErrorReason.INVALID_RELAY_IPV4)),
    ipv6: parseNullable(data[2], createParser(parseBufferOfLength, IPV6_LENGTH, ParseErrorReason.INVALID_RELAY_IPV6)),
})

const parseRelaySingleHostName = (data: unknown[]): WithoutType<RelaySingleHostName> => ({
    port: parseNullable(data[0], parsePort),
    dnsName: parseDnsName(data[1]),
})

const parseRelayMultiHostName = (data: unknown[]): WithoutType<RelayMultiHostName> => ({
    dnsName: parseDnsName(data[0]),
})

const parseRelay = createParser(
    parseBasedOnType,
    ParseErrorReason.INVALID_RELAY,
    parseRelayType,
    parseRelaySingleHostAddress,
    parseRelaySingleHostName,
    parseRelayMultiHostName,
)

const parsePoolMetadata = (unparsedPoolMetadata: unknown): PoolMetadata => {
    const [url, metadataHash] = parseTuple(
        unparsedPoolMetadata,
        ParseErrorReason.INVALID_POOL_METADATA,
        createParser(parseStringOfMaxLength, URL_MAX_LENGTH, ParseErrorReason.INVALID_POOL_METADATA_URL),
        createParser(parseBufferOfLength, METADATA_HASH_LENGTH, ParseErrorReason.INVALID_POOL_METADATA_METADATA_HASH),
    )

    return {url, metadataHash}
}

const parsePoolParams = (unparsedPoolParams: unknown): PoolParams => {
    const [operator, vrfKeyHash, pledge, cost, margin, rewardAccount, poolOwners, relays, poolMetadata] = parseTuple(
        unparsedPoolParams,
        ParseErrorReason.INVALID_POOL_PARAMS,
        parsePoolKeyHash,
        createParser(parseBufferOfLength, VRF_KEY_HASH_LENGTH, ParseErrorReason.INVALID_VRF_KEY_HASH),
        parseCoin,
        parseCoin,
        parseUnitInterval,
        parseRewardAccount,
        createParser(parseArray, createParser(parseBufferOfLength, KEY_HASH_LENGTH, ParseErrorReason.INVALID_POOL_OWNER), ParseErrorReason.INVALID_POOL_OWNERS),
        createParser(parseArray, parseRelay, ParseErrorReason.INVALID_RELAYS),
        createParser(parseNullable, parsePoolMetadata),
    )

    return {operator, vrfKeyHash, pledge, cost, margin, rewardAccount, poolOwners, relays, poolMetadata}
}

const parseCertificateType = (unparsedCertificateType: unknown): CertificateType => {
    validate(isNumber(unparsedCertificateType), ParseErrorReason.INVALID_CERTIFICATE_TYPE)
    validate(unparsedCertificateType in CertificateType, ParseErrorReason.INVALID_CERTIFICATE_TYPE)
    return unparsedCertificateType
}

const parseStakeRegistrationCertificate = (data: unknown[]): WithoutType<StakeRegistrationCertificate> => ({
    stakeCredential: parseStakeCredential(data[0]),
})

const parseStakeDeregistrationCertificate = (data: unknown[]): WithoutType<StakeDeregistrationCertificate> => ({
    stakeCredential: parseStakeCredential(data[0]),
})

const parseStakeDelegationCertificate = (data: unknown[]): WithoutType<StakeDelegationCertificate> => ({
    stakeCredential: parseStakeCredential(data[0]),
    poolKeyHash: parsePoolKeyHash(data[1]),
})

const parsePoolRegistrationCertificate = (data: unknown[]): WithoutType<PoolRegistrationCertificate> => ({
    poolParams: parsePoolParams(data),
})

const parsePoolRetirementCertificate = (data: unknown[]): WithoutType<PoolRetirementCertificate> => ({
    poolKeyHash: parsePoolKeyHash(data[0]),
    epoch: parseEpoch(data[1]),
})

const parseGenesisKeyDelegation = (data: unknown[]): WithoutType<GenesisKeyDelegation> => ({
    restOfData: data,
})

const parseMoveInstantaneousRewardsCertificate = (data: unknown[]): WithoutType<MoveInstantaneousRewardsCertificate> => ({
    restOfData: data,
})

const parseCertificate = createParser(
    parseBasedOnType,
    ParseErrorReason.INVALID_CERTIFICATE,
    parseCertificateType,
    parseStakeRegistrationCertificate,
    parseStakeDeregistrationCertificate,
    parseStakeDelegationCertificate,
    parsePoolRegistrationCertificate,
    parsePoolRetirementCertificate,
    parseGenesisKeyDelegation,
    parseMoveInstantaneousRewardsCertificate,
)

export const parseInputs = createParser(parseArray, parseTxInput, ParseErrorReason.INVALID_TX_INPUTS)
export const parseOutputs = createParser(parseArray, parseTxOutput, ParseErrorReason.INVALID_TX_OUTPUTS)
export const parseFee = createParser(parseUint, ParseErrorReason.INVALID_TX_FEE)
export const parseTtl = createParser(parseUint, ParseErrorReason.INVALID_TX_TTL)
export const parseCertificates = createParser(parseArray, parseCertificate, ParseErrorReason.INVALID_TX_CERTIFICATES)
export const parseMetadataHash = createParser(parseBufferOfLength, METADATA_HASH_LENGTH, ParseErrorReason.INVALID_TX_METADATA_HASH)
export const parseValidityIntervalStart = createParser(parseUint, ParseErrorReason.INVALID_TX_VALIDITY_INTERVAL_START)
export const parseMint = createParser(parseMultiasset, createParser(parseInt, ParseErrorReason.INVALID_MINT_AMOUNT), ParseErrorReason.INVALID_TX_MINT)

export const parseTxBody = (unparsedTxBody: unknown): TransactionBody => {
    validate(isMapWithKeysOfType(unparsedTxBody, isNumber), ParseErrorReason.INVALID_TX_BODY_CBOR)

    return {
        inputs: parseInputs(unparsedTxBody.get(0)),
        outputs: parseOutputs(unparsedTxBody.get(1)),
        fee: parseFee(unparsedTxBody.get(2)),
        ttl: parseOptional(unparsedTxBody.get(3), parseTtl),
        certificates: parseOptional(unparsedTxBody.get(4), parseCertificates),
        withdrawals: parseOptional(unparsedTxBody.get(5), parseWithdrawals),
        update: unparsedTxBody.get(6),
        metadataHash: parseOptional(unparsedTxBody.get(7), parseMetadataHash),
        validityIntervalStart: parseOptional(unparsedTxBody.get(8), parseValidityIntervalStart),
        mint: parseOptional(unparsedTxBody.get(9), parseMint),
    }
}

export const parseTx = (unparsedTx: unknown): Transaction => {
    const [body, witnessSet, auxiliaryData] = parseTuple(
        unparsedTx,
        ParseErrorReason.INVALID_TX_CBOR,
        parseTxBody,
        dontParse,
        dontParse,
    )

    return {body, witnessSet, auxiliaryData}
}

export const parseRawTx = (unparsedRawTx: unknown): RawTransaction => {
    const [body, item1, item2] = parseTuple(
        unparsedRawTx,
        ParseErrorReason.INVALID_RAW_TX_CBOR,
        parseTxBody,
        dontParse,
        dontParse,
    )
    // older versions of cardano-cli did not include nativeScriptWitnesses
    if (item2 === undefined) {
        return {body, nativeScriptWitnesses: undefined, auxiliaryData: item1}
    }
    // cardano-cli expects indefinite-length nativeScriptWitnesses
    (item1 as any).encodeCBOR = Encoder.encodeIndefinite
    return {body, nativeScriptWitnesses: item1, auxiliaryData: item2}
}
