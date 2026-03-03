import {expect} from 'chai'

import {decodeTx, transformTx} from '../../src/index'
import {TransformTxTestCases} from './__fixtures__/txs'

describe('Transform tx', () => {
  for (const testCase of TransformTxTestCases) {
    it(testCase.testName, () => {
      const tx = decodeTx(Buffer.from(testCase.cbor, 'hex'))

      if (testCase.expectedError) {
        expect(() =>
          transformTx(tx, testCase.costModels, testCase.usedCostModelLanguages),
        ).to.throw(testCase.expectedError)
      } else {
        const transformedTx = transformTx(
          tx,
          testCase.costModels,
          testCase.usedCostModelLanguages,
        )
        expect(transformedTx).to.deep.equal(testCase.tx)
      }
    })
  }
})
