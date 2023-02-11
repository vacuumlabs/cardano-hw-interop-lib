import { expect } from 'chai'

import { ParseError, ParseErrorReason } from '../../src/errors'
import { decodeTx, decodeTxBody } from '../../src/index'
import {
  ValidTransactionBodyTestCases,
  ValidTransactionTestCases,
} from './__fixtures__/transactions'

describe('Parse', () => {
  describe('Valid transaction bodies', () => {
    for (const { testName, cbor, txBody } of ValidTransactionBodyTestCases) {
      it(testName, () => {
        const parsedTxBody = decodeTxBody(Buffer.from(cbor, 'hex'))
        expect(parsedTxBody).to.deep.equal(txBody)
      })
    }
  })

  describe('Valid transactions', () => {
    for (const { testName, cbor, tx } of ValidTransactionTestCases) {
      it(testName, () => {
        const parsedTx = decodeTx(Buffer.from(cbor, 'hex'))
        expect(parsedTx).to.deep.equal(tx)
      })
    }
  })

  describe('Invalid transaction bodies', () => {
    it('Transaction body is not a map', () => {
      expect(() => decodeTxBody(Buffer.from('00', 'hex'))).to.throw(
        ParseError,
        ParseErrorReason.INVALID_TX_BODY_CBOR,
      )
    })
    it('Transaction body is not a map with number keys', () => {
      expect(() => decodeTxBody(Buffer.from('a1616100', 'hex'))).to.throw(
        ParseError,
        ParseErrorReason.INVALID_TX_BODY_CBOR,
      )
    })
  })

  describe('Invalid transactions', () => {
    it('Transaction is not an array', () => {
      expect(() => decodeTx(Buffer.from('00', 'hex'))).to.throw(
        ParseError,
        ParseErrorReason.INVALID_TX_CBOR,
      )
    })
    it('Transaction array is too big', () => {
      expect(() => decodeTx(Buffer.from('850102030405', 'hex'))).to.throw(
        ParseError,
        ParseErrorReason.INVALID_TX_CBOR,
      )
    })
  })
})
