import { expect } from 'chai'

import { ParseError, ParseErrorReason } from '../../src/errors'
import { decodeRawTx, decodeTx, decodeTxBody } from '../../src/index'
import {
  ValidRawTransactionTestcases,
  ValidTransactionBodyTestcases,
  ValidTransactionTestcases,
} from './__fixtures__/transactions'

describe('Parse', () => {
  describe('Valid transaction bodies', () => {
    for (const { testname, cbor, txBody } of ValidTransactionBodyTestcases) {
      it(testname, () => {
        const parsedTxBody = decodeTxBody(Buffer.from(cbor, 'hex'))
        expect(parsedTxBody).to.deep.equal(txBody)
      })
    }
  })

  describe('Valid raw transactions', () => {
    for (const { testname, cbor, rawTx } of ValidRawTransactionTestcases) {
      it(testname, () => {
        const parsedRawTx = decodeRawTx(Buffer.from(cbor, 'hex'))
        expect(parsedRawTx).to.deep.equal(rawTx)
      })
    }
  })

  describe('Valid transactions', () => {
    for (const { testname, cbor, tx } of ValidTransactionTestcases) {
      it(testname, () => {
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

  describe('Invalid raw transactions', () => {
    it('Raw transaction is not an array', () => {
      expect(() => decodeRawTx(Buffer.from('00', 'hex'))).to.throw(
        ParseError,
        ParseErrorReason.INVALID_RAW_TX_CBOR,
      )
    })
    it('Raw transaction array is too big', () => {
      expect(() =>
        decodeRawTx(Buffer.from('8701020304050607', 'hex')),
      ).to.throw(ParseError, ParseErrorReason.INVALID_RAW_TX_CBOR)
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
