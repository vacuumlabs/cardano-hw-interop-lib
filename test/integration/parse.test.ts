import { expect } from 'chai'

import { ParseError, ParseErrorReason } from '../../src/errors'
import { parseRawTx,parseSignedTx, parseTxBody } from '../../src/index'
import { ValidRawTransactionTestcases, ValidSignedTransactionTestcases, ValidTransactionBodyTestcases } from './__fixtures__/parse'

describe("Decode and parse", () => {
    describe("Valid transaction bodies", () => {
        for (const { testname, cbor, expectedTxBody } of ValidTransactionBodyTestcases) {
            it(testname, () => {
                const txBody = parseTxBody(Buffer.from(cbor, 'hex'))

                expect(txBody).to.deep.equal(expectedTxBody)
            })
        }
    })

    describe("Valid signed transactions", () => {
        for (const { testname, cbor, expectedSignedTx } of ValidSignedTransactionTestcases) {
            it(testname, () => {
                const signedTx = parseSignedTx(Buffer.from(cbor, 'hex'))

                expect(signedTx).to.deep.equal(expectedSignedTx)
            })
        }
    })

    describe("Valid unsigned transactions", () => {
        for (const { testname, cbor, expectedUnsignedTx } of ValidRawTransactionTestcases) {
            it(testname, () => {
                const unsignedTx = parseRawTx(Buffer.from(cbor, 'hex'))

                expect(unsignedTx).to.deep.equal(expectedUnsignedTx)
            })
        }
    })

    describe("Invalid transactions", () => {
        it("Transaction body is not a map", () => {
            expect(() => parseTxBody(Buffer.from('00', 'hex'))).to.throw(ParseError, ParseErrorReason.INVALID_TX_BODY_CBOR)
        })
        it("Transaction body is not a map with number keys", () => {
            expect(() => parseTxBody(Buffer.from('a1616100', 'hex'))).to.throw(ParseError, ParseErrorReason.INVALID_TX_BODY_CBOR)
        })

        it("Signed transaction is not an array", () => {
            expect(() => parseSignedTx(Buffer.from('00', 'hex'))).to.throw(ParseError, ParseErrorReason.INVALID_SIGNED_TX_CBOR)
        })
        it("Signed transaction array is too big", () => {
            expect(() => parseSignedTx(Buffer.from('8401020304', 'hex'))).to.throw(ParseError, ParseErrorReason.INVALID_SIGNED_TX_CBOR)
        })

        it("Unsigned transaction is not an array", () => {
            expect(() => parseRawTx(Buffer.from('00', 'hex'))).to.throw(ParseError, ParseErrorReason.INVALID_RAW_TX_CBOR)
        })
        it("Unsigned transaction array is too big", () => {
            expect(() => parseRawTx(Buffer.from('8401020304', 'hex'))).to.throw(ParseError, ParseErrorReason.INVALID_RAW_TX_CBOR)
        })
    })
})
