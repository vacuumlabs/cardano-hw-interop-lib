import {Tagged} from 'cbor'

import {ParseErrorReason} from '../../../src/errors'
import {
  AmountType,
  CddlNonEmptySet,
  CddlSet,
  CostModelLanguageName,
  CostModels,
  MaxLenBuffer,
  Transaction,
  TransactionInput,
  TxOutputFormat,
} from '../../../src/types'
import {fromBech32, toFixLenBuffer, toInt, toUint} from '../../test_utils'

// Preview network cost models (from protocol parameters)
const PLUTUS_V1_COST_MODEL = [
  100788, 420, 1, 1, 1000, 173, 0, 1, 1000, 59957, 4, 1, 11183, 32,
  201305, 8356, 4, 16000, 100, 16000, 100, 16000, 100, 16000, 100,
  16000, 100, 16000, 100, 100, 100, 16000, 100, 94375, 32, 132994, 32,
  61462, 4, 72010, 178, 0, 1, 22151, 32, 91189, 769, 4, 2, 85848,
  228465, 122, 0, 1, 1, 1000, 42921, 4, 2, 24548, 29498, 38, 1, 898148,
  27279, 1, 51775, 558, 1, 39184, 1000, 60594, 1, 141895, 32, 83150,
  32, 15299, 32, 76049, 1, 13169, 4, 22100, 10, 28999, 74, 1, 28999, 74,
  1, 43285, 552, 1, 44749, 541, 1, 33852, 32, 68246, 32, 72362, 32, 7243,
  32, 7391, 32, 11546, 32, 85848, 228465, 122, 0, 1, 1, 90434, 519, 0, 1,
  74433, 32, 85848, 228465, 122, 0, 1, 1, 85848, 228465, 122, 0, 1, 1,
  270652, 22588, 4, 1457325, 64566, 4, 20467, 1, 4,
  0, 141992, 32, 100788, 420, 1, 1, 81663, 32, 59498, 32, 20142, 32,
  24588, 32, 20744, 32, 25933, 32, 24623, 32, 53384111, 14333, 10,
]

const PLUTUS_V2_COST_MODEL = [
  100788, 420, 1, 1, 1000, 173, 0, 1, 1000, 59957, 4, 1, 11183, 32,
  201305, 8356, 4, 16000, 100, 16000, 100, 16000, 100, 16000, 100,
  16000, 100, 16000, 100, 100, 100, 16000, 100, 94375, 32, 132994, 32,
  61462, 4, 72010, 178, 0, 1, 22151, 32, 91189, 769, 4, 2, 85848,
  228465, 122, 0, 1, 1, 1000, 42921, 4, 2, 24548, 29498, 38, 1, 898148,
  27279, 1, 51775, 558, 1, 39184, 1000, 60594, 1, 141895, 32, 83150,
  32, 15299, 32, 76049, 1, 13169, 4, 22100, 10, 28999, 74, 1, 28999, 74,
  1, 43285, 552, 1, 44749, 541, 1, 33852, 32, 68246, 32, 72362, 32, 7243,
  32, 7391, 32, 11546, 32, 85848, 228465, 122, 0, 1, 1, 90434, 519, 0, 1,
  74433, 32, 85848, 228465, 122, 0, 1, 1, 85848, 228465, 122, 0, 1, 1,
  955506, 213312, 0, 2, 270652, 22588, 4, 1457325, 64566, 4, 20467, 1, 4,
  0, 141992, 32, 100788, 420, 1, 1, 81663, 32, 59498, 32, 20142, 32,
  24588, 32, 20744, 32, 25933, 32, 24623, 32, 43053543, 10, 53384111,
  14333, 10, 43574283, 26308, 10,
]

type TransformTransactionTestCase = {
  testName: string
  cbor: string
  costModels?: CostModels
  usedCostModelLanguages?: CostModelLanguageName[]
  expectedError?: ParseErrorReason
  tx?: Transaction
}

export const TransformTxTestCases: TransformTransactionTestCase[] = [
  {
    testName: 'Tx with Plutus scripts should throw when costModels not provided',
    cbor: '84a800d901028182582014bc084590e6a755be2ba58a2076b1064c6f71db11ae293a8e0662b86066329f000dd9010281825820a2bd30579a51e1e3eee6844308503cf2206ad93a9bf1c85a142232211f264e5400018182581d603bfb7503a7a4d5fa162fc5a61d39161f89a32755e7a406e37ee80402821b0000000254091180a1581cc0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561da14454455354011082581d603bfb7503a7a4d5fa162fc5a61d39161f89a32755e7a406e37ee804021b000000025407a840111a00043bc0021a0002d28009a1581cc0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561da14454455354010b5820bd503d94cea758c97314437dff0343c623a48dc64ab82a953469300fc08605dfa206d901028148470100002212001105a182010082d8799fd87a9f581cc0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561dffff821903201a0001b5e4f5f6',
    expectedError: ParseErrorReason.MISSING_COST_MODELS_FOR_SCRIPT_DATA_HASH,
  },
  // Submitted on preview network:
  // https://preview.cardanoscan.io/transaction/72c50cd781dda61f8aa2dce3e9b2ee5691b0e734ae6385d67ea2b16c4855ad77
  {
    testName: 'Tx with Plutus scripts should recompute scriptDataHash',
    cbor: '84a800d901028182582014bc084590e6a755be2ba58a2076b1064c6f71db11ae293a8e0662b86066329f000dd9010281825820a2bd30579a51e1e3eee6844308503cf2206ad93a9bf1c85a142232211f264e5400018182581d603bfb7503a7a4d5fa162fc5a61d39161f89a32755e7a406e37ee80402821b0000000254091180a1581cc0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561da14454455354011082581d603bfb7503a7a4d5fa162fc5a61d39161f89a32755e7a406e37ee804021b000000025407a840111a00043bc0021a0002d28009a1581cc0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561da14454455354010b5820bd503d94cea758c97314437dff0343c623a48dc64ab82a953469300fc08605dfa206d901028148470100002212001105a182010082d8799fd87a9f581cc0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561dffff821903201a0001b5e4f5f6',
    costModels: new Map([
      ['PlutusV2' as const, PLUTUS_V2_COST_MODEL],
    ]),
    tx: {
      body: {
        inputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                '14bc084590e6a755be2ba58a2076b1064c6f71db11ae293a8e0662b86066329f',
                32,
              ),
              index: toUint(0),
            },
          ],
          hasTag: true,
        } as CddlSet<TransactionInput>,
        outputs: [
          {
            format: TxOutputFormat.ARRAY_LEGACY,
            address: Buffer.from(
              '603bfb7503a7a4d5fa162fc5a61d39161f89a32755e7a406e37ee80402',
              'hex',
            ),
            amount: {
              type: AmountType.WITH_MULTIASSET,
              coin: toUint(9999815040),
              multiasset: [
                {
                  policyId: toFixLenBuffer(
                    'c0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561d',
                    28,
                  ),
                  tokens: [
                    {
                      assetName: Buffer.from('TEST') as MaxLenBuffer<32>,
                      amount: toUint(1),
                    },
                  ],
                },
              ],
            },
            datumHash: undefined,
          },
        ],
        fee: toUint(184960),
        ttl: undefined,
        certificates: undefined,
        withdrawals: undefined,
        update: undefined,
        auxiliaryDataHash: undefined,
        validityIntervalStart: undefined,
        mint: [
          {
            policyId: toFixLenBuffer(
              'c0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561d',
              28,
            ),
            tokens: [
              {
                assetName: Buffer.from('TEST') as MaxLenBuffer<32>,
                amount: toInt(1),
              },
            ],
          },
        ],
        scriptDataHash: toFixLenBuffer(
          'c3ab4f2a66df9b82482cbc9a3ca14374340b6760014163c05737ce4a4f112f57',
          32,
        ),
        collateralInputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                'a2bd30579a51e1e3eee6844308503cf2206ad93a9bf1c85a142232211f264e54',
                32,
              ),
              index: toUint(0),
            },
          ],
          hasTag: true,
        } as CddlNonEmptySet<TransactionInput>,
        requiredSigners: undefined,
        networkId: undefined,
        collateralReturnOutput: {
          format: TxOutputFormat.ARRAY_LEGACY,
          address: Buffer.from(
            '603bfb7503a7a4d5fa162fc5a61d39161f89a32755e7a406e37ee80402',
            'hex',
          ),
          amount: {
            type: AmountType.WITHOUT_MULTIASSET,
            coin: toUint(9999722560),
          },
          datumHash: undefined,
        },
        totalCollateral: toUint(277440),
        referenceInputs: undefined,
        votingProcedures: undefined,
        proposalProcedures: undefined,
        treasury: undefined,
        donation: undefined,
      },
      witnessSet: new Map<unknown, unknown>([
        [
          5,
          new Map([
            [
              [1, 0],
              [
                new Tagged(121, [
                  new Tagged(122, [
                    toFixLenBuffer(
                      'c0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561d',
                      28,
                    ),
                  ]),
                ]),
                [toUint(800), toUint(112100)],
              ],
            ],
          ]),
        ],
        [6, new Tagged(258, [Buffer.from('4701000022120011', 'hex')])],
      ]),
      scriptValidity: true,
      auxiliaryData: null,
    },
  },
  {
    testName: 'Tx without Plutus scripts should have undefined scriptDataHash',
    cbor: '83a30081825820ba638246bd9be05aa46e865320c354efea75cf5796e88b763faaa30c9fbb78de000181825839000743d16cfe3c4fcc0c11c2403bbc10dbc7ecdd4477e053481a368e7a06e2ae44dff6770dc0f4ada3cf4cf2605008e27aecdb332ad349fda700021a0001e240a10081825820abd0f26723a5de57c10eb483b14c0aec1c365d911d46ab38684c2b9b2fa4a4915840f2b04185587ed5af88cac6778b0a8392f1cd4d51e6c3722d96db62cae9d716f2d71a22aac6bde7ec097e1357b9e2ffa70eb9ab5d757d24180c843593fb302f09f6',
    tx: {
      body: {
        inputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                'ba638246bd9be05aa46e865320c354efea75cf5796e88b763faaa30c9fbb78de',
                32,
              ),
              index: toUint(0),
            },
          ],
          hasTag: false,
        } as CddlSet<TransactionInput>,
        outputs: [
          {
            format: TxOutputFormat.ARRAY_LEGACY,
            address: fromBech32(
              'addr_test1qqr585tvlc7ylnqvz8pyqwauzrdu0mxag3m7q56grgmgu7sxu2hyfhlkwuxupa9d5085eunq2qywy7hvmvej456flknswgndm3',
            ),
            amount: {
              type: AmountType.WITHOUT_MULTIASSET,
              coin: toUint(0),
            },
            datumHash: undefined,
          },
        ],
        fee: toUint(123456),
        ttl: undefined,
        certificates: undefined,
        withdrawals: undefined,
        update: undefined,
        auxiliaryDataHash: undefined,
        validityIntervalStart: undefined,
        mint: undefined,
        scriptDataHash: undefined,
        collateralInputs: undefined,
        requiredSigners: undefined,
        networkId: undefined,
        collateralReturnOutput: undefined,
        totalCollateral: undefined,
        referenceInputs: undefined,
        votingProcedures: undefined,
        proposalProcedures: undefined,
        treasury: undefined,
        donation: undefined,
      },
      witnessSet: new Map([
        [
          0,
          [
            [
              toFixLenBuffer(
                'abd0f26723a5de57c10eb483b14c0aec1c365d911d46ab38684c2b9b2fa4a491',
                28,
              ),
              toFixLenBuffer(
                'f2b04185587ed5af88cac6778b0a8392f1cd4d51e6c3722d96db62cae9d716f2d71a22aac6bde7ec097e1357b9e2ffa70eb9ab5d757d24180c843593fb302f09',
                64,
              ),
            ],
          ],
        ],
      ]),
      auxiliaryData: null,
    },
  },
  // Submitted on preview network:
  // https://preview.cardanoscan.io/transaction/7fc13d66eeed1abf1bcea5320dc08cc3a334bb697d9ef23b795cddf2387db7a6
  {
    testName: 'Tx with PlutusV1 + PlutusV2 inline scripts should recompute scriptDataHash',
    cbor: '84a800d901028182582072c50cd781dda61f8aa2dce3e9b2ee5691b0e734ae6385d67ea2b16c4855ad77000dd901028182582072c50cd781dda61f8aa2dce3e9b2ee5691b0e734ae6385d67ea2b16c4855ad7700018182581d603bfb7503a7a4d5fa162fc5a61d39161f89a32755e7a406e37ee80402821b0000000254062fd6a2581c363d3944282b3d16b239235a112c0f6e2f1195de5067f61c0dfc0f5fa1475631544f4b454e01581cc0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561da2445445535401475632544f4b454e011082581d603bfb7503a7a4d5fa162fc5a61d39161f89a32755e7a406e37ee80402821b000000025404bf01a1581cc0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561da1445445535401111a0004527f021a0002e1aa09a2581c363d3944282b3d16b239235a112c0f6e2f1195de5067f61c0dfc0f5fa1475631544f4b454e01581cc0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561da1475632544f4b454e010b5820d1c55cce723ed95226cd12991a6496ff752ddfe83bd74319338c1592f1ffba23a303d901028148470100002212001106d901028148470100002212001105a282010082d87980821903201a0001b5e482010182d87980821903201a0001b5e4f5f6',
    costModels: new Map([
      ['PlutusV1' as const, PLUTUS_V1_COST_MODEL],
      ['PlutusV2' as const, PLUTUS_V2_COST_MODEL],
    ]),
    tx: {
      body: {
        inputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                '72c50cd781dda61f8aa2dce3e9b2ee5691b0e734ae6385d67ea2b16c4855ad77',
                32,
              ),
              index: toUint(0),
            },
          ],
          hasTag: true,
        } as CddlSet<TransactionInput>,
        outputs: [
          {
            format: TxOutputFormat.ARRAY_LEGACY,
            address: Buffer.from(
              '603bfb7503a7a4d5fa162fc5a61d39161f89a32755e7a406e37ee80402',
              'hex',
            ),
            amount: {
              type: AmountType.WITH_MULTIASSET,
              coin: toUint(9999626198),
              multiasset: [
                {
                  policyId: toFixLenBuffer(
                    '363d3944282b3d16b239235a112c0f6e2f1195de5067f61c0dfc0f5f',
                    28,
                  ),
                  tokens: [
                    {
                      assetName: Buffer.from('V1TOKEN') as MaxLenBuffer<32>,
                      amount: toUint(1),
                    },
                  ],
                },
                {
                  policyId: toFixLenBuffer(
                    'c0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561d',
                    28,
                  ),
                  tokens: [
                    {
                      assetName: Buffer.from('TEST') as MaxLenBuffer<32>,
                      amount: toUint(1),
                    },
                    {
                      assetName: Buffer.from('V2TOKEN') as MaxLenBuffer<32>,
                      amount: toUint(1),
                    },
                  ],
                },
              ],
            },
            datumHash: undefined,
          },
        ],
        fee: toUint(188842),
        ttl: undefined,
        certificates: undefined,
        withdrawals: undefined,
        update: undefined,
        auxiliaryDataHash: undefined,
        validityIntervalStart: undefined,
        mint: [
          {
            policyId: toFixLenBuffer(
              '363d3944282b3d16b239235a112c0f6e2f1195de5067f61c0dfc0f5f',
              28,
            ),
            tokens: [
              {
                assetName: Buffer.from('V1TOKEN') as MaxLenBuffer<32>,
                amount: toInt(1),
              },
            ],
          },
          {
            policyId: toFixLenBuffer(
              'c0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561d',
              28,
            ),
            tokens: [
              {
                assetName: Buffer.from('V2TOKEN') as MaxLenBuffer<32>,
                amount: toInt(1),
              },
            ],
          },
        ],
        scriptDataHash: toFixLenBuffer(
          'd1c55cce723ed95226cd12991a6496ff752ddfe83bd74319338c1592f1ffba23',
          32,
        ),
        collateralInputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                '72c50cd781dda61f8aa2dce3e9b2ee5691b0e734ae6385d67ea2b16c4855ad77',
                32,
              ),
              index: toUint(0),
            },
          ],
          hasTag: true,
        } as CddlNonEmptySet<TransactionInput>,
        requiredSigners: undefined,
        networkId: undefined,
        collateralReturnOutput: {
          format: TxOutputFormat.ARRAY_LEGACY,
          address: Buffer.from(
            '603bfb7503a7a4d5fa162fc5a61d39161f89a32755e7a406e37ee80402',
            'hex',
          ),
          amount: {
            type: AmountType.WITH_MULTIASSET,
            coin: toUint(9999531777),
            multiasset: [
              {
                policyId: toFixLenBuffer(
                  'c0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561d',
                  28,
                ),
                tokens: [
                  {
                    assetName: Buffer.from('TEST') as MaxLenBuffer<32>,
                    amount: toUint(1),
                  },
                ],
              },
            ],
          },
          datumHash: undefined,
        },
        totalCollateral: toUint(283263),
        referenceInputs: undefined,
        votingProcedures: undefined,
        proposalProcedures: undefined,
        treasury: undefined,
        donation: undefined,
      },
      witnessSet: new Map<unknown, unknown>([
        [3, new Tagged(258, [Buffer.from('4701000022120011', 'hex')])],
        [6, new Tagged(258, [Buffer.from('4701000022120011', 'hex')])],
        [
          5,
          new Map([
            [
              [1, 0],
              [
                new Tagged(121, []),
                [toUint(800), toUint(112100)],
              ],
            ],
            [
              [1, 1],
              [
                new Tagged(121, []),
                [toUint(800), toUint(112100)],
              ],
            ],
          ]),
        ],
      ]),
      scriptValidity: true,
      auxiliaryData: null,
    },
  },
  // Submitted on preview network:
  // https://preview.cardanoscan.io/transaction/f40da72df7994fde9f5f600e1a666ac4d7bf91327b7a9e93a6ee3084ae5e1a5e
  {
    testName: 'Tx with reference script (no inline scripts) should recompute scriptDataHash with usedCostModelLanguages',
    cbor: '84a900d9010281825820e604a2c9f22c2a4a052f0f4b25627d0931a2574a9f8d778ecb2deef0665eedd2010dd9010281825820e604a2c9f22c2a4a052f0f4b25627d0931a2574a9f8d778ecb2deef0665eedd20112d9010281825820e604a2c9f22c2a4a052f0f4b25627d0931a2574a9f8d778ecb2deef0665eedd200018182581d603bfb7503a7a4d5fa162fc5a61d39161f89a32755e7a406e37ee80402821b0000000253b732a9a2581c363d3944282b3d16b239235a112c0f6e2f1195de5067f61c0dfc0f5fa1475631544f4b454e01581cc0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561da248524546544f4b454e01475632544f4b454e011082581d603bfb7503a7a4d5fa162fc5a61d39161f89a32755e7a406e37ee80402821b0000000253b5c4f7a2581c363d3944282b3d16b239235a112c0f6e2f1195de5067f61c0dfc0f5fa1475631544f4b454e01581cc0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561da1475632544f4b454e01111a00044916021a0002db6409a1581cc0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561da148524546544f4b454e010b582058004ec88258e4bea747f207fb80dae957fe2cab2218efbce029beffc7f24a9da105a182010082d87980821903201a0001b5e4f5f6',
    costModels: new Map([
      ['PlutusV2' as const, PLUTUS_V2_COST_MODEL],
    ]),
    usedCostModelLanguages: ['PlutusV2' as const],
    tx: {
      body: {
        inputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                'e604a2c9f22c2a4a052f0f4b25627d0931a2574a9f8d778ecb2deef0665eedd2',
                32,
              ),
              index: toUint(1),
            },
          ],
          hasTag: true,
        } as CddlSet<TransactionInput>,
        outputs: [
          {
            format: TxOutputFormat.ARRAY_LEGACY,
            address: Buffer.from(
              '603bfb7503a7a4d5fa162fc5a61d39161f89a32755e7a406e37ee80402',
              'hex',
            ),
            amount: {
              type: AmountType.WITH_MULTIASSET,
              coin: toUint(9994449577),
              multiasset: [
                {
                  policyId: toFixLenBuffer(
                    '363d3944282b3d16b239235a112c0f6e2f1195de5067f61c0dfc0f5f',
                    28,
                  ),
                  tokens: [
                    {
                      assetName: Buffer.from('V1TOKEN') as MaxLenBuffer<32>,
                      amount: toUint(1),
                    },
                  ],
                },
                {
                  policyId: toFixLenBuffer(
                    'c0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561d',
                    28,
                  ),
                  tokens: [
                    {
                      assetName: Buffer.from('REFTOKEN') as MaxLenBuffer<32>,
                      amount: toUint(1),
                    },
                    {
                      assetName: Buffer.from('V2TOKEN') as MaxLenBuffer<32>,
                      amount: toUint(1),
                    },
                  ],
                },
              ],
            },
            datumHash: undefined,
          },
        ],
        fee: toUint(187236),
        ttl: undefined,
        certificates: undefined,
        withdrawals: undefined,
        update: undefined,
        auxiliaryDataHash: undefined,
        validityIntervalStart: undefined,
        mint: [
          {
            policyId: toFixLenBuffer(
              'c0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561d',
              28,
            ),
            tokens: [
              {
                assetName: Buffer.from('REFTOKEN') as MaxLenBuffer<32>,
                amount: toInt(1),
              },
            ],
          },
        ],
        scriptDataHash: toFixLenBuffer(
          '58004ec88258e4bea747f207fb80dae957fe2cab2218efbce029beffc7f24a9d',
          32,
        ),
        collateralInputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                'e604a2c9f22c2a4a052f0f4b25627d0931a2574a9f8d778ecb2deef0665eedd2',
                32,
              ),
              index: toUint(1),
            },
          ],
          hasTag: true,
        } as CddlNonEmptySet<TransactionInput>,
        requiredSigners: undefined,
        networkId: undefined,
        collateralReturnOutput: {
          format: TxOutputFormat.ARRAY_LEGACY,
          address: Buffer.from(
            '603bfb7503a7a4d5fa162fc5a61d39161f89a32755e7a406e37ee80402',
            'hex',
          ),
          amount: {
            type: AmountType.WITH_MULTIASSET,
            coin: toUint(9994355959),
            multiasset: [
              {
                policyId: toFixLenBuffer(
                  '363d3944282b3d16b239235a112c0f6e2f1195de5067f61c0dfc0f5f',
                  28,
                ),
                tokens: [
                  {
                    assetName: Buffer.from('V1TOKEN') as MaxLenBuffer<32>,
                    amount: toUint(1),
                  },
                ],
              },
              {
                policyId: toFixLenBuffer(
                  'c0f8644a01a6bf5db02f4afe30d604975e63dd274f1098a1738e561d',
                  28,
                ),
                tokens: [
                  {
                    assetName: Buffer.from('V2TOKEN') as MaxLenBuffer<32>,
                    amount: toUint(1),
                  },
                ],
              },
            ],
          },
          datumHash: undefined,
        },
        totalCollateral: toUint(280854),
        referenceInputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                'e604a2c9f22c2a4a052f0f4b25627d0931a2574a9f8d778ecb2deef0665eedd2',
                32,
              ),
              index: toUint(0),
            },
          ],
          hasTag: true,
        } as CddlNonEmptySet<TransactionInput>,
        votingProcedures: undefined,
        proposalProcedures: undefined,
        treasury: undefined,
        donation: undefined,
      },
      witnessSet: new Map<unknown, unknown>([
        [
          5,
          new Map([
            [
              [1, 0],
              [
                new Tagged(121, []),
                [toUint(800), toUint(112100)],
              ],
            ],
          ]),
        ],
      ]),
      scriptValidity: true,
      auxiliaryData: null,
    },
  },
]
