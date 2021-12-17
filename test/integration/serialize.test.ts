import { expect } from 'chai'

import { encodeTxBody } from '../../src/index'
import { TxBodyTestcases } from './__fixtures__/serialize'

describe("Serialize", () => {
    describe("Transaction bodies", () => {
        for (const { testname, txBody, expectedTxBodyCbor } of TxBodyTestcases) {
            it(testname, () => {
                const txBodyCbor = encodeTxBody(txBody)
                expect(txBodyCbor.equals(Buffer.from(expectedTxBodyCbor, 'hex'))).to.be.true
            })
        }
    })
})
