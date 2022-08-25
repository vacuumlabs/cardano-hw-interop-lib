import { expect } from 'chai'

import { decodeTxBody, transformTxBody } from '../../src/index'
import { TransformTransactionTestcases } from './__fixtures__/transactions'

describe('Transform', () => {
  for (const {
    testname,
    cbor,
    auxiliaryData,
    txBody,
  } of TransformTransactionTestcases) {
    it(testname, () => {
      const transformedTxBody = transformTxBody(
        decodeTxBody(Buffer.from(cbor, 'hex')),
        auxiliaryData,
      )
      expect(transformedTxBody).to.deep.equal(txBody)
    })
  }
})
