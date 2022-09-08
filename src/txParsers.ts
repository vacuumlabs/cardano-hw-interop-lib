import { ParseErrorReason } from './errors'
import type { Parser, WithoutType } from './parsers'
import {
  createParser,
  isArray,
  isMapWithKeysOfType,
  isNumber,
  isUint,
  isUintOfMaxSize,
  parseArray,
  parseBasedOnType,
  parseBuffer,
  parseBufferOfLength,
  parseBufferOfMaxLength,
  parseEmbeddedCborBytes,
  parseInt,
  parseMap,
  parseNullable,
  parseOptional,
  parseStringOfMaxLength,
  parseTuple,
  parseUint,
  validate,
} from './parsers'
import type {
  Amount,
  BabbageTransactionOutput,
  DatumHash,
  DatumInline,
  GenesisKeyDelegation,
  LegacyTransactionOutput,
  MoveInstantaneousRewardsCertificate,
  Multiasset,
  PoolMetadata,
  PoolParams,
  PoolRegistrationCertificate,
  PoolRetirementCertificate,
  Port,
  RawTransaction,
  RelayMultiHostName,
  RelaySingleHostAddress,
  RelaySingleHostName,
  RequiredSigner,
  StakeCredentialKey,
  StakeCredentialScript,
  StakeDelegationCertificate,
  StakeDeregistrationCertificate,
  StakeRegistrationCertificate,
  Transaction,
  TransactionBody,
  TransactionInput,
  TransactionOutput,
  Unparsed,
  Withdrawal,
} from './types'
import {
  AmountType,
  ASSET_NAME_MAX_LENGTH,
  CertificateType,
  DATUM_HASH_LENGTH,
  DatumType,
  DNS_NAME_MAX_LENGTH,
  IPV4_LENGTH,
  IPV6_LENGTH,
  KEY_HASH_LENGTH,
  METADATA_HASH_LENGTH,
  POOL_KEY_HASH_LENGTH,
  PORT_MAX_SIZE,
  RelayType,
  REWARD_ACCOUNT_LENGTH,
  SCRIPT_DATA_HASH_LENGTH,
  SCRIPT_HASH_LENGTH,
  StakeCredentialType,
  TX_ID_HASH_LENGTH,
  TxOutputFormat,
  URL_MAX_LENGTH,
  VRF_KEY_HASH_LENGTH,
} from './types'
import {
  addIndefiniteLengthFlag,
  BabbageTransactionOutputKeys,
  TransactionBodyKeys,
  undefinedOnlyAtTheEnd,
} from './utils'

const dontParse: Parser<Unparsed> = (data: unknown) => data

const parseRewardAccount = createParser(
  parseBufferOfLength,
  REWARD_ACCOUNT_LENGTH,
  ParseErrorReason.INVALID_REWARD_ACCOUNT,
)
const parseCoin = createParser(parseUint, ParseErrorReason.INVALID_COIN)
const parseEpoch = createParser(parseUint, ParseErrorReason.INVALID_COIN)

const parsePolicyId = createParser(
  parseBufferOfLength,
  SCRIPT_HASH_LENGTH,
  ParseErrorReason.INVALID_POLICY_ID,
)
const parseAssetName = createParser(
  parseBufferOfMaxLength,
  ASSET_NAME_MAX_LENGTH,
  ParseErrorReason.INVALID_ASSET_NAME,
)

const parseMultiasset = <T>(
  unparsedMultiasset: unknown,
  parseAssetValue: Parser<T>,
  errMsg: ParseErrorReason,
): Multiasset<T> => {
  const multiassetMap = parseMap(
    unparsedMultiasset,
    parsePolicyId,
    createParser(parseMap, parseAssetName, parseAssetValue, errMsg),
    errMsg,
  )

  return Array.from(multiassetMap).map(([policyId, tokens]) => ({
    policyId,
    tokens: Array.from(tokens).map(([assetName, amount]) => ({
      assetName,
      amount,
    })),
  }))
}

const parseTxInput = (unparsedTxInput: unknown): TransactionInput => {
  const [transactionId, index] = parseTuple(
    unparsedTxInput,
    ParseErrorReason.INVALID_TX_INPUT,
    createParser(
      parseBufferOfLength,
      TX_ID_HASH_LENGTH,
      ParseErrorReason.INVALID_TRANSACTION_ID,
    ),
    createParser(parseUint, ParseErrorReason.INVALID_TX_INPUT_INDEX),
  )

  return { transactionId, index }
}

const parseAddress = createParser(
  parseBuffer,
  ParseErrorReason.INVALID_OUTPUT_ADDRESS,
)

const parseAmountWithMultiasset = (unparsedAmount: unknown): Amount => {
  const [coin, multiasset] = parseTuple(
    unparsedAmount,
    ParseErrorReason.INVALID_OUTPUT_AMOUNT,
    createParser(parseUint, ParseErrorReason.INVALID_OUTPUT_AMOUNT),
    createParser(
      parseMultiasset,
      createParser(parseUint, ParseErrorReason.INVALID_OUTPUT_MULTIASSET),
      ParseErrorReason.INVALID_OUTPUT_MULTIASSET,
    ),
  )

  return { type: AmountType.WITH_MULTIASSET, coin, multiasset }
}

const parseAmountWithoutMultiasset = (unparsedAmount: unknown): Amount => ({
  type: AmountType.WITHOUT_MULTIASSET,
  coin: parseUint(unparsedAmount, ParseErrorReason.INVALID_OUTPUT_AMOUNT),
})

const parseAmount = (unparsedAmount: unknown): Amount =>
  isUint(unparsedAmount)
    ? parseAmountWithoutMultiasset(unparsedAmount)
    : parseAmountWithMultiasset(unparsedAmount)

const parseLegacyTxOutputDatumHash = (
  unparsedDatumHash: unknown,
): DatumHash | undefined =>
  unparsedDatumHash
    ? {
        type: DatumType.HASH,
        hash: parseBufferOfLength(
          unparsedDatumHash,
          DATUM_HASH_LENGTH,
          ParseErrorReason.INVALID_OUTPUT_DATUM_HASH,
        ),
      }
    : undefined

const parseLegacyTxOutput = (
  unparsedTxOutput: unknown,
): LegacyTransactionOutput => {
  const [address, amount, datumHash] = parseTuple(
    unparsedTxOutput,
    ParseErrorReason.INVALID_TX_OUTPUT,
    parseAddress,
    parseAmount,
    parseLegacyTxOutputDatumHash,
  )

  return {
    format: TxOutputFormat.ARRAY_LEGACY,
    address,
    amount,
    datumHash,
  }
}

const parseDatumType = (unparsedDatumType: unknown): DatumType => {
  validate(
    isNumber(unparsedDatumType),
    ParseErrorReason.INVALID_OUTPUT_DATUM_TYPE,
  )
  validate(
    unparsedDatumType in DatumType,
    ParseErrorReason.INVALID_OUTPUT_DATUM_TYPE,
  )
  return unparsedDatumType
}

const parseDatumInline = (data: unknown[]): WithoutType<DatumInline> => ({
  bytes: parseEmbeddedCborBytes(
    data[0],
    ParseErrorReason.INVALID_OUTPUT_DATUM_INLINE,
  ),
})

const parseDatumHash = (data: unknown[]): WithoutType<DatumHash> => ({
  hash: parseBufferOfLength(
    data[0],
    DATUM_HASH_LENGTH,
    ParseErrorReason.INVALID_OUTPUT_DATUM_HASH,
  ),
})

const parseDatum = createParser(
  parseBasedOnType,
  ParseErrorReason.INVALID_OUTPUT_DATUM,
  parseDatumType,
  parseDatumHash,
  parseDatumInline,
)

const parseReferenceScript = createParser(
  parseEmbeddedCborBytes,
  ParseErrorReason.INVALID_OUTPUT_REFERENCE_SCRIPT,
)

const parseBabbageTxOutput = (
  unparsedTxOutput: unknown,
): BabbageTransactionOutput => {
  validate(
    isMapWithKeysOfType(unparsedTxOutput, isNumber),
    ParseErrorReason.INVALID_TX_OUTPUT,
  )

  return {
    format: TxOutputFormat.MAP_BABBAGE,
    address: parseAddress(
      unparsedTxOutput.get(BabbageTransactionOutputKeys.ADDRESS),
    ),
    amount: parseAmount(
      unparsedTxOutput.get(BabbageTransactionOutputKeys.AMOUNT),
    ),
    datum: parseOptional(
      unparsedTxOutput.get(BabbageTransactionOutputKeys.DATUM),
      parseDatum,
    ),
    referenceScript: parseOptional(
      unparsedTxOutput.get(BabbageTransactionOutputKeys.REFERENCE_SCRIPT),
      parseReferenceScript,
    ),
  }
}

const parseTxOutput = (unparsedTxOutput: unknown): TransactionOutput => {
  return isArray(unparsedTxOutput)
    ? parseLegacyTxOutput(unparsedTxOutput)
    : parseBabbageTxOutput(unparsedTxOutput)
}

export const parseWithdrawals = (
  unparsedWithdrawals: unknown,
): Withdrawal[] => {
  const withdrawalsMap = parseMap(
    unparsedWithdrawals,
    parseRewardAccount,
    createParser(parseUint, ParseErrorReason.INVALID_WITHDRAWAL_AMOUNT),
    ParseErrorReason.INVALID_WITHDRAWALS,
  )

  return Array.from(withdrawalsMap).map(([rewardAccount, amount]) => ({
    rewardAccount,
    amount,
  }))
}

const parseStakeCredentialType = (
  unparsedStakeCredentialType: unknown,
): StakeCredentialType => {
  validate(
    isNumber(unparsedStakeCredentialType),
    ParseErrorReason.INVALID_STAKE_CREDENTIAL_TYPE,
  )
  validate(
    unparsedStakeCredentialType in StakeCredentialType,
    ParseErrorReason.INVALID_STAKE_CREDENTIAL_TYPE,
  )
  return unparsedStakeCredentialType
}

const parseStakeCredentialKey = (
  data: unknown[],
): WithoutType<StakeCredentialKey> => ({
  hash: parseBufferOfLength(
    data[0],
    KEY_HASH_LENGTH,
    ParseErrorReason.INVALID_STAKE_CREDENTIAL_KEY_HASH,
  ),
})

const parseStakeCredentialScript = (
  data: unknown[],
): WithoutType<StakeCredentialScript> => ({
  hash: parseBufferOfLength(
    data[0],
    SCRIPT_HASH_LENGTH,
    ParseErrorReason.INVALID_STAKE_CREDENTIAL_SCRIPT_HASH,
  ),
})

const parseStakeCredential = createParser(
  parseBasedOnType,
  ParseErrorReason.INVALID_STAKE_CREDENTIAL,
  parseStakeCredentialType,
  parseStakeCredentialKey,
  parseStakeCredentialScript,
)

const parsePoolKeyHash = createParser(
  parseBufferOfLength,
  POOL_KEY_HASH_LENGTH,
  ParseErrorReason.INVALID_POOL_KEY_HASH,
)

const parseUnitInterval = createParser(
  parseTuple,
  ParseErrorReason.INVALID_UNIT_INTERVAL,
  createParser(parseUint, ParseErrorReason.INVALID_UNIT_INTERVAL_START),
  createParser(parseUint, ParseErrorReason.INVALID_UNIT_INTERVAL_END),
)

const parsePort = (data: unknown): Port => {
  validate(
    isUintOfMaxSize(data, PORT_MAX_SIZE),
    ParseErrorReason.INVALID_RELAY_PORT,
  )
  return data
}

const parseDnsName = createParser(
  parseStringOfMaxLength,
  DNS_NAME_MAX_LENGTH,
  ParseErrorReason.INVALID_RELAY_DNS_NAME,
)

const parseRelayType = (unparsedRelayType: unknown): RelayType => {
  validate(isNumber(unparsedRelayType), ParseErrorReason.INVALID_RELAY_TYPE)
  validate(unparsedRelayType in RelayType, ParseErrorReason.INVALID_RELAY_TYPE)
  return unparsedRelayType
}

const parseRelaySingleHostAddress = (
  data: unknown[],
): WithoutType<RelaySingleHostAddress> => ({
  port: parseNullable(data[0], parsePort),
  ipv4: parseNullable(
    data[1],
    createParser(
      parseBufferOfLength,
      IPV4_LENGTH,
      ParseErrorReason.INVALID_RELAY_IPV4,
    ),
  ),
  ipv6: parseNullable(
    data[2],
    createParser(
      parseBufferOfLength,
      IPV6_LENGTH,
      ParseErrorReason.INVALID_RELAY_IPV6,
    ),
  ),
})

const parseRelaySingleHostName = (
  data: unknown[],
): WithoutType<RelaySingleHostName> => ({
  port: parseNullable(data[0], parsePort),
  dnsName: parseDnsName(data[1]),
})

const parseRelayMultiHostName = (
  data: unknown[],
): WithoutType<RelayMultiHostName> => ({
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
    createParser(
      parseStringOfMaxLength,
      URL_MAX_LENGTH,
      ParseErrorReason.INVALID_POOL_METADATA_URL,
    ),
    createParser(
      parseBufferOfLength,
      METADATA_HASH_LENGTH,
      ParseErrorReason.INVALID_POOL_METADATA_METADATA_HASH,
    ),
  )

  return { url, metadataHash }
}

const parsePoolParams = (unparsedPoolParams: unknown): PoolParams => {
  const [
    operator,
    vrfKeyHash,
    pledge,
    cost,
    margin,
    rewardAccount,
    poolOwners,
    relays,
    poolMetadata,
  ] = parseTuple(
    unparsedPoolParams,
    ParseErrorReason.INVALID_POOL_PARAMS,
    parsePoolKeyHash,
    createParser(
      parseBufferOfLength,
      VRF_KEY_HASH_LENGTH,
      ParseErrorReason.INVALID_VRF_KEY_HASH,
    ),
    parseCoin,
    parseCoin,
    parseUnitInterval,
    parseRewardAccount,
    createParser(
      parseArray,
      createParser(
        parseBufferOfLength,
        KEY_HASH_LENGTH,
        ParseErrorReason.INVALID_POOL_OWNER,
      ),
      ParseErrorReason.INVALID_POOL_OWNERS,
    ),
    createParser(parseArray, parseRelay, ParseErrorReason.INVALID_RELAYS),
    createParser(parseNullable, parsePoolMetadata),
  )

  return {
    operator,
    vrfKeyHash,
    pledge,
    cost,
    margin,
    rewardAccount,
    poolOwners,
    relays,
    poolMetadata,
  }
}

const parseCertificateType = (
  unparsedCertificateType: unknown,
): CertificateType => {
  validate(
    isNumber(unparsedCertificateType),
    ParseErrorReason.INVALID_CERTIFICATE_TYPE,
  )
  validate(
    unparsedCertificateType in CertificateType,
    ParseErrorReason.INVALID_CERTIFICATE_TYPE,
  )
  return unparsedCertificateType
}

const parseStakeRegistrationCertificate = (
  data: unknown[],
): WithoutType<StakeRegistrationCertificate> => ({
  stakeCredential: parseStakeCredential(data[0]),
})

const parseStakeDeregistrationCertificate = (
  data: unknown[],
): WithoutType<StakeDeregistrationCertificate> => ({
  stakeCredential: parseStakeCredential(data[0]),
})

const parseStakeDelegationCertificate = (
  data: unknown[],
): WithoutType<StakeDelegationCertificate> => ({
  stakeCredential: parseStakeCredential(data[0]),
  poolKeyHash: parsePoolKeyHash(data[1]),
})

const parsePoolRegistrationCertificate = (
  data: unknown[],
): WithoutType<PoolRegistrationCertificate> => ({
  poolParams: parsePoolParams(data),
})

const parsePoolRetirementCertificate = (
  data: unknown[],
): WithoutType<PoolRetirementCertificate> => ({
  poolKeyHash: parsePoolKeyHash(data[0]),
  epoch: parseEpoch(data[1]),
})

const parseGenesisKeyDelegation = (
  data: unknown[],
): WithoutType<GenesisKeyDelegation> => ({
  restOfData: data,
})

const parseMoveInstantaneousRewardsCertificate = (
  data: unknown[],
): WithoutType<MoveInstantaneousRewardsCertificate> => ({
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

const parseCollateralInput = (
  unparsedCollateralInput: unknown,
): TransactionInput => {
  const [transactionId, index] = parseTuple(
    unparsedCollateralInput,
    ParseErrorReason.INVALID_COLLATERAL_INPUT,
    createParser(
      parseBufferOfLength,
      TX_ID_HASH_LENGTH,
      ParseErrorReason.INVALID_TRANSACTION_ID,
    ),
    createParser(parseUint, ParseErrorReason.INVALID_COLLATERAL_INPUT_INDEX),
  )

  return { transactionId, index }
}

const parseRequiredSigner = (unparsedRequiredSigner: unknown): RequiredSigner =>
  parseBufferOfLength(
    unparsedRequiredSigner,
    KEY_HASH_LENGTH,
    ParseErrorReason.INVALID_REQUIRED_SIGNERS,
  )

const parseReferenceInput = (
  unparsedReferenceInput: unknown,
): TransactionInput => {
  const [transactionId, index] = parseTuple(
    unparsedReferenceInput,
    ParseErrorReason.INVALID_REFERENCE_INPUT,
    createParser(
      parseBufferOfLength,
      TX_ID_HASH_LENGTH,
      ParseErrorReason.INVALID_TRANSACTION_ID,
    ),
    createParser(parseUint, ParseErrorReason.INVALID_REFERENCE_INPUT_INDEX),
  )

  return { transactionId, index }
}

export const parseInputs = createParser(
  parseArray,
  parseTxInput,
  ParseErrorReason.INVALID_TX_INPUTS,
)
export const parseOutputs = createParser(
  parseArray,
  parseTxOutput,
  ParseErrorReason.INVALID_TX_OUTPUTS,
)
export const parseFee = createParser(parseUint, ParseErrorReason.INVALID_FEE)
export const parseTtl = createParser(parseUint, ParseErrorReason.INVALID_TTL)
export const parseCertificates = createParser(
  parseArray,
  parseCertificate,
  ParseErrorReason.INVALID_CERTIFICATES,
)
export const parseMetadataHash = createParser(
  parseBufferOfLength,
  METADATA_HASH_LENGTH,
  ParseErrorReason.INVALID_METADATA_HASH,
)
export const parseValidityIntervalStart = createParser(
  parseUint,
  ParseErrorReason.INVALID_VALIDITY_INTERVAL_START,
)
export const parseMint = createParser(
  parseMultiasset,
  createParser(parseInt, ParseErrorReason.INVALID_MINT_AMOUNT),
  ParseErrorReason.INVALID_MINT,
)
const parseScriptDataHash = createParser(
  parseBufferOfLength,
  SCRIPT_DATA_HASH_LENGTH,
  ParseErrorReason.INVALID_SCRIPT_DATA_HASH,
)
const parseCollateralInputs = createParser(
  parseArray,
  parseCollateralInput,
  ParseErrorReason.INVALID_COLLATERAL_INPUTS,
)
const parseRequiredSigners = createParser(
  parseArray,
  parseRequiredSigner,
  ParseErrorReason.INVALID_REQUIRED_SIGNERS,
)
const parseNetworkId = createParser(
  parseUint,
  ParseErrorReason.INVALID_NETWORK_ID,
)
const parseTotalCollateral = createParser(
  parseUint,
  ParseErrorReason.INVALID_TOTAL_COLLATERAL,
)
const parseReferenceInputs = createParser(
  parseArray,
  parseReferenceInput,
  ParseErrorReason.INVALID_REFERENCE_INPUTS,
)

export const parseTxBody = (unparsedTxBody: unknown): TransactionBody => {
  validate(
    isMapWithKeysOfType(unparsedTxBody, isNumber),
    ParseErrorReason.INVALID_TX_BODY_CBOR,
  )

  return {
    inputs: parseInputs(unparsedTxBody.get(TransactionBodyKeys.INPUTS)),
    outputs: parseOutputs(unparsedTxBody.get(TransactionBodyKeys.OUTPUTS)),
    fee: parseFee(unparsedTxBody.get(TransactionBodyKeys.FEE)),
    ttl: parseOptional(unparsedTxBody.get(TransactionBodyKeys.TTL), parseTtl),
    certificates: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.CERTIFICATES),
      parseCertificates,
    ),
    withdrawals: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.WITHDRAWALS),
      parseWithdrawals,
    ),
    update: unparsedTxBody.get(TransactionBodyKeys.UPDATE),
    metadataHash: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.METADATA_HASH),
      parseMetadataHash,
    ),
    validityIntervalStart: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.VALIDITY_INTERVAL_START),
      parseValidityIntervalStart,
    ),
    mint: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.MINT),
      parseMint,
    ),
    scriptDataHash: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.SCRIPT_DATA_HASH),
      parseScriptDataHash,
    ),
    collateralInputs: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.COLLATERAL_INPUTS),
      parseCollateralInputs,
    ),
    requiredSigners: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.REQUIRED_SIGNERS),
      parseRequiredSigners,
    ),
    networkId: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.NETWORK_ID),
      parseNetworkId,
    ),
    collateralReturnOutput: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.COLLATERAL_RETURN_OUTPUT),
      parseTxOutput,
    ),
    totalCollateral: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.TOTAL_COLLATERAL),
      parseTotalCollateral,
    ),
    referenceInputs: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.REFERENCE_INPUTS),
      parseReferenceInputs,
    ),
  }
}

export const parseTx = (unparsedTx: unknown): Transaction => {
  const [body, ...otherItems] = parseTuple(
    unparsedTx,
    ParseErrorReason.INVALID_TX_CBOR,
    parseTxBody,
    //             | shelley era:  | alonzo era:
    dontParse, // | witnessSet    | witnessSet
    dontParse, // | auxiliaryData | scriptValidity
    dontParse, // | `undefined`   | auxiliaryData
  )
  validate(undefinedOnlyAtTheEnd(otherItems), ParseErrorReason.INVALID_TX_CBOR)
  const presentItems = otherItems.filter((item) => item !== undefined)
  validate(
    [2, 3].includes(presentItems.length),
    ParseErrorReason.INVALID_TX_CBOR,
  )

  // cardano-cli with --shelley-era, --allegra-era and --mary-era
  // includes only txBody, witnessSet and auxiliaryData
  if (presentItems.length === 2) {
    return { body, witnessSet: presentItems[0], auxiliaryData: presentItems[1] }
  }

  // cardano-cli with --alonzo-era includes all tx items
  return {
    body,
    witnessSet: presentItems[0],
    scriptValidity: presentItems[1],
    auxiliaryData: presentItems[2],
  }
}

export const parseRawTx = (unparsedRawTx: unknown): RawTransaction => {
  const [body, ...otherItems] = parseTuple(
    unparsedRawTx,
    ParseErrorReason.INVALID_RAW_TX_CBOR,
    parseTxBody,
    //             | old cli:      | shelley era:    | alonzo era:
    dontParse, // | auxiliaryData | scriptWitnesses | scriptWitnesses
    dontParse, // | `undefined`   | auxiliaryData   | datumWitnesses
    dontParse, // | `undefined`   | `undefined`     | redeemerWitnesses
    dontParse, // | `undefined`   | `undefined`     | scriptValidity
    dontParse, // | `undefined`   | `undefined`     | auxiliaryData
  )
  validate(
    undefinedOnlyAtTheEnd(otherItems),
    ParseErrorReason.INVALID_RAW_TX_CBOR,
  )
  const presentItems = otherItems.filter((item) => item !== undefined)
  validate(
    [1, 2, 5].includes(presentItems.length),
    ParseErrorReason.INVALID_RAW_TX_CBOR,
  )

  // older versions of cardano-cli included only txBody and auxiliaryData
  if (presentItems.length === 1) {
    return { body, auxiliaryData: presentItems[0] }
  }

  // cardano-cli expects indefinite-length scriptWitnesses
  // we add the flag here right after parsing so that validators can encode the witnesses correctly
  addIndefiniteLengthFlag(presentItems[0])

  // newer versions of cardano-cli with --shelley-era, --allegra-era and --mary-era
  // include txBody, scriptWitnesses and auxiliaryData
  if (presentItems.length === 2) {
    return {
      body,
      scriptWitnesses: presentItems[0],
      auxiliaryData: presentItems[1],
    }
  }

  // newer versions of cardano-cli with --alonzo-era include all rawTx items
  return {
    body,
    scriptWitnesses: presentItems[0],
    datumWitnesses: presentItems[1],
    redeemerWitnesses: presentItems[2],
    scriptValidity: presentItems[3],
    auxiliaryData: presentItems[4],
  }
}
