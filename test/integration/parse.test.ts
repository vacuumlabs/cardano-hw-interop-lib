import { expect } from 'chai'

import { ParseError, ParseErrorReason } from '../../src/errors'
import { parseRawTx,parseTx, parseTxBody } from '../../src/index'
import { ValidRawTransactionTestcases, ValidTransactionTestcases, ValidTransactionBodyTestcases } from './__fixtures__/parse'

describe("Decode and parse", () => {
    describe("Valid transaction bodies", () => {
        for (const { testname, cbor, expectedTxBody } of ValidTransactionBodyTestcases) {
            it(testname, () => {
                const txBody = parseTxBody(Buffer.from(cbor, 'hex'))

                expect(txBody).to.deep.equal(expectedTxBody)
            })
        }
    })

    describe("Valid transactions", () => {
        for (const { testname, cbor, expectedTx } of ValidTransactionTestcases) {
            it(testname, () => {
                const tx = parseTx(Buffer.from(cbor, 'hex'))

                expect(tx).to.deep.equal(expectedTx)
            })
        }
    })

    describe("Valid raw transactions", () => {
        for (const { testname, cbor, expectedRawTx } of ValidRawTransactionTestcases) {
            it(testname, () => {
                const rawTx = parseRawTx(Buffer.from(cbor, 'hex'))

                expect(rawTx).to.deep.equal(expectedRawTx)
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

        it("Transaction is not an array", () => {
            expect(() => parseTx(Buffer.from('00', 'hex'))).to.throw(ParseError, ParseErrorReason.INVALID_TX_CBOR)
        })
        it("Transaction array is too big", () => {
            expect(() => parseTx(Buffer.from('8401020304', 'hex'))).to.throw(ParseError, ParseErrorReason.INVALID_TX_CBOR)
        })

        it("Raw transaction is not an array", () => {
            expect(() => parseRawTx(Buffer.from('00', 'hex'))).to.throw(ParseError, ParseErrorReason.INVALID_RAW_TX_CBOR)
        })
        it("Raw transaction array is too big", () => {
            expect(() => parseRawTx(Buffer.from('8401020304', 'hex'))).to.throw(ParseError, ParseErrorReason.INVALID_RAW_TX_CBOR)
        })
    })
})
