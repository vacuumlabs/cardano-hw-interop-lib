import * as parsers from './txParsers'
import type { RawTransaction, SignedTransaction, TransactionBody } from './types'
import { decodeCbor } from './utils'

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

