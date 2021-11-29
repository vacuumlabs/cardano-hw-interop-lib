import type { ValidationError } from './errors'
import * as encoders from './txEncoders'
import * as parsers from './txParsers'
import * as transformers from './txTransformers'
import { validateTxCommon } from './txValidators'
import type { RawTransaction, Transaction, TransactionBody } from './types'
import { decodeCbor, encodeToCbor } from './utils'

export type { ValidationError } from './errors'
export * from './types'


/**
 * Takes a Buffer of CBOR encoded transaction body and decodes it and parses it
 * to a TransactionBody object
 *
 * @param {Buffer} txBodyCbor The CBOR encoded input
 * @returns Parsed TransactionBody object
 */
export const parseTxBody = (txBodyCbor: Buffer): TransactionBody =>
    parsers.parseTxBody(decodeCbor(txBodyCbor))

/**
 * Takes a Buffer of CBOR encoded transaction and decodes it and parses it
 * to a Transaction object
 *
 * @param {Buffer} txCbor The CBOR encoded input
 * @returns Parsed Transaction object
 */
export const parseTx = (txCbor: Buffer): Transaction =>
    parsers.parseTx(decodeCbor(txCbor))

/**
 * Takes a Buffer of CBOR encoded raw transaction and decodes it and parses it
 * to a RawTransaction object
 *
 * @param {Buffer} rawTxCbor The CBOR encoded input
 * @returns Parsed RawTransaction object
 */
export const parseRawTx = (rawTxCbor: Buffer): RawTransaction =>
    parsers.parseRawTx(decodeCbor(rawTxCbor))


/**
 * Takes a transaction body and encodes it back to it's CBOR representation.
 * Uses canonical CBOR serialization format as specified in
 * {@link https://datatracker.ietf.org/doc/html/rfc7049#section-3.9 Section 3.9 of CBOR specification RFC}
 *
 * @param {TransactionBody} txBody
 * @returns Buffer containing the CBOR encoded `txBody`
 */
export const encodeTxBody = (txBody: TransactionBody): Buffer =>
    encodeToCbor(encoders.encodeTxBody(txBody))

/**
 * Takes a transaction and encodes it back to it's CBOR representation.
 * Uses canonical CBOR serialization format as specified in
 * {@link https://datatracker.ietf.org/doc/html/rfc7049#section-3.9 Section 3.9 of CBOR specification RFC}
 *
 * @param {Transaction} tx
 * @returns Buffer containing the CBOR encoded `tx`
 */
export const encodeTx = (tx: Transaction): Buffer =>
    encodeToCbor(encoders.encodeTx(tx))

/**
 * Takes a raw transaction and encodes it back to it's CBOR representation.
 * Uses canonical CBOR serialization format as specified in
 * {@link https://datatracker.ietf.org/doc/html/rfc7049#section-3.9 Section 3.9 of CBOR specification RFC}
 *
 * @param {RawTransaction} rawTx
 * @returns Buffer containing the CBOR encoded `rawTx`
 */
export const encodeRawTx = (rawTx: RawTransaction): Buffer =>
    encodeToCbor(encoders.encodeRawTx(rawTx))


/**
 * Takes a Buffer of CBOR encoded transaction body and validates it according to
 * CIP-0021, returns an array of found validation errors.
 *
 * @param {Buffer} txBodyCbor The CBOR encoded transaction body
 * @returns Found validation errors
 */
export const validateTxBody = (txBodyCbor: Buffer): ValidationError[] => {
    const txBody = parseTxBody(txBodyCbor)
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
    const tx = parseTx(txCbor)
    const canonicalTxCbor = encodeTx(tx)
    return validateTxCommon(txCbor, canonicalTxCbor, tx.body)
}

/**
 * Takes a Buffer of CBOR encoded raw transaction and validates it according to
 * CIP-0021, returns an array of found validation errors.
 *
 * @param {Buffer} rawTxCbor The CBOR encoded raw transaction
 * @returns Found validation errors
 */
export const validateRawTx = (rawTxCbor: Buffer): ValidationError[] => {
    const rawTx = parseRawTx(rawTxCbor)
    const canonicalRawTxCbor = encodeRawTx(rawTx)
    return validateTxCommon(rawTxCbor, canonicalRawTxCbor, rawTx.body)
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

/**
 * Takes a raw transaction and applies transformations on it to fix fixable
 * validation errors. The result of the transformation is equivalent to the
 * input, but the size of the serialized transaction body might decrease
 * (or even increase in some very rare cases).
 * Returns a new transformed raw transaction.
 *
 * @param {RawTransaction} rawTx
 * @returns Transformed raw transaction
 */
export const transformRawTx = transformers.transformRawTx
