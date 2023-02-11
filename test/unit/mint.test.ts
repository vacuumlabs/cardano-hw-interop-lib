import { ParseErrorReason } from '../../src/errors'
import { parseMint } from '../../src/txParsers'
import type { MaxLenBuffer, Mint } from '../../src/types'
import type { InvalidParseTestCase, ValidParseTestCase } from '../test_utils'
import { registerTests, toFixLenBuffer, toInt } from '../test_utils'

const ValidMintTestCases: ValidParseTestCase<Mint>[] = [
  {
    testName: 'One policy id, one asset',
    cbor: 'a1581c4a7fc1c3490c30e23961d24f345c81f2dd1105643776098530f06cffa14554306b656e186f',
    parsed: [
      {
        policyId: toFixLenBuffer(
          '4a7fc1c3490c30e23961d24f345c81f2dd1105643776098530f06cff',
          28,
        ),
        tokens: [
          {
            assetName: Buffer.from('T0ken') as MaxLenBuffer<32>,
            amount: toInt(111),
          },
        ],
      },
    ],
  },
  {
    testName: 'One policy id, two assets',
    cbor: 'a1581cd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2a2525365636f6e645f47726561745f546f6b656e1b7fffffffffffffff4554306b656e392fb7',
    parsed: [
      {
        policyId: toFixLenBuffer(
          'd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2',
          28,
        ),
        tokens: [
          {
            assetName: Buffer.from('Second_Great_Token') as MaxLenBuffer<32>,
            amount: toInt('9223372036854775807'),
          },
          {
            assetName: Buffer.from('T0ken') as MaxLenBuffer<32>,
            amount: toInt(-12216),
          },
        ],
      },
    ],
  },
  {
    testName: 'Two policy ids, one asset per each',
    cbor: 'a2581cd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2a14554306b656e187c581c4a7fc1c3490c30e23961d24f345c81f2dd1105643776098530f06cffa15056616375756d6c61627349734e6963651a00989680',
    parsed: [
      {
        policyId: toFixLenBuffer(
          'd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2',
          28,
        ),
        tokens: [
          {
            assetName: Buffer.from('T0ken') as MaxLenBuffer<32>,
            amount: toInt(124),
          },
        ],
      },
      {
        policyId: toFixLenBuffer(
          '4a7fc1c3490c30e23961d24f345c81f2dd1105643776098530f06cff',
          28,
        ),
        tokens: [
          {
            assetName: Buffer.from('VacuumlabsIsNice') as MaxLenBuffer<32>,
            amount: toInt(10000000),
          },
        ],
      },
    ],
  },
]

const InvalidMintTestCases: InvalidParseTestCase[] = [
  {
    testName: 'Not a map',
    cbor: '83016161f6',
    errMsg: ParseErrorReason.INVALID_MINT,
  },
  {
    testName: 'Invalid policy id',
    cbor: 'a1f6a14554306b656e187c',
    errMsg: ParseErrorReason.INVALID_POLICY_ID,
  },
  {
    testName: 'Invalid asset name',
    cbor: 'a1581cd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2a10101',
    errMsg: ParseErrorReason.INVALID_ASSET_NAME,
  },
  {
    testName: 'Invalid mint amount',
    cbor: 'a1581cd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2a141006161',
    errMsg: ParseErrorReason.INVALID_MINT_AMOUNT,
  },
]

registerTests('Parse mint', parseMint, ValidMintTestCases, InvalidMintTestCases)
