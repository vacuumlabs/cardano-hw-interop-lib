import * as encoders from './txEncoders'
import * as parsers from './txParsers'
import type { RawTransaction, SignedTransaction, TransactionBody } from './types'
import { decodeCbor, encodeToCbor } from './utils'

export type { RawTransaction, SignedTransaction, TransactionBody }

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

