import { expect } from 'chai'

import { encodeRawTx, encodeTx, encodeTxBody } from '../../src/index'
import { ValidRawTransactionTestcases, ValidTransactionBodyTestcases, ValidTransactionTestcases } from './__fixtures__/transactions'

describe("Serialize", () => {
    describe("Transaction bodies", () => {
        for (const { testname, txBody, cbor } of ValidTransactionBodyTestcases) {
            it(testname, () => {
                const serializedCbor = encodeTxBody(txBody).toString('hex')
                expect(serializedCbor).to.deep.equal(cbor)
            })
        }
    })

    describe("Raw transactions", () => {
        for (const { testname, rawTx, cbor } of ValidRawTransactionTestcases) {
            it(testname, () => {
                const serializedCbor = encodeRawTx(rawTx).toString('hex')
                expect(serializedCbor).to.deep.equal(cbor)
            })
        }
    })

    describe("Transactions", () => {
        for (const { testname, tx, cbor } of ValidTransactionTestcases) {
            it(testname, () => {
                const serializedCbor = encodeTx(tx).toString('hex')
                expect(serializedCbor).to.deep.equal(cbor)
            })
        }
    })
})
