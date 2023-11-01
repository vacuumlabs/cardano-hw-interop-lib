import {
  serializeTxInput,
  serializeCertificate,
  serializeCollateralInput,
  serializeProposalProcedure,
  identity,
} from './txSerializers'
import {ParseErrorReason} from './errors'
import type {Parser, WithoutType} from './parsers'
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
  parseCddlSet,
  parseEmbeddedCborBytes,
  parseInt,
  parseMap,
  parseNullable,
  parseOptional,
  parseStringOfMaxLength,
  parseTupleWithUndefined,
  parseTuple,
  parseUint,
  validate,
  parseCddlNonEmptySet,
  parseCddlNonEmptyOrderedSet,
} from './parsers'
import {
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
  RelayMultiHostName,
  RelaySingleHostAddress,
  RelaySingleHostName,
  RequiredSigner,
  KeyCredential,
  ScriptCredential,
  StakeDelegationCertificate,
  StakeDeregistrationCertificate,
  StakeRegistrationCertificate,
  Transaction,
  TransactionBody,
  TransactionInput,
  TransactionOutput,
  Unparsed,
  Withdrawal,
  StakeRegistrationConwayCertificate,
  StakeDeregistrationConwayCertificate,
  VoteDelegationCertificate,
  DRepType,
  KeyHashDRep,
  ScriptHashDRep,
  AlwaysAbstainDRep,
  AlwaysNoConfidenceDRep,
  StakeAndVoteDelegationCertificate,
  StakeRegistrationAndDelegationCertificate,
  StakeRegistrationWithVoteDelegationCertificate,
  StakeRegistrationWithStakeAndVoteDelegationCertificate,
  ANCHOR_DATA_HASH_LENGTH,
  Anchor,
  AuthorizeCommitteeHotCertificate,
  ResignCommitteeColdCertificate,
  DRepRegistrationCertificate,
  DRepDeregistrationCertificate,
  DRepUpdateCertificate,
  AmountType,
  ASSET_NAME_MAX_LENGTH,
  AUXILIARY_DATA_HASH_LENGTH,
  CertificateType,
  DATUM_HASH_LENGTH,
  DatumType,
  DNS_NAME_MAX_LENGTH,
  IPV4_LENGTH,
  IPV6_LENGTH,
  KEY_HASH_LENGTH,
  POOL_KEY_HASH_LENGTH,
  POOL_METADATA_HASH_LENGTH,
  PORT_MAX_SIZE,
  RelayType,
  REWARD_ACCOUNT_LENGTH,
  SCRIPT_DATA_HASH_LENGTH,
  SCRIPT_HASH_LENGTH,
  CredentialType,
  TX_ID_HASH_LENGTH,
  TxOutputFormat,
  URL_MAX_LENGTH,
  VRF_KEY_HASH_LENGTH,
  VoterVotes,
  VoterType,
  CommitteeKeyVoter,
  CommitteeScriptVoter,
  DRepKeyVoter,
  StakePoolVoter,
  DRepScriptVoter,
  GovActionId,
  VotingProcedure,
  VoteOption,
  Coin,
  ProposalProcedure,
  Int,
  Uint,
  UnitInterval,
} from './types'
import {
  BabbageTransactionOutputKeys,
  CborTag,
  TransactionBodyKeys,
  undefinedOnlyAtTheEnd,
} from './utils'
import {Tagged} from 'cbor'

// ======================== universal parsers / parsers for CDDL data types

const doNotParse: Parser<Unparsed> = (data: unknown) => data

export const parseCoin = createParser(parseUint, ParseErrorReason.INVALID_COIN)

const parseCredentialType = (
  unparsedCredentialType: unknown,
): CredentialType => {
  validate(
    isNumber(unparsedCredentialType),
    ParseErrorReason.INVALID_CREDENTIAL_TYPE,
  )
  validate(
    unparsedCredentialType in CredentialType,
    ParseErrorReason.INVALID_CREDENTIAL_TYPE,
  )
  return unparsedCredentialType
}

const parseKeyCredential = (data: unknown[]): WithoutType<KeyCredential> => {
  validate(data.length === 1, ParseErrorReason.INVALID_CREDENTIAL)
  return {
    hash: parseBufferOfLength(
      data[0],
      KEY_HASH_LENGTH,
      ParseErrorReason.INVALID_CREDENTIAL_KEY_HASH,
    ),
  }
}

const parseScriptCredential = (
  data: unknown[],
): WithoutType<ScriptCredential> => {
  validate(data.length === 1, ParseErrorReason.INVALID_CREDENTIAL)
  return {
    hash: parseBufferOfLength(
      data[0],
      SCRIPT_HASH_LENGTH,
      ParseErrorReason.INVALID_CREDENTIAL_SCRIPT_HASH,
    ),
  }
}

export const parseCredential = createParser(
  parseBasedOnType,
  ParseErrorReason.INVALID_CREDENTIAL,
  parseCredentialType,
  parseKeyCredential,
  parseScriptCredential,
)

// ======================== parsers for tx elements

export const parseTxInput = (unparsedTxInput: unknown): TransactionInput => {
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

  return {transactionId, index}
}

export const parseInputs = createParser(
  parseCddlSet,
  parseTxInput,
  serializeTxInput,
  ParseErrorReason.INVALID_TX_INPUTS,
)

export const parseRewardAccount = createParser(
  parseBufferOfLength,
  REWARD_ACCOUNT_LENGTH,
  ParseErrorReason.INVALID_REWARD_ACCOUNT,
)

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
export const parseMultiasset = <T extends Int | Uint>(
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

  return {type: AmountType.WITH_MULTIASSET, coin, multiasset}
}

const parseAmountWithoutMultiasset = (unparsedAmount: unknown): Amount => ({
  type: AmountType.WITHOUT_MULTIASSET,
  coin: parseUint(unparsedAmount, ParseErrorReason.INVALID_OUTPUT_AMOUNT),
})

export const parseAmount = (unparsedAmount: unknown): Amount =>
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

const parseAddress = createParser(
  parseBuffer,
  ParseErrorReason.INVALID_OUTPUT_ADDRESS,
)

const parseLegacyTxOutput = (
  unparsedTxOutput: unknown,
): LegacyTransactionOutput => {
  const [address, amount, datumHash] = parseTupleWithUndefined(
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

export const parseTxOutput = (unparsedTxOutput: unknown): TransactionOutput => {
  return isArray(unparsedTxOutput)
    ? parseLegacyTxOutput(unparsedTxOutput)
    : parseBabbageTxOutput(unparsedTxOutput)
}

export const parseOutputs = createParser(
  parseArray,
  parseTxOutput,
  ParseErrorReason.INVALID_TX_OUTPUTS,
)

export const parseFee = createParser(parseUint, ParseErrorReason.INVALID_FEE)

export const parseTtl = createParser(parseUint, ParseErrorReason.INVALID_TTL)

const parsePoolKeyHash = createParser(
  parseBufferOfLength,
  POOL_KEY_HASH_LENGTH,
  ParseErrorReason.INVALID_POOL_KEY_HASH,
)

const parseUnitIntervalData = createParser(
  parseTuple,
  ParseErrorReason.INVALID_UNIT_INTERVAL,
  createParser(parseUint, ParseErrorReason.INVALID_UNIT_INTERVAL_START),
  createParser(parseUint, ParseErrorReason.INVALID_UNIT_INTERVAL_END),
)

const parseUnitInterval = (data: unknown): UnitInterval => {
  validate(data instanceof Tagged, ParseErrorReason.INVALID_UNIT_INTERVAL)
  validate(
    data.tag === CborTag.UNIT_INTERVAL,
    ParseErrorReason.INVALID_UNIT_INTERVAL,
  )
  return parseUnitIntervalData(data.value)
}

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
): WithoutType<RelaySingleHostAddress> => {
  validate(data.length === 3, ParseErrorReason.INVALID_RELAY)
  return {
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
  }
}

const parseRelaySingleHostName = (
  data: unknown[],
): WithoutType<RelaySingleHostName> => {
  validate(data.length === 2, ParseErrorReason.INVALID_RELAY)
  return {
    port: parseNullable(data[0], parsePort),
    dnsName: parseDnsName(data[1]),
  }
}

const parseRelayMultiHostName = (
  data: unknown[],
): WithoutType<RelayMultiHostName> => {
  validate(data.length === 1, ParseErrorReason.INVALID_RELAY)
  return {
    dnsName: parseDnsName(data[0]),
  }
}

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
      POOL_METADATA_HASH_LENGTH,
      ParseErrorReason.INVALID_POOL_METADATA_METADATA_HASH,
    ),
  )

  return {url, metadataHash}
}

export const parsePoolParams = (unparsedPoolParams: unknown): PoolParams => {
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
      parseCddlSet,
      createParser(
        parseBufferOfLength,
        KEY_HASH_LENGTH,
        ParseErrorReason.INVALID_POOL_OWNER,
      ),
      identity,
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

const parseDRepType = (unparsedType: unknown): DRepType => {
  validate(isNumber(unparsedType), ParseErrorReason.INVALID_DREP_TYPE)
  validate(unparsedType in DRepType, ParseErrorReason.INVALID_DREP_TYPE)
  return unparsedType
}

const parseKeyHashDRep = (data: unknown[]): WithoutType<KeyHashDRep> => {
  validate(data.length === 1, ParseErrorReason.INVALID_DREP)
  return {
    keyHash: parseBufferOfLength(
      data[0],
      KEY_HASH_LENGTH,
      ParseErrorReason.INVALID_DREP,
    ),
  }
}

const parseScriptHashDRep = (data: unknown[]): WithoutType<ScriptHashDRep> => {
  validate(data.length === 1, ParseErrorReason.INVALID_DREP)
  return {
    scriptHash: parseBufferOfLength(
      data[0],
      SCRIPT_HASH_LENGTH,
      ParseErrorReason.INVALID_DREP,
    ),
  }
}

const parseAlwaysAbstainDRep = (
  data: unknown[],
): WithoutType<AlwaysAbstainDRep> => {
  // nothing to parse
  validate(data.length === 0, ParseErrorReason.INVALID_DREP)
  return {}
}

const parseAlwaysNoConfidenceDRep = (
  data: unknown[],
): WithoutType<AlwaysNoConfidenceDRep> => {
  // nothing to parse
  validate(data.length === 0, ParseErrorReason.INVALID_DREP)
  return {}
}

export const parseAnchor = (data: unknown): Anchor => {
  const [url, dataHash] = parseTuple(
    data,
    ParseErrorReason.INVALID_ANCHOR,
    createParser(
      parseStringOfMaxLength,
      URL_MAX_LENGTH,
      ParseErrorReason.INVALID_ANCHOR_URL,
    ),
    createParser(
      parseBufferOfLength,
      ANCHOR_DATA_HASH_LENGTH,
      ParseErrorReason.INVALID_ANCHOR_DATA_HASH,
    ),
  )
  return {url, dataHash}
}

export const parseDRep = createParser(
  parseBasedOnType,
  ParseErrorReason.INVALID_DREP,
  parseDRepType,
  parseKeyHashDRep,
  parseScriptHashDRep,
  parseAlwaysAbstainDRep,
  parseAlwaysNoConfidenceDRep,
)

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
): WithoutType<StakeRegistrationCertificate> => {
  validate(data.length === 1, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    stakeCredential: parseCredential(data[0]),
  }
}

const parseStakeDeregistrationCertificate = (
  data: unknown[],
): WithoutType<StakeDeregistrationCertificate> => {
  validate(data.length === 1, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    stakeCredential: parseCredential(data[0]),
  }
}

const parseStakeDelegationCertificate = (
  data: unknown[],
): WithoutType<StakeDelegationCertificate> => {
  validate(data.length === 2, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    stakeCredential: parseCredential(data[0]),
    poolKeyHash: parsePoolKeyHash(data[1]),
  }
}

const parsePoolRegistrationCertificate = (
  data: unknown[],
): WithoutType<PoolRegistrationCertificate> => ({
  poolParams: parsePoolParams(data),
})

const parseEpoch = createParser(parseUint, ParseErrorReason.INVALID_COIN)

const parsePoolRetirementCertificate = (
  data: unknown[],
): WithoutType<PoolRetirementCertificate> => {
  validate(data.length === 2, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    poolKeyHash: parsePoolKeyHash(data[0]),
    epoch: parseEpoch(data[1]),
  }
}

const parseGenesisKeyDelegation = (
  data: unknown[],
): WithoutType<GenesisKeyDelegation> => ({
  restOfData: data,
})

// TODO these are removed in Conway
const parseMoveInstantaneousRewardsCertificate = (
  data: unknown[],
): WithoutType<MoveInstantaneousRewardsCertificate> => ({
  restOfData: data,
})

const parseStakeRegCertificate = (
  data: unknown[],
): WithoutType<StakeRegistrationConwayCertificate> => {
  validate(data.length === 2, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    stakeCredential: parseCredential(data[0]),
    deposit: parseCoin(data[1]),
  }
}

const parseStakeUnregCertificate = (
  data: unknown[],
): WithoutType<StakeDeregistrationConwayCertificate> => {
  validate(data.length === 2, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    stakeCredential: parseCredential(data[0]),
    deposit: parseCoin(data[1]),
  }
}

const parseVoteDelegCertificate = (
  data: unknown[],
): WithoutType<VoteDelegationCertificate> => {
  validate(data.length === 2, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    stakeCredential: parseCredential(data[0]),
    dRep: parseDRep(data[1]),
  }
}

const parseStakeVoteDelegCertificate = (
  data: unknown[],
): WithoutType<StakeAndVoteDelegationCertificate> => {
  validate(data.length === 3, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    stakeCredential: parseCredential(data[0]),
    poolKeyHash: parsePoolKeyHash(data[1]),
    dRep: parseDRep(data[2]),
  }
}

const parseStakeRegDelegCertificate = (
  data: unknown[],
): WithoutType<StakeRegistrationAndDelegationCertificate> => {
  validate(data.length === 3, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    stakeCredential: parseCredential(data[0]),
    poolKeyHash: parsePoolKeyHash(data[1]),
    deposit: parseCoin(data[2]),
  }
}

const parseVoteRegDelegCertificate = (
  data: unknown[],
): WithoutType<StakeRegistrationWithVoteDelegationCertificate> => {
  validate(data.length === 3, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    stakeCredential: parseCredential(data[0]),
    dRep: parseDRep(data[1]),
    deposit: parseCoin(data[2]),
  }
}

const parseStakeVoteRegDelegCertificate = (
  data: unknown[],
): WithoutType<StakeRegistrationWithStakeAndVoteDelegationCertificate> => {
  validate(data.length === 4, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    stakeCredential: parseCredential(data[0]),
    poolKeyHash: parsePoolKeyHash(data[1]),
    dRep: parseDRep(data[2]),
    deposit: parseCoin(data[3]),
  }
}

const parseAuthCommitteeHotCertificate = (
  data: unknown[],
): WithoutType<AuthorizeCommitteeHotCertificate> => {
  validate(data.length === 2, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    coldCredential: parseCredential(data[0]),
    hotCredential: parseCredential(data[1]),
  }
}

const parseResignCommitteeColdCertificate = (
  data: unknown[],
): WithoutType<ResignCommitteeColdCertificate> => {
  validate(data.length === 2, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    coldCredential: parseCredential(data[0]),
    anchor: parseNullable(data[1], parseAnchor),
  }
}

const parseDRepRegCertificate = (
  data: unknown[],
): WithoutType<DRepRegistrationCertificate> => {
  validate(data.length === 3, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    dRepCredential: parseCredential(data[0]),
    deposit: parseCoin(data[1]),
    anchor: parseNullable(data[2], parseAnchor),
  }
}

const parseDRepUnregCertificate = (
  data: unknown[],
): WithoutType<DRepDeregistrationCertificate> => {
  validate(data.length === 2, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    dRepCredential: parseCredential(data[0]),
    deposit: parseCoin(data[1]),
  }
}

const parseDRepUpdateCertificate = (
  data: unknown[],
): WithoutType<DRepUpdateCertificate> => {
  validate(data.length === 2, ParseErrorReason.INVALID_CERTIFICATE)
  return {
    dRepCredential: parseCredential(data[0]),
    anchor: parseNullable(data[1], parseAnchor),
  }
}

export const parseCertificate = createParser(
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
  parseStakeRegCertificate,
  parseStakeUnregCertificate,
  parseVoteDelegCertificate,
  parseStakeVoteDelegCertificate,
  parseStakeRegDelegCertificate,
  parseVoteRegDelegCertificate,
  parseStakeVoteRegDelegCertificate,
  parseAuthCommitteeHotCertificate,
  parseResignCommitteeColdCertificate,
  parseDRepRegCertificate,
  parseDRepUnregCertificate,
  parseDRepUpdateCertificate,
)

export const parseCertificates = createParser(
  parseCddlNonEmptyOrderedSet,
  parseCertificate,
  serializeCertificate,
  ParseErrorReason.INVALID_CERTIFICATES,
)

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

export const parseAuxiliaryDataHash = createParser(
  parseBufferOfLength,
  AUXILIARY_DATA_HASH_LENGTH,
  ParseErrorReason.INVALID_AUXILIARY_DATA_HASH,
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
export const parseScriptDataHash = createParser(
  parseBufferOfLength,
  SCRIPT_DATA_HASH_LENGTH,
  ParseErrorReason.INVALID_SCRIPT_DATA_HASH,
)

export const parseCollateralInput = (
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

  return {transactionId, index}
}

export const parseCollateralInputs = createParser(
  parseCddlNonEmptySet,
  parseCollateralInput,
  serializeCollateralInput,
  ParseErrorReason.INVALID_COLLATERAL_INPUTS,
)

export const parseRequiredSigner = (
  unparsedRequiredSigner: unknown,
): RequiredSigner =>
  parseBufferOfLength(
    unparsedRequiredSigner,
    KEY_HASH_LENGTH,
    ParseErrorReason.INVALID_REQUIRED_SIGNERS,
  )

export const parseRequiredSigners = createParser(
  parseCddlNonEmptySet,
  parseRequiredSigner,
  identity,
  ParseErrorReason.INVALID_REQUIRED_SIGNERS,
)

export const parseNetworkId = createParser(
  parseUint,
  ParseErrorReason.INVALID_NETWORK_ID,
)

export const parseCollateralOutput = (
  unparsedTxOutput: unknown,
): TransactionOutput => {
  // The reported error is somewhat inaccurate (does not refer to "collateral return output"
  // at all, just "output"), but it is not worth rewriting the output parsing.
  // There are some conditions on collateral return outputs
  // that we do not verify here anyway (limitations on address type, datum hash presence etc.).
  return parseTxOutput(unparsedTxOutput)
}

export const parseTotalCollateral = createParser(
  parseUint,
  ParseErrorReason.INVALID_TOTAL_COLLATERAL,
)

export const parseReferenceInput = (
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

  return {transactionId, index}
}

export const parseReferenceInputs = createParser(
  parseCddlNonEmptySet,
  parseReferenceInput,
  serializeTxInput,
  ParseErrorReason.INVALID_REFERENCE_INPUTS,
)

const parseVoterType = (unparsedType: unknown): VoterType => {
  validate(isNumber(unparsedType), ParseErrorReason.INVALID_VOTER)
  validate(unparsedType in VoterType, ParseErrorReason.INVALID_VOTER)
  return unparsedType
}

const parseKeyVoterHash = createParser(
  parseBufferOfLength,
  KEY_HASH_LENGTH,
  ParseErrorReason.INVALID_VOTER,
)

const parseScriptVoterHash = createParser(
  parseBufferOfLength,
  SCRIPT_HASH_LENGTH,
  ParseErrorReason.INVALID_VOTER,
)

const parseCommitteeKeyVoter = (
  data: unknown[],
): WithoutType<CommitteeKeyVoter> => ({
  hash: parseKeyVoterHash(data[0]),
})

const parseCommitteeScriptVoter = (
  data: unknown[],
): WithoutType<CommitteeScriptVoter> => ({
  hash: parseScriptVoterHash(data[0]),
})

const parseDRepKeyVoter = (data: unknown[]): WithoutType<DRepKeyVoter> => ({
  hash: parseKeyVoterHash(data[0]),
})

const parseDRepScriptVoter = (
  data: unknown[],
): WithoutType<DRepScriptVoter> => ({
  hash: parseScriptVoterHash(data[0]),
})

const parseStakePoolVoter = (data: unknown[]): WithoutType<StakePoolVoter> => ({
  hash: parseKeyVoterHash(data[0]),
})

const parseVoter = createParser(
  parseBasedOnType,
  ParseErrorReason.INVALID_VOTER,
  parseVoterType,
  parseCommitteeKeyVoter,
  parseCommitteeScriptVoter,
  parseDRepKeyVoter,
  parseDRepScriptVoter,
  parseStakePoolVoter,
)

const parseGovActionId = (unparsed: unknown): GovActionId => {
  const [transactionId, index] = parseTuple(
    unparsed,
    ParseErrorReason.INVALID_GOV_ACTION_ID,
    createParser(
      parseBufferOfLength,
      TX_ID_HASH_LENGTH,
      ParseErrorReason.INVALID_GOV_ACTION_ID,
    ),
    createParser(parseUint, ParseErrorReason.INVALID_GOV_ACTION_ID),
  )

  return {transactionId, index}
}

const parseVoteOption = (unparsed: unknown): VoteOption => {
  validate(isNumber(unparsed), ParseErrorReason.INVALID_VOTE_OPTION)
  validate(unparsed in VoteOption, ParseErrorReason.INVALID_VOTE_OPTION)
  return unparsed
}

const parseVotingProcedure = (unparsed: unknown): VotingProcedure => {
  const [voteOption, anchor] = parseTuple(
    unparsed,
    ParseErrorReason.INVALID_VOTING_PROCEDURE,
    parseVoteOption,
    createParser(
      parseNullable,
      parseAnchor,
      ParseErrorReason.INVALID_VOTING_PROCEDURE,
    ),
  )
  return {
    voteOption,
    anchor,
  }
}

export const parseVotingProcedures = (unparsed: unknown): VoterVotes[] => {
  const voterVotesMap = parseMap(
    unparsed,
    parseVoter,
    createParser(
      parseMap,
      parseGovActionId,
      parseVotingProcedure,
      ParseErrorReason.INVALID_VOTE_OPTION,
    ),
    ParseErrorReason.INVALID_VOTING_PROCEDURES,
  )
  validate(
    voterVotesMap.size > 0,
    ParseErrorReason.INVALID_VOTING_PROCEDURES_EMPTY_MAP,
  )
  for (const [, votes] of voterVotesMap) {
    validate(
      votes.size > 0,
      ParseErrorReason.INVALID_VOTING_PROCEDURES_EMPTY_MAP,
    )
  }

  return Array.from(voterVotesMap).map(([voter, votes]) => ({
    voter,
    votes: Array.from(votes).map(([govActionId, votingProcedure]) => ({
      govActionId,
      votingProcedure,
    })),
  }))
}

export const parseProposalProcedure = (
  unparsedProcedure: unknown,
): ProposalProcedure => {
  const [deposit, rewardAccount, govAction, anchor] = parseTuple(
    unparsedProcedure,
    ParseErrorReason.INVALID_PROPOSAL_PROCEDURE,
    parseCoin,
    parseRewardAccount,
    doNotParse,
    parseAnchor,
  )

  return {
    deposit,
    rewardAccount,
    govAction,
    anchor,
  }
}
export const parseProposalProcedures = createParser(
  parseCddlNonEmptyOrderedSet,
  parseProposalProcedure,
  serializeProposalProcedure,
  ParseErrorReason.INVALID_PROPOSAL_PROCEDURES,
)

export const parseTreasury = createParser(
  parseUint,
  ParseErrorReason.INVALID_TREASURY,
)

export const parseDonation = (unparsed: unknown): Coin => {
  const coin = parseUint(unparsed, ParseErrorReason.INVALID_DONATION)
  validate(coin > 0, ParseErrorReason.INVALID_DONATION)
  return coin
}

export const parseTxBody = (unparsedTxBody: unknown): TransactionBody => {
  validate(
    isMapWithKeysOfType(unparsedTxBody, isNumber),
    ParseErrorReason.INVALID_TX_BODY_CBOR,
  )
  validate(
    Array.from(unparsedTxBody.keys()).every((key) =>
      Object.values(TransactionBodyKeys).includes(key),
    ),
    ParseErrorReason.INVALID_TX_BODY_UNKNOWN_ITEMS,
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
    auxiliaryDataHash: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.AUXILIARY_DATA_HASH),
      parseAuxiliaryDataHash,
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
      parseCollateralOutput,
    ),
    totalCollateral: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.TOTAL_COLLATERAL),
      parseTotalCollateral,
    ),
    referenceInputs: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.REFERENCE_INPUTS),
      parseReferenceInputs,
    ),
    votingProcedures: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.VOTING_PROCEDURES),
      parseVotingProcedures,
    ),
    proposalProcedures: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.PROPOSAL_PROCEDURES),
      parseProposalProcedures,
    ),
    treasury: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.TREASURY),
      parseTreasury,
    ),
    donation: parseOptional(
      unparsedTxBody.get(TransactionBodyKeys.DONATION),
      parseDonation,
    ),
  }
}

export const parseTx = (unparsedTx: unknown): Transaction => {
  const [body, ...otherItems] = parseTupleWithUndefined(
    unparsedTx,
    ParseErrorReason.INVALID_TX_CBOR,
    parseTxBody,
    //             | shelley era:  | alonzo era:
    doNotParse, // | witnessSet    | witnessSet
    doNotParse, // | auxiliaryData | scriptValidity
    doNotParse, // | `undefined`   | auxiliaryData
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
    return {body, witnessSet: presentItems[0], auxiliaryData: presentItems[1]}
  }

  // cardano-cli with --alonzo-era includes all tx items
  return {
    body,
    witnessSet: presentItems[0],
    scriptValidity: presentItems[1],
    auxiliaryData: presentItems[2],
  }
}
