import type {ValidationError} from './errors'
import * as parsers from './txParsers'
import * as serializers from './txSerializers'
import * as transformers from './txTransformers'
import {validateTxCommon} from './txValidators'
import type {Transaction, TransactionBody} from './types'
import {decodeCbor, encodeToCbor} from './utils'

export type {ValidationError} from './errors'
export {PLUTUS_LANGUAGES} from './scriptDataHash'
export type {PlutusLanguageDefinition} from './scriptDataHash'
export * from './types'

/**
 * Takes a Buffer of CBOR encoded transaction body and decodes it
 * to a TransactionBody object
 *
 * @param {Buffer} txBodyCbor The CBOR encoded input
 * @returns Decoded TransactionBody object
 */
export const decodeTxBody = (txBodyCbor: Buffer): TransactionBody =>
  parsers.parseTxBody(decodeCbor(txBodyCbor))

/**
 * Takes a Buffer of CBOR encoded transaction and decodes it
 * to a Transaction object
 *
 * @param {Buffer} txCbor The CBOR encoded input
 * @returns Decoded Transaction object
 */
export const decodeTx = (txCbor: Buffer): Transaction =>
  parsers.parseTx(decodeCbor(txCbor))

/**
 * Takes a transaction body and encodes it back to it's CBOR representation.
 * Uses canonical CBOR serialization format as specified in
 * {@link https://datatracker.ietf.org/doc/html/rfc7049#section-3.9 Section 3.9 of CBOR specification RFC}
 *
 * @param {TransactionBody} txBody
 * @returns Buffer containing the CBOR encoded `txBody`
 */
export const encodeTxBody = (txBody: TransactionBody): Buffer =>
  encodeToCbor(serializers.serializeTxBody(txBody))

/**
 * Takes a transaction and encodes it back to it's CBOR representation.
 * Uses canonical CBOR serialization format as specified in
 * {@link https://datatracker.ietf.org/doc/html/rfc7049#section-3.9 Section 3.9 of CBOR specification RFC}
 *
 * @param {Transaction} tx
 * @returns Buffer containing the CBOR encoded `tx`
 */
export const encodeTx = (tx: Transaction): Buffer =>
  encodeToCbor(serializers.serializeTx(tx))

/**
 * Takes a Buffer of CBOR encoded transaction body and validates it according to
 * CIP-0021, returns an array of found validation errors.
 *
 * Assumes that txBodyCbor is a valid CBOR. If not, this function might throw an error.
 *
 * @param {Buffer} txBodyCbor The CBOR encoded transaction body
 * @returns Found validation errors
 */
export const validateTxBody = (txBodyCbor: Buffer): ValidationError[] => {
  const txBody = decodeTxBody(txBodyCbor)
  const canonicalTxBodyCbor = encodeTxBody(txBody)
  return validateTxCommon(txBodyCbor, canonicalTxBodyCbor, txBody)
}

/**
 * Takes a Buffer of CBOR encoded transaction and validates it according to
 * CIP-0021, returns an array of found validation errors.
 *
 * Assumes that txCbor is a valid CBOR. If not, this function might throw an error.
 *
 * @param {Buffer} txCbor The CBOR encoded transaction
 * @returns Found validation errors
 */
export const validateTx = (txCbor: Buffer): ValidationError[] => {
  const tx = decodeTx(txCbor)
  const canonicalTxCbor = encodeTx(tx)
  return validateTxCommon(txCbor, canonicalTxCbor, tx.body)
}

/**
 * Takes a transaction body and applies transformations on it to fix fixable
 * validation errors. The result of the transformation is equivalent to the
 * input, but the size of the serialized transaction body might decrease
 * (or even increase in some very rare cases).
 * Returns a new transformed transaction body.
 *
 * @param {TransactionBody} txBody
 * @returns Transformed transaction body
 */
export const transformTxBody = transformers.transformTxBody

/**
 * Takes a transaction and applies transformations on it to fix fixable
 * validation errors. The result of the transformation is equivalent to the
 * input, but the size of the serialized transaction body might decrease
 * (or even increase in some very rare cases).
 * Returns a new transformed transaction.
 *
 * If the transaction contains a `scriptDataHash` (i.e. uses Plutus scripts),
 * `costModels` must be provided so the hash can be recomputed after canonical
 * re-encoding of the witness set. Cost models are part of the protocol
 * parameters and can be queried from a node via `cardano-cli query
 * protocol-parameters`, or from any chain indexer that exposes them (e.g.
 * Blockfrost's `/epochs/latest/parameters`, Koios, Ogmios). Pass only the
 * languages that may appear in the transaction; entries for unused languages
 * are ignored.
 *
 * The languages used by the transaction are inferred from the witness set
 * (PlutusV1/V2/V3 script keys). When inference is not possible — e.g. when
 * scripts are supplied only as reference scripts — pass
 * `usedCostModelLanguages` explicitly. Throws if a `scriptDataHash` is present
 * but cost models for the used languages cannot be determined.
 *
 * @param {Transaction} tx
 * @param {CostModels} [costModels] Cost models keyed by language name
 * (`PlutusV1` / `PlutusV2` / `PlutusV3`), as published in the current protocol
 * parameters.
 * @param {CostModelLanguageName[]} [usedCostModelLanguages] Explicit language
 * names to use when the witness set does not contain inline Plutus scripts
 * (e.g. reference-script-only transactions).
 * @returns Transformed transaction
 */
export const transformTx = transformers.transformTx
