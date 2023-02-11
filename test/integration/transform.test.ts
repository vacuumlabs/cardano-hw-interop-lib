import { expect } from 'chai'

import { decodeTxBody, transformTxBody } from '../../src/index'
import { TransformTransactionTestCases } from './__fixtures__/transactions'

describe('Transform', () => {
  for (const {
    testName,
    cbor,
    auxiliaryData,
    txBody,
  } of TransformTransactionTestCases) {
    it(testName, () => {
      const transformedTxBody = transformTxBody(
        decodeTxBody(Buffer.from(cbor, 'hex')),
        auxiliaryData,
      )
      expect(transformedTxBody).to.deep.equal(txBody)
    })
  }
})
