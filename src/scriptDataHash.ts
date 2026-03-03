import type {
  CostModels,
  CostModelLanguageName,
  FixLenBuffer,
  Unparsed,
} from './types'
import {ParseError, ParseErrorReason} from './errors'
import {SCRIPT_DATA_HASH_LENGTH} from './types'
import {blake2b256, encodeToCbor} from './utils'

export type PlutusLanguageDefinition = {
  name: CostModelLanguageName
  id: number
  witnessScriptKey: number
}

export const PLUTUS_LANGUAGES: PlutusLanguageDefinition[] = [
  {
    name: 'PlutusV1',
    id: 0,
    witnessScriptKey: 3,
  },
  {
    name: 'PlutusV2',
    id: 1,
    witnessScriptKey: 6,
  },
  {
    name: 'PlutusV3',
    id: 2,
    witnessScriptKey: 7,
  },
]

const COST_MODEL_LANGUAGE_NAME_TO_ID = new Map<CostModelLanguageName, number>(
  PLUTUS_LANGUAGES.map(({name, id}) => [name, id]),
)
const PLUTUS_LANGUAGE_IDS = new Set(
  PLUTUS_LANGUAGES.map(({id}) => id),
)
const WITNESS_SCRIPT_KEY_TO_LANGUAGE_ID = new Map(
  PLUTUS_LANGUAGES.map(({witnessScriptKey, id}) => [witnessScriptKey, id]),
)

const getCostModelLanguageId = (languageName: CostModelLanguageName): number => {
  const languageId = COST_MODEL_LANGUAGE_NAME_TO_ID.get(languageName)
  if (languageId === undefined) {
    throw new ParseError(
      ParseErrorReason.INVALID_COST_MODEL_LANGUAGE_NAME,
    )
  }
  return languageId
}

/**
 * Encode cost models as language views for the script data hash computation.
 * Per the Cardano ledger spec:
 * - PlutusV1 (key 0): key is "double bagged" bstr(serialize(PlutusV1)) = 0x4100;
 *   value is a CBOR byte string wrapping an indefinite-length list of cost model
 *   integers: bstr(0x9F <encoded-ints...> 0xFF)
 * - PlutusV2 (key 1) / PlutusV3 (key 2): key is a plain CBOR integer;
 *   value is a definite-length CBOR list of integers (not wrapped in a byte string)
 * Map entries are sorted by shortLex ordering on encoded key bytes (shorter first).
 */
const encodeLanguageViews = (costModels: Map<number, number[]>): Buffer => {
  const viewsMap = new Map<unknown, unknown>()

  for (const [languageId, params] of costModels) {
    if (languageId === 0) {
      // PlutusV1: "double bagging" per Cardano ledger spec.
      // Key: serialize(serialize(PlutusV1)) = bstr(0x00), encoded as CBOR 0x4100
      // https://github.com/IntersectMBO/cardano-ledger/blob/a95e046dd29a0225dab827675cb66977637c4904/eras/alonzo/impl/src/Cardano/Ledger/Alonzo/PParams.hs#L553
      const key = Buffer.from([0x00])
      const parts: Uint8Array[] = [Uint8Array.from([0x9f])]
      for (const n of params) {
        parts.push(Uint8Array.from(encodeToCbor(n)))
      }
      parts.push(Uint8Array.from([0xff]))
      viewsMap.set(key, Buffer.concat(parts))
    } else {
      // PlutusV2/V3: plain array of integers (encoded as definite-length list)
      viewsMap.set(languageId, params)
    }
  }

  return encodeToCbor(viewsMap)
}

const normalizeCostModels = (costModels: CostModels): Map<number, number[]> => {
  const normalized = new Map<number, number[]>()
  for (const [language, model] of costModels) {
    const languageId = getCostModelLanguageId(language)
    if (normalized.has(languageId)) {
      throw new ParseError(ParseErrorReason.DUPLICATE_COST_MODEL_LANGUAGE)
    }
    normalized.set(languageId, model)
  }
  return normalized
}

const getUsedPlutusLanguages = (witnessSet: Unparsed): Set<number> => {
  if (!(witnessSet instanceof Map)) return new Set()

  const usedLanguages = new Set<number>()
  for (const [witnessScriptKey, languageId] of WITNESS_SCRIPT_KEY_TO_LANGUAGE_ID) {
    if (witnessSet.get(witnessScriptKey) !== undefined) {
      usedLanguages.add(languageId)
    }
  }

  return usedLanguages
}

const getConfiguredPlutusLanguages = (
  usedCostModelLanguages: CostModelLanguageName[] | undefined,
): Set<number> | undefined => {
  const configured = usedCostModelLanguages
  if (configured === undefined) return undefined

  const configuredSet = new Set(configured.map(getCostModelLanguageId))
  if (configuredSet.size === 0) {
    throw new ParseError(
      ParseErrorReason.INVALID_USED_COST_MODEL_LANGUAGES_EMPTY,
    )
  }
  if ([...configuredSet].some((lang) => !PLUTUS_LANGUAGE_IDS.has(lang))) {
    throw new ParseError(ParseErrorReason.INVALID_USED_COST_MODEL_LANGUAGES)
  }
  return configuredSet
}

const selectUsedCostModels = (
  costModels: Map<number, number[]>,
  witnessSet: Unparsed,
  usedCostModelLanguages?: CostModelLanguageName[],
): Map<number, number[]> => {
  const inferredLanguages = getUsedPlutusLanguages(witnessSet)
  const configuredLanguages = getConfiguredPlutusLanguages(
    usedCostModelLanguages,
  )
  const usedLanguages =
    inferredLanguages.size > 0 ? inferredLanguages : configuredLanguages

  if (usedLanguages === undefined) {
    throw new ParseError(ParseErrorReason.CANNOT_INFER_PLUTUS_LANGUAGE_VERSIONS)
  }

  for (const language of usedLanguages) {
    if (!costModels.has(language)) {
      throw new ParseError(
        ParseErrorReason.MISSING_COST_MODEL_FOR_REQUIRED_LANGUAGE,
      )
    }
  }

  return new Map([...costModels].filter(([language]) => usedLanguages.has(language)))
}

/**
 * Recomputes the script data hash after canonical re-encoding of the witness set.
 * The hash input per the Cardano ledger spec is:
 *   blake2b256(redeemers_cbor || datums_cbor || language_views_cbor)
 * where || is byte concatenation of independently CBOR-encoded components.
 *
 * Cost models (language views) come from protocol parameters and must be provided
 * by the caller. Throws if the transaction has a scriptDataHash but no cost models
 * were provided, since the hash would be invalid after canonical re-encoding.
 *
 */
export const transformScriptDataHash = (
  scriptDataHash:
    | FixLenBuffer<typeof SCRIPT_DATA_HASH_LENGTH>
    | undefined,
  witnessSet: Unparsed,
  costModels?: CostModels,
  usedCostModelLanguages?: CostModelLanguageName[],
): FixLenBuffer<typeof SCRIPT_DATA_HASH_LENGTH> | undefined => {
  if (scriptDataHash === undefined) {
    return undefined
  }

  if (costModels === undefined) {
    throw new ParseError(
      ParseErrorReason.MISSING_COST_MODELS_FOR_SCRIPT_DATA_HASH,
    )
  }

  if (!(witnessSet instanceof Map)) {
    return scriptDataHash
  }

  const redeemers = witnessSet.get(5)
  const datums = witnessSet.get(4)
  if (redeemers === undefined && datums === undefined) {
    return scriptDataHash
  }
  const normalizedCostModels = normalizeCostModels(costModels)
  const usedCostModels = selectUsedCostModels(
    normalizedCostModels,
    witnessSet,
    usedCostModelLanguages,
  )

  // Each component is independently CBOR-encoded, then byte-concatenated
  const redeemersCbor = encodeToCbor(
    redeemers !== undefined ? redeemers : new Map(),
  )
  // Per Cardano ledger: if no datums, omit entirely (empty bytes, not 0x80)
  const datumsCbor =
    datums !== undefined ? encodeToCbor(datums) : Buffer.alloc(0)
  const languageViewsCbor = encodeLanguageViews(usedCostModels)

  const hashInput = Buffer.concat([
    redeemersCbor as Uint8Array,
    datumsCbor as Uint8Array,
    languageViewsCbor as Uint8Array,
  ])
  return blake2b256(hashInput)
}
