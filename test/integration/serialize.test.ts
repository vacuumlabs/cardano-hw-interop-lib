import { expect } from 'chai'

import { encodeTx, encodeTxBody } from '../../src/index'
import {
  ValidTransactionBodyTestCases,
  ValidTransactionTestCases,
} from './__fixtures__/transactions'

describe('Serialize', () => {
  describe('Transaction bodies', () => {
    for (const { testName, txBody, cbor } of ValidTransactionBodyTestCases) {
      it(testName, () => {
        const serializedCbor = encodeTxBody(txBody).toString('hex')
        expect(serializedCbor).to.deep.equal(cbor)
      })
    }
  })

  describe('Transactions', () => {
    for (const { testName, tx, cbor } of ValidTransactionTestCases) {
      it(testName, () => {
        const serializedCbor = encodeTx(tx).toString('hex')
        expect(serializedCbor).to.deep.equal(cbor)
      })
    }
  })
})
