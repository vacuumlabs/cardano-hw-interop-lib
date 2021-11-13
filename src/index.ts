import type { ValidationError } from './errors'
import * as encoders from './txEncoders'
import * as parsers from './txParsers'
import * as transformers from './txTransformers'
import { validateTx } from './txValidators'
import type { RawTransaction, SignedTransaction, TransactionBody } from './types'
import { decodeCbor, encodeToCbor } from './utils'

export type { ValidationError } from './errors'
export * from './types'

/**
 * Take a Buffer of CBOR encoded transaction body and decodes it and parses it
 * to a TransactionBody object
 *
 * @param {Buffer} txBodyCbor The CBOR encoded input
 * @returns Parsed TransactionBody object
 */
export const parseTxBody = (txBodyCbor: Buffer): TransactionBody => parsers.parseTxBody(decodeCbor(txBodyCbor))

export const parseSignedTx = (signedTxCbor: Buffer): SignedTransaction => parsers.parseSignedTx(decodeCbor(signedTxCbor))

export const parseRawTx = (rawTxCbor: Buffer): RawTransaction => parsers.parseRawTx(decodeCbor(rawTxCbor))

/**
 * Take a transaction body and encode it back to it's CBOR representation.
 * Uses canonical CBOR serialization format as specified in
 * {@link https://datatracker.ietf.org/doc/html/rfc7049#section-3.9 Section 3.9 of CBOR specification RFC}
 *
 * @param {TransactionBody} txBody
 * @returns Buffer containing the CBOR encoded `txBody`
 */
export const encodeTxBody = (txBody: TransactionBody): Buffer => encodeToCbor(
    encoders.encodeTxBody(txBody)
)

export const encodeSignedTx = (signedTx: SignedTransaction): Buffer => encodeToCbor(
    encoders.encodeSignedTx(signedTx)
)

export const encodeRawTx = (rawTx: RawTransaction): Buffer => encodeToCbor(
    encoders.encodeRawTx(rawTx)
)

/**
 * Take a Buffer of CBOR encoded transaction body and validates it according to
 * CIP-0021, returns an array of found validation errors.
 *
 * @param {Buffer} txBodyCbor The CBOR encoded transaction body
 * @returns Found validation errors
 */
export const validateTxBody = (txBodyCbor: Buffer): ValidationError[] => {
    const txBody = parseTxBody(txBodyCbor)
    const canonicalTxBodyCbor = encodeTxBody(txBody)
    return validateTx(txBodyCbor, canonicalTxBodyCbor, txBody)
}

export const validateSignedTx = (signedTxCbor: Buffer): ValidationError[] => {
    const signedTx = parseSignedTx(signedTxCbor)
    const canonicalSignedTxCbor = encodeSignedTx(signedTx)
    return validateTx(signedTxCbor, canonicalSignedTxCbor, signedTx.body)
}

export const validateRawTx = (rawTxCbor: Buffer): ValidationError[] => {
    const rawTx = parseRawTx(rawTxCbor)
    const canonicalRawTxCbor = encodeRawTx(rawTx)
    return validateTx(rawTxCbor, canonicalRawTxCbor, rawTx.body)
}

/**
 * Take a transaction body and apply non-destructive transformations on it
 * to fix fixable validation errors. Returns a new transformed tx body.
 *
 * @param {TransactionBody} txBody
 * @returns Transformed transaction body
 */
export const transformTxBody = transformers.transformTxBody

export const transformSignedTx = transformers.transformSignedTx

export const transformRawTx = transformers.transformRawTx
