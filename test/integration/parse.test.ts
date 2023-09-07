import {expect} from 'chai'

import {ParseError, ParseErrorReason} from '../../src/errors'
import {decodeTx, decodeTxBody} from '../../src/index'
import {
  ValidTransactionBodyTestCases,
  ValidTransactionTestCases,
} from './__fixtures__/transactions'

describe('Parse', () => {
  describe('Valid transaction bodies', () => {
    for (const {testName, cbor, txBody} of ValidTransactionBodyTestCases) {
      it(testName, () => {
        const parsedTxBody = decodeTxBody(Buffer.from(cbor, 'hex'))
        expect(parsedTxBody).to.deep.equal(txBody)
      })
    }
  })

  describe('Valid transactions', () => {
    for (const {testName, cbor, tx} of ValidTransactionTestCases) {
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
    it('Transaction body contains unknown items --- negative key', () => {
      expect(() =>
        decodeTxBody(
          Buffer.from(
            // tx body map key -17 not allowed
            'a30081825820ba638246bd9be05aa46e865320c354efea75cf5796e88b763faaa30c9fbb78de003181825839000743d16cfe3c4fcc0c11c2403bbc10dbc7ecdd4477e053481a368e7a06e2ae44dff6770dc0f4ada3cf4cf2605008e27aecdb332ad349fda700021a0001e240',
            'hex',
          ),
        ),
      ).to.throw(ParseError, ParseErrorReason.INVALID_TX_BODY_UNKNOWN_ITEMS)
    })
    it('Transaction body contains unknown items --- unsupported key', () => {
      expect(() =>
        decodeTxBody(
          Buffer.from(
            // tx body map key 10 is not defined in the CDDL
            'a30081825820ba638246bd9be05aa46e865320c354efea75cf5796e88b763faaa30c9fbb78de000a81825839000743d16cfe3c4fcc0c11c2403bbc10dbc7ecdd4477e053481a368e7a06e2ae44dff6770dc0f4ada3cf4cf2605008e27aecdb332ad349fda700021a0001e240',
            'hex',
          ),
        ),
      ).to.throw(ParseError, ParseErrorReason.INVALID_TX_BODY_UNKNOWN_ITEMS)
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
