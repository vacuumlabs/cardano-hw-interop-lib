import { ParseErrorReason } from '../../src/errors'
import { parseOutputs } from '../../src/txParsers'
import type { MaxlenBuffer, TransactionOutput } from '../../src/types'
import { DatumType } from '../../src/types'
import { TxOutputFormat } from '../../src/types'
import { AmountType } from '../../src/types'
import type { InvalidParseTestcase, ValidParseTestcase } from '../test_utils'
import {
  fromBech32,
  registerTests,
  toFixlenBuffer,
  toUint,
} from '../test_utils'

const ValidOutputsTestcases: ValidParseTestcase<TransactionOutput[]>[] = [
  {
    testname: 'Simple',
    cbor: '81825839019b3a93b321ff8d65d6df1c6d845d54dbbf2cb34105fdb44ece1b7d312c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d00',
    parsed: [
      {
        format: TxOutputFormat.ARRAY_LEGACY,
        address: fromBech32(
          'addr1qxdn4yany8lc6ewkmuwxmpza2ndm7t9ngyzlmdzwecdh6vfvqjwlak9ug8k7lw7gxh9q5uuu4jtp24u4qf3w7j9uluwssp092m',
        ),
        amount: {
          type: AmountType.WITHOUT_MULTIASSET,
          coin: toUint(0),
        },
        datumHash: undefined,
      },
    ],
  },
  {
    testname: 'Big output',
    cbor: '81825839019B3A93B321FF8D65D6DF1C6D845D54DBBF2CB34105FDB44ECE1B7D312C049DFED8BC41EDEFBBC835CA0A739CAC961557950262EF48BCFF1DC249010000000000000000',
    parsed: [
      {
        format: TxOutputFormat.ARRAY_LEGACY,
        address: fromBech32(
          'addr1qxdn4yany8lc6ewkmuwxmpza2ndm7t9ngyzlmdzwecdh6vfvqjwlak9ug8k7lw7gxh9q5uuu4jtp24u4qf3w7j9uluwssp092m',
        ),
        amount: {
          type: AmountType.WITHOUT_MULTIASSET,
          coin: toUint('18446744073709551616'),
        },
        datumHash: undefined,
      },
    ],
  },
  {
    testname: 'One output with multiasset',
    cbor: '8182583930167f6dbf610ae030f043adb1f3af78754ed9595ad4ac1f7ed9ff6466760fb6955d1217b1f1f208df6d45ab23c9e17b0c984a2d3a22bbbfb8821a3b7625dea1581cd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2a14c56616363756d546f6b656e731a000f4240',
    parsed: [
      {
        format: TxOutputFormat.ARRAY_LEGACY,
        address: fromBech32(
          'addr_test1xqt87mdlvy9wqv8sgwkmrua00p65ak2ett22c8m7m8lkgenkp7mf2hgjz7clrusgmak5t2ere8shkrycfgkn5g4mh7uqvcq039',
        ),
        amount: {
          type: AmountType.WITH_MULTIASSET,
          coin: toUint(997598686),
          multiasset: [
            {
              policyId: toFixlenBuffer(
                'd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2',
                28,
              ),
              tokens: [
                {
                  assetName: Buffer.from(
                    '56616363756D546F6B656E73',
                    'hex',
                  ) as MaxlenBuffer<32>,
                  amount: toUint(1000000),
                },
              ],
            },
          ],
        },
        datumHash: undefined,
      },
    ],
  },
  {
    testname: 'One output with inline datum and reference script',
    cbor: '81a4005839008b3303988371208dd0916cc4548c4eafc2fd3d6205ea8ec180c1b1d9e0820d5929d99bce8aa81e86195fd2b824e6550820a03af325f6ff220100028201d81841a003d8185846820158425840010000332233322222253353004333573466ebc00c00801801440204c98d4c01ccd5ce2481094e6f7420457175616c0000849848800848800480044800480041',
    parsed: [
      {
        format: TxOutputFormat.MAP_BABBAGE,
        address: fromBech32(
          'addr_test1qz9nxqucsdcjprwsj9kvg4yvf6hu9lfavgz74rkpsrqmrk0qsgx4j2wen08g42q7scv4l54cynn92zpq5qa0xf0klu3qe9xkhw',
        ),
        amount: {
          type: AmountType.WITHOUT_MULTIASSET,
          coin: toUint(0),
        },
        datum: {
          type: DatumType.INLINE,
          bytes: Buffer.from('a0', 'hex'),
        },
        referenceScript: Buffer.from(
          '820158425840010000332233322222253353004333573466ebc00c00801801440204c98d4c01ccd5ce2481094e6f7420457175616c0000849848800848800480044800480041',
          'hex',
        ),
      },
    ],
  },
]

const InvalidOutputsTestcases: InvalidParseTestcase[] = [
  {
    testname: 'Not an array',
    cbor: 'a100f6',
    errMsg: ParseErrorReason.INVALID_TX_OUTPUTS,
  },
  {
    testname: 'Invalid output structure',
    cbor: '8184187b010203',
    errMsg: ParseErrorReason.INVALID_TX_OUTPUT,
  },
  {
    testname: 'Invalid output address',
    cbor: '818278193031394233413933423332314646384436354436444631433600',
    errMsg: ParseErrorReason.INVALID_OUTPUT_ADDRESS,
  },
  {
    testname: 'Invalid output mutliasset (invalid policy id)',
    cbor: '8182583930167f6dbf610ae030f043adb1f3af78754ed9595ad4ac1f7ed9ff6466760fb6955d1217b1f1f208df6d45ab23c9e17b0c984a2d3a22bbbfb8821a3b7625dea1581bd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9a14c56616363756d546f6b656e731a000f4240',
    errMsg: ParseErrorReason.INVALID_POLICY_ID,
  },
  {
    testname: 'Invalid output multiasset',
    cbor: '8182583930167F6DBF610AE030F043ADB1F3AF78754ED9595AD4AC1F7ED9FF6466760FB6955D1217B1F1F208DF6D45AB23C9E17B0C984A2D3A22BBBFB8821A3B7625DEF6',
    errMsg: ParseErrorReason.INVALID_OUTPUT_MULTIASSET,
  },
]

registerTests(
  'Parse transaction outputs',
  parseOutputs,
  ValidOutputsTestcases,
  InvalidOutputsTestcases,
)
