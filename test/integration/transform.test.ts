import {expect} from 'chai'

import {decodeTxBody, transformTxBody, validateTxBody} from '../../src/index'
import {TransformTransactionTestCases} from './__fixtures__/transactions'

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

describe('Validate', () => {
  for (const {
    testName,
    cbor,
    validationErrors,
  } of TransformTransactionTestCases) {
    it(testName, () => {
      const errors = validateTxBody(Buffer.from(cbor, 'hex'))
      expect(errors).to.deep.equal(validationErrors)
    })
  }
})
