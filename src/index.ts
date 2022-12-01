import type { ValidationError } from './errors'
import * as parsers from './txParsers'
import * as serializers from './txSerializers'
import * as transformers from './txTransformers'
import { validateTxCommon } from './txValidators'
import type { Transaction, TransactionBody } from './types'
import { decodeCbor, encodeToCbor } from './utils'

export type { ValidationError } from './errors'
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
 * @param {Transaction} tx
 * @returns Transformed transaction
 */
export const transformTx = transformers.transformTx
