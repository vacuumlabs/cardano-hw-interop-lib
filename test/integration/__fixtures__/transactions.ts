import {ValidationError, ValidationErrorReason} from '../../../src/errors'
import {
  MaxLenBuffer,
  Port,
  Transaction,
  TransactionBody,
  VoteOption,
  VoterType,
  AmountType,
  CertificateType,
  DatumType,
  RelayType,
  CredentialType,
  TxOutputFormat,
  DRepType,
  CddlSet,
  TransactionInput,
  CddlNonEmptySet,
  Certificate,
  CddlNonEmptyOrderedSet,
  KeyHash,
  RequiredSigner,
  ProposalProcedure,
  DNS_NAME_MAX_LENGTH,
  URL_MAX_LENGTH,
} from '../../../src/types'
import {
  fromBech32,
  ipv4ToBuffer,
  rewardAccount,
  toFixLenBuffer,
  toInt,
  toMaxLenString,
  toUint,
} from '../../test_utils'
import {
  CanonicalAuxiliaryData,
  NonCanonicalAuxiliaryData,
} from './auxiliaryData'

type ValidTransactionBodyTestCase = {
  testName: string
  cbor: string
  txBody: TransactionBody
}

export const ValidTransactionBodyTestCases: ValidTransactionBodyTestCase[] = [
  {
    testName: 'Simple tx body',
    cbor: 'a30081825820ba638246bd9be05aa46e865320c354efea75cf5796e88b763faaa30c9fbb78de000181825839000743d16cfe3c4fcc0c11c2403bbc10dbc7ecdd4477e053481a368e7a06e2ae44dff6770dc0f4ada3cf4cf2605008e27aecdb332ad349fda700021a0001e240',
    txBody: {
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
  },
  {
    testName: 'Simple tx body with a 258 tag in inputs',
    cbor: 'a300d9010281825820ba638246bd9be05aa46e865320c354efea75cf5796e88b763faaa30c9fbb78de000181825839000743d16cfe3c4fcc0c11c2403bbc10dbc7ecdd4477e053481a368e7a06e2ae44dff6770dc0f4ada3cf4cf2605008e27aecdb332ad349fda700021a0001e240',
    txBody: {
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
        hasTag: true,
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
  },
  {
    testName: 'Tx body with withdrawals',
    cbor: 'a4008182582094461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d000181825839000743d16cfe3c4fcc0c11c2403bbc10dbc7ecdd4477e053481a368e7a06e2ae44dff6770dc0f4ada3cf4cf2605008e27aecdb332ad349fda71a3dbb8b21021a0003ba1105a2581df0760fb6955d1217b1f1f208df6d45ab23c9e17b0c984a2d3a22bbbfb81a00bd979c581df0b494d35f236093e7caed75d2b99b1e523cde935a6f4a2d276b9fb4011a07b914d0',
    txBody: {
      inputs: {
        items: [
          {
            transactionId: toFixLenBuffer(
              '94461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d',
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
            coin: toUint(1035701025),
          },
          datumHash: undefined,
        },
      ],
      fee: toUint(244241),
      ttl: undefined,
      certificates: undefined,
      withdrawals: [
        {
          rewardAccount: rewardAccount(
            'stake_test17pmqld54t5fp0v037gyd7m294v3unctmpjvy5tf6y2amlwqun8tdp',
          ),
          amount: toUint(12425116),
        },
        {
          rewardAccount: rewardAccount(
            'stake_test17z6ff56lydsf8e72a46a9wvmrefreh5ntfh55tf8dw0mgqg860tem',
          ),
          amount: toUint(129570000),
        },
      ],
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
  },
  {
    testName: 'Tx body with empty withdrawals',
    cbor: 'a60081825820bc8bf52ea894fb8e442fe3eea628be87d0c9a37baef185b70eb00a5c8a849d3b0001818258390180f9e2c88e6c817008f3a812ed889b4a4da8e0bd103f86e7335422aa122a946b9ad3d2ddf029d3a828f0468aece76895f15c9efbd69b42771a0023583c021a00029b75031a01a3bd8f05a0061a01a3bd8f',
    txBody: {
      inputs: {
        items: [
          {
            transactionId: toFixLenBuffer(
              'bc8bf52ea894fb8e442fe3eea628be87d0c9a37baef185b70eb00a5c8a849d3b',
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
          address: toFixLenBuffer(
            '0180f9e2c88e6c817008f3a812ed889b4a4da8e0bd103f86e7335422aa122a946b9ad3d2ddf029d3a828f0468aece76895f15c9efbd69b4277',
            57,
          ),
          amount: {
            type: AmountType.WITHOUT_MULTIASSET,
            coin: toUint(2316348),
          },
          datumHash: undefined,
        },
      ],
      fee: toUint(170869),
      ttl: toUint(27508111),
      certificates: undefined,
      withdrawals: [],
      update: toUint(27508111),
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
  },
  {
    testName: 'Tx body with multiple outputs and multiassets',
    cbor: 'a40081825820b64ae44e1195b04663ab863b62337e626c65b0c9855a9fbb9ef4458f81a6f5ee1bffffffffffffffff018282583930167f6dbf610ae030f043adb1f3af78754ed9595ad4ac1f7ed9ff6466760fb6955d1217b1f1f208df6d45ab23c9e17b0c984a2d3a22bbbfb8821a0001e91fa1581cd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2a146546f6b656e3101825839000743d16cfe3c4fcc0c11c2403bbc10dbc7ecdd4477e053481a368e7a06e2ae44dff6770dc0f4ada3cf4cf2605008e27aecdb332ad349fda7821a3dbb8b21a1581cd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2a246546f6b656e311a00155d9746546f6b656e321a00beeff1021a0003050309a1581cd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2a246546f6b656e313a0098967f46546f6b656e321b7fffffffffffffff',
    txBody: {
      inputs: {
        items: [
          {
            transactionId: toFixLenBuffer(
              'b64ae44e1195b04663ab863b62337e626c65b0c9855a9fbb9ef4458f81a6f5ee',
              32,
            ),
            index: toUint('18446744073709551615'),
          },
        ],
        hasTag: false,
      } as CddlSet<TransactionInput>,
      outputs: [
        {
          format: TxOutputFormat.ARRAY_LEGACY,
          address: fromBech32(
            'addr_test1xqt87mdlvy9wqv8sgwkmrua00p65ak2ett22c8m7m8lkgenkp7mf2hgjz7clrusgmak5t2ere8shkrycfgkn5g4mh7uqvcq039',
          ),
          amount: {
            type: AmountType.WITH_MULTIASSET,
            coin: toUint(125215),
            multiasset: [
              {
                policyId: toFixLenBuffer(
                  'd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2',
                  28,
                ),
                tokens: [
                  {
                    assetName: Buffer.from('Token1') as MaxLenBuffer<32>,
                    amount: toUint(1),
                  },
                ],
              },
            ],
          },
          datumHash: undefined,
        },
        {
          format: TxOutputFormat.ARRAY_LEGACY,
          address: fromBech32(
            'addr_test1qqr585tvlc7ylnqvz8pyqwauzrdu0mxag3m7q56grgmgu7sxu2hyfhlkwuxupa9d5085eunq2qywy7hvmvej456flknswgndm3',
          ),
          amount: {
            type: AmountType.WITH_MULTIASSET,
            coin: toUint(1035701025),
            multiasset: [
              {
                policyId: toFixLenBuffer(
                  'd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2',
                  28,
                ),
                tokens: [
                  {
                    assetName: Buffer.from('Token1') as MaxLenBuffer<32>,
                    amount: toUint(1400215),
                  },
                  {
                    assetName: Buffer.from('Token2') as MaxLenBuffer<32>,
                    amount: toUint(12513265),
                  },
                ],
              },
            ],
          },
          datumHash: undefined,
        },
      ],
      fee: toUint(197891),
      ttl: undefined,
      certificates: undefined,
      withdrawals: undefined,
      update: undefined,
      auxiliaryDataHash: undefined,
      validityIntervalStart: undefined,
      mint: [
        {
          policyId: toFixLenBuffer(
            'd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2',
            28,
          ),
          tokens: [
            {
              assetName: Buffer.from('Token1') as MaxLenBuffer<32>,
              amount: toInt(-10000000),
            },
            {
              assetName: Buffer.from('Token2') as MaxLenBuffer<32>,
              amount: toInt('9223372036854775807'),
            },
          ],
        },
      ],
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
  },
  {
    testName: 'Tx body with certificates',
    cbor: 'a40081825820b64ae44e1195b04663ab863b62337e626c65b0c9855a9fbb9ef4458f81a6f5ee182a0181825839019b3a93b321ff8d65d6df1c6d845d54dbbf2cb34105fdb44ece1b7d312c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d01021a0012fc51048582008200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d82018201581cc1d58a7602c3bd8104cd2a871a2d1cb68f6f6669bd37a7688618ee5583028200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d581c001337292eec9b3eefc6802f71cb34c21a7963eb12466d52836aa3908a03581c4dfbc0559b2e1d6af62c447f0a0d6290a8b05e075ef08db38c1b81a8582067c5c0b45db55e8c82752263207b9a92c2d5fa6c671aceed9df451cad3fac7a31a0001e2401a05f5e100d81e82031819581de1d7d8a321633b3d1ab1651eeb258ad898ebcef1d348b54148f18e15da82581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d581cf699c6400f85bdca54e44d0cad1f6141ce049a411c0d695fc30c3f7384840019029af650004706260000004700000000111100008301f676616464726573732e76616375756d6c6162732e636f6d8202781e616e6f746865722e616464726573732e76616375756d6c6162732e636f6d840019ffff447f0000fff682782468747470733a2f2f706f6f6c2d6d657461646174612e76616375756d6c6162732e636f6d5820e318d62e3d5cc3cc23ca1123438e439d7aac6c6c423320f670d159726ac9d11f8304581c4dfbc0559b2e1d6af62c447f0a0d6290a8b05e075ef08db38c1b81a81a0001dfbe',
    txBody: {
      inputs: {
        items: [
          {
            transactionId: toFixLenBuffer(
              'b64ae44e1195b04663ab863b62337e626c65b0c9855a9fbb9ef4458f81a6f5ee',
              32,
            ),
            index: toUint(42),
          },
        ],
        hasTag: false,
      } as CddlSet<TransactionInput>,
      outputs: [
        {
          format: TxOutputFormat.ARRAY_LEGACY,
          address: fromBech32(
            'addr1qxdn4yany8lc6ewkmuwxmpza2ndm7t9ngyzlmdzwecdh6vfvqjwlak9ug8k7lw7gxh9q5uuu4jtp24u4qf3w7j9uluwssp092m',
          ),
          amount: {
            type: AmountType.WITHOUT_MULTIASSET,
            coin: toUint(1),
          },
          datumHash: undefined,
        },
      ],
      fee: toUint(1244241),
      ttl: undefined,
      certificates: {
        items: [
          {
            type: CertificateType.STAKE_REGISTRATION,
            stakeCredential: {
              type: CredentialType.KEY_HASH,
              keyHash: toFixLenBuffer(
                '2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d',
                28,
              ),
            },
          },
          {
            type: CertificateType.STAKE_DEREGISTRATION,
            stakeCredential: {
              type: CredentialType.SCRIPT_HASH,
              scriptHash: toFixLenBuffer(
                'c1d58a7602c3bd8104cd2a871a2d1cb68f6f6669bd37a7688618ee55',
                28,
              ),
            },
          },
          {
            type: CertificateType.STAKE_DELEGATION,
            stakeCredential: {
              type: CredentialType.KEY_HASH,
              keyHash: toFixLenBuffer(
                '2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d',
                28,
              ),
            },
            poolKeyHash: toFixLenBuffer(
              '001337292eec9b3eefc6802f71cb34c21a7963eb12466d52836aa390',
              28,
            ),
          },
          {
            type: CertificateType.POOL_REGISTRATION,
            poolParams: {
              operator: toFixLenBuffer(
                '4DFBC0559B2E1D6AF62C447F0A0D6290A8B05E075EF08DB38C1B81A8',
                28,
              ),
              vrfKeyHash: toFixLenBuffer(
                '67C5C0B45DB55E8C82752263207B9A92C2D5FA6C671ACEED9DF451CAD3FAC7A3',
                32,
              ),
              pledge: toUint(123456),
              cost: toUint(100000000),
              margin: [toUint(3), toUint(25)],
              rewardAccount: rewardAccount(
                'stake1u8ta3gepvvan6x43v50wkfv2mzvwhnh36dyt2s2g7x8ptks528lzm',
              ),
              poolOwners: {
                items: [
                  toFixLenBuffer(
                    '2C049DFED8BC41EDEFBBC835CA0A739CAC961557950262EF48BCFF1D',
                    28,
                  ),
                  toFixLenBuffer(
                    'F699C6400F85BDCA54E44D0CAD1F6141CE049A411C0D695FC30C3F73',
                    28,
                  ),
                ],
                hasTag: false,
              } as CddlSet<KeyHash>,
              relays: [
                {
                  type: RelayType.SINGLE_HOST_ADDRESS,
                  port: 666 as Port,
                  ipv4: null,
                  ipv6: toFixLenBuffer('00470626000000470000000011110000', 16),
                },
                {
                  type: RelayType.SINGLE_HOST_NAME,
                  port: null,
                  dnsName: toMaxLenString(
                    'address.vacuumlabs.com',
                    DNS_NAME_MAX_LENGTH,
                  ),
                },
                {
                  type: RelayType.MULTI_HOST_NAME,
                  dnsName: toMaxLenString(
                    'another.address.vacuumlabs.com',
                    DNS_NAME_MAX_LENGTH,
                  ),
                },
                {
                  type: RelayType.SINGLE_HOST_ADDRESS,
                  port: 65535 as Port,
                  ipv4: ipv4ToBuffer('127.0.0.255'),
                  ipv6: null,
                },
              ],
              poolMetadata: {
                url: toMaxLenString(
                  'https://pool-metadata.vacuumlabs.com',
                  URL_MAX_LENGTH,
                ),
                metadataHash: toFixLenBuffer(
                  'E318D62E3D5CC3CC23CA1123438E439D7AAC6C6C423320F670D159726AC9D11F',
                  32,
                ),
              },
            },
          },
          {
            type: CertificateType.POOL_RETIREMENT,
            poolKeyHash: toFixLenBuffer(
              '4dfbc0559b2e1d6af62c447f0a0d6290a8b05e075ef08db38c1b81a8',
              28,
            ),
            epoch: toUint(122814),
          },
        ],
        hasTag: false,
      } as CddlNonEmptyOrderedSet<Certificate>,
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
  },
  {
    testName:
      'Tx body with output datum hash, script data hash, collateral inputs, required signers and network id',
    cbor: 'a800818258203b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b700018283583d105e2f080eb93bad86d401545e0ce5f2221096d6477e11e6643922fa8d2ed495234dc0d667c1316ff84e572310e265edb31330448b36b7179e28dd419e1a006ca7935820ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce18883583930167f6dbf610ae030f043adb1f3af78754ed9595ad4ac1f7ed9ff6466760fb6955d1217b1f1f208df6d45ab23c9e17b0c984a2d3a22bbbfb8821a0001e91fa1581cd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2a146546f6b656e3101582000ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce102182a030a0b5820ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce1880d818258203b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7000e82581cfea6646c67fb467f8a5425e9c752e1e262b0420ba4b638f39514049a581ceea6646c67fb467f8a5425e9c752e1e262b0420ba4b638f39514049a0f01',
    txBody: {
      inputs: {
        items: [
          {
            transactionId: toFixLenBuffer(
              '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
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
            'addr_test1zp0z7zqwhya6mpk5q929ur897g3pp9kkgalpreny8y304rfw6j2jxnwq6enuzvt0lp89wgcsufj7mvcnxpzgkd4hz70z3h2pnc8lhq8r',
          ),
          amount: {
            type: AmountType.WITHOUT_MULTIASSET,
            coin: toUint(7120787),
          },
          datumHash: {
            type: DatumType.HASH,
            hash: toFixLenBuffer(
              'ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce188',
              32,
            ),
          },
        },
        {
          format: TxOutputFormat.ARRAY_LEGACY,
          address: fromBech32(
            'addr_test1xqt87mdlvy9wqv8sgwkmrua00p65ak2ett22c8m7m8lkgenkp7mf2hgjz7clrusgmak5t2ere8shkrycfgkn5g4mh7uqvcq039',
          ),
          amount: {
            type: AmountType.WITH_MULTIASSET,
            coin: toUint(125215),
            multiasset: [
              {
                policyId: toFixLenBuffer(
                  'd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2',
                  28,
                ),
                tokens: [
                  {
                    assetName: Buffer.from('Token1') as MaxLenBuffer<32>,
                    amount: toUint(1),
                  },
                ],
              },
            ],
          },
          datumHash: {
            type: DatumType.HASH,
            hash: toFixLenBuffer(
              '00ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce1',
              32,
            ),
          },
        },
      ],
      fee: toUint(42),
      ttl: toUint(10),
      certificates: undefined,
      withdrawals: undefined,
      update: undefined,
      auxiliaryDataHash: undefined,
      validityIntervalStart: undefined,
      mint: undefined,
      scriptDataHash: toFixLenBuffer(
        'ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce188',
        32,
      ),
      collateralInputs: {
        items: [
          {
            transactionId: toFixLenBuffer(
              '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
              32,
            ),
            index: toUint(0),
          },
        ],
        hasTag: false,
      } as CddlNonEmptySet<TransactionInput>,
      requiredSigners: {
        items: [
          toFixLenBuffer(
            'fea6646c67fb467f8a5425e9c752e1e262b0420ba4b638f39514049a',
            28,
          ),
          toFixLenBuffer(
            'eea6646c67fb467f8a5425e9c752e1e262b0420ba4b638f39514049a',
            28,
          ),
        ],
        hasTag: false,
      } as CddlNonEmptySet<RequiredSigner>,
      networkId: toUint(1),
      collateralReturnOutput: undefined,
      totalCollateral: undefined,
      referenceInputs: undefined,
      votingProcedures: undefined,
      proposalProcedures: undefined,
      treasury: undefined,
      donation: undefined,
    },
  },
  {
    testName:
      'Tx body with inline datum, reference script, collateral return, total collateral and reference input',
    cbor: 'a8008182582094461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d000181a4005839008b3303988371208dd0916cc4548c4eafc2fd3d6205ea8ec180c1b1d9e0820d5929d99bce8aa81e86195fd2b824e6550820a03af325f6ff220100028201d81841a003d8185846820158425840010000332233322222253353004333573466ebc00c00801801440204c98d4c01ccd5ce2481094e6f7420457175616c000084984880084880048004480048004102000b5820853cbe68f7fccdeeeb0fd7b711ea147912190c35ac52d9d94080ae82809b2f840d8182582094461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d0110a2005839008b3303988371208dd0916cc4548c4eafc2fd3d6205ea8ec180c1b1d9e0820d5929d99bce8aa81e86195fd2b824e6550820a03af325f6ff220100110a128182582094461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d02',
    txBody: {
      inputs: {
        items: [
          {
            transactionId: toFixLenBuffer(
              '94461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d',
              32,
            ),
            index: toUint(0),
          },
        ],
        hasTag: false,
      } as CddlSet<TransactionInput>,
      outputs: [
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
      fee: toUint(0),
      ttl: undefined,
      certificates: undefined,
      withdrawals: undefined,
      update: undefined,
      auxiliaryDataHash: undefined,
      validityIntervalStart: undefined,
      mint: undefined,
      scriptDataHash: toFixLenBuffer(
        '853cbe68f7fccdeeeb0fd7b711ea147912190c35ac52d9d94080ae82809b2f84',
        32,
      ),
      collateralInputs: {
        items: [
          {
            transactionId: toFixLenBuffer(
              '94461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d',
              32,
            ),
            index: toUint(1),
          },
        ],
        hasTag: false,
      } as CddlNonEmptySet<TransactionInput>,
      requiredSigners: undefined,
      networkId: undefined,
      collateralReturnOutput: {
        format: TxOutputFormat.MAP_BABBAGE,
        address: fromBech32(
          'addr_test1qz9nxqucsdcjprwsj9kvg4yvf6hu9lfavgz74rkpsrqmrk0qsgx4j2wen08g42q7scv4l54cynn92zpq5qa0xf0klu3qe9xkhw',
        ),
        amount: {
          type: AmountType.WITHOUT_MULTIASSET,
          coin: toUint(0),
        },
        datum: undefined,
        referenceScript: undefined,
      },
      totalCollateral: toUint(10),
      referenceInputs: {
        items: [
          {
            transactionId: toFixLenBuffer(
              '94461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d',
              32,
            ),
            index: toUint(2),
          },
        ],
        hasTag: false,
      } as CddlNonEmptySet<TransactionInput>,
      votingProcedures: undefined,
      proposalProcedures: undefined,
      treasury: undefined,
      donation: undefined,
    },
  },
  {
    // https://auspicious-fuchsia-2e9.notion.site/Transactions-in-SanchoNet-fbcf91c799404fe4b30a78e8e091df79#2fb761e130db4cc9954772cdf72d18e7
    testName: 'Conway tx body: voting procedures',
    cbor: 'a400818258204547c077e8f3a9184438e36503f78b634eb416658c336c2d017d9912a7c493c7000181a20058390013ca2480e9651a5c504b36eda271ec171cdd404cfe349097524a48bd8bee57ce33c7c1f711bc5801986d89dd68078f5922b83812cc86f65f011b0000000253d3ae64021a0002a38913a18202581c1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8a1825820787142668a73c7c3ca6003571f429393f2d6dad8886bbcd0a9ba7aca07cc895e008201f6',
    txBody: {
      inputs: {
        items: [
          {
            transactionId: toFixLenBuffer(
              '4547c077e8f3a9184438e36503f78b634eb416658c336c2d017d9912a7c493c7',
              32,
            ),
            index: toUint(0),
          },
        ],
        hasTag: false,
      } as CddlSet<TransactionInput>,
      outputs: [
        {
          format: TxOutputFormat.MAP_BABBAGE,
          address: toFixLenBuffer(
            '0013ca2480e9651a5c504b36eda271ec171cdd404cfe349097524a48bd8bee57ce33c7c1f711bc5801986d89dd68078f5922b83812cc86f65f',
            57,
          ),
          amount: {
            type: AmountType.WITHOUT_MULTIASSET,
            coin: toUint(9996316260),
          },
          datum: undefined,
          referenceScript: undefined,
        },
      ],
      fee: toUint(172937),
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
      votingProcedures: [
        {
          voter: {
            type: VoterType.DREP_KEY,
            hash: toFixLenBuffer(
              '1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8',
              28,
            ),
          },
          votes: [
            {
              govActionId: {
                transactionId: toFixLenBuffer(
                  '787142668a73c7c3ca6003571f429393f2d6dad8886bbcd0a9ba7aca07cc895e',
                  32,
                ),
                index: toUint(0),
              },
              votingProcedure: {
                voteOption: VoteOption.YES,
                anchor: null,
              },
            },
          ],
        },
      ],
      proposalProcedures: undefined,
      treasury: undefined,
      donation: undefined,
    },
  },
  {
    // https://auspicious-fuchsia-2e9.notion.site/Transactions-in-SanchoNet-fbcf91c799404fe4b30a78e8e091df79#a5ef58aa46e84d2f96d0b14f906e0417
    testName: 'Conway tx body: proposal procedures',
    cbor: 'a40081825820017b91576a79a3602a02a65b600665ab71037ad14aa162538a26e64b3f5069fc000181a2005839002d745f050a8f7e263f4d0749a82284ed9cc065018c1f4f6a7c1b764882293a49e3ef29a4f9c32e4c18f202f5324182db7790f48dccf7a6dd011b0000000253d1efbc021a0002b3b11481841a000f4240581de082293a49e3ef29a4f9c32e4c18f202f5324182db7790f48dccf7a6dd8305f68282781968747470733a2f2f73686f727475726c2e61742f6173494a365820ee90ece16c47bf812b88edb89a01539e6683d6549a80b15383a4fb218ab9412df682781968747470733a2f2f73686f727475726c2e61742f784d53313558206f890de0c6e418e6526e2b1aa821850cb87aee94a6d77dc2a2e440116abc8e09',
    txBody: {
      inputs: {
        items: [
          {
            transactionId: toFixLenBuffer(
              '017b91576a79a3602a02a65b600665ab71037ad14aa162538a26e64b3f5069fc',
              32,
            ),
            index: toUint(0),
          },
        ],
        hasTag: false,
      } as CddlSet<TransactionInput>,
      outputs: [
        {
          format: TxOutputFormat.MAP_BABBAGE,
          address: toFixLenBuffer(
            '002d745f050a8f7e263f4d0749a82284ed9cc065018c1f4f6a7c1b764882293a49e3ef29a4f9c32e4c18f202f5324182db7790f48dccf7a6dd',
            57,
          ),
          amount: {
            type: AmountType.WITHOUT_MULTIASSET,
            coin: toUint(9996201916),
          },
          datum: undefined,
          referenceScript: undefined,
        },
      ],
      fee: toUint(177073),
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
      proposalProcedures: {
        items: [
          {
            deposit: toUint(1000000),
            rewardAccount: toFixLenBuffer(
              'e082293a49e3ef29a4f9c32e4c18f202f5324182db7790f48dccf7a6dd',
              29,
            ),
            govAction: [
              5,
              null,
              [
                // constitution
                [
                  'https://shorturl.at/asIJ6',
                  toFixLenBuffer(
                    'ee90ece16c47bf812b88edb89a01539e6683d6549a80b15383a4fb218ab9412d',
                    32,
                  ),
                ],
                null,
              ],
            ],
            anchor: {
              url: toMaxLenString('https://shorturl.at/xMS15', URL_MAX_LENGTH),
              dataHash: toFixLenBuffer(
                '6f890de0c6e418e6526e2b1aa821850cb87aee94a6d77dc2a2e440116abc8e09',
                32,
              ),
            },
          },
        ],
        hasTag: false,
      } as CddlNonEmptyOrderedSet<ProposalProcedure>,
      treasury: undefined,
      donation: undefined,
    },
  },
  {
    // generated via https://ryun1.github.io/cip95-cardano-wallet-connector/ + NuFi by adding all the certs supported by the dApp
    testName: 'Conway tx body: certificates',
    cbor: 'a400818258205a70b318d72eb106568e6e9413e7d72573ef018307d189a92a6aea50ef779ee5010182825839006adb0971e4054c0da7ec23a0c276521f1cd8cecf1b15ad4822119cd186dcecee2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d1011a000f4240825839006adb0971e4054c0da7ec23a0c276521f1cd8cecf1b15ad4822119cd186dcecee2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d1011b0000000163d178ed021a00031f1d048883098200581c86dcecee2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d1018200581c7293814591e7543561361bafe399d9b5012d537c46cf70fa5e4faa9f84108200581c7293814591e7543561361bafe399d9b5012d537c46cf70fa5e4faa9f1a001e8480827268747470733a2f2f676f6f676c652e636f6d5820339ec66289039dbf9fa803be62b2b4f294b51adb719d7feef3f35619b3aee73e83128200581c7293814591e7543561361bafe399d9b5012d537c46cf70fa5e4faa9f827168747470733a2f2f7961686f6f2e636f6d5820a248769f4e4f23a2984548e7ee53cbe00c0596b54206bdac1023d485138a3e0783118200581c7293814591e7543561361bafe399d9b5012d537c46cf70fa5e4faa9f1a001e8480840a8200581c86dcecee2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d101581cdeadbeef2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d1018200581c7293814591e7543561361bafe399d9b5012d537c46cf70fa5e4faa9f840b8200581c86dcecee2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d101581cdeadbeef2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d1011a001e8480840c8200581c86dcecee2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d1018200581c7293814591e7543561361bafe399d9b5012d537c46cf70fa5e4faa9f1a001e8480850d8200581c86dcecee2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d101581cdeadbeef2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d1018200581c7293814591e7543561361bafe399d9b5012d537c46cf70fa5e4faa9f1a001e8480',
    txBody: {
      inputs: {
        items: [
          {
            transactionId: toFixLenBuffer(
              '5a70b318d72eb106568e6e9413e7d72573ef018307d189a92a6aea50ef779ee5',
              32,
            ),
            index: toUint(1),
          },
        ],
        hasTag: false,
      } as CddlSet<TransactionInput>,
      outputs: [
        {
          format: TxOutputFormat.ARRAY_LEGACY,
          address: toFixLenBuffer(
            '006adb0971e4054c0da7ec23a0c276521f1cd8cecf1b15ad4822119cd186dcecee2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d101',
            57,
          ),
          amount: {
            type: AmountType.WITHOUT_MULTIASSET,
            coin: toUint(1000000),
          },
          datumHash: undefined,
        },
        {
          format: TxOutputFormat.ARRAY_LEGACY,
          address: toFixLenBuffer(
            '006adb0971e4054c0da7ec23a0c276521f1cd8cecf1b15ad4822119cd186dcecee2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d101',
            57,
          ),
          amount: {
            type: AmountType.WITHOUT_MULTIASSET,
            coin: toUint(5969639661),
          },
          datumHash: undefined,
        },
      ],
      fee: toUint(204573),
      ttl: undefined,
      certificates: {
        items: [
          {
            type: CertificateType.VOTE_DELEGATION,
            stakeCredential: {
              type: CredentialType.KEY_HASH,
              keyHash: toFixLenBuffer(
                '86dcecee2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d101',
                28,
              ),
            },
            dRep: {
              type: DRepType.KEY_HASH,
              keyHash: toFixLenBuffer(
                '7293814591e7543561361bafe399d9b5012d537c46cf70fa5e4faa9f',
                28,
              ),
            },
          },
          {
            type: CertificateType.DREP_REGISTRATION,
            dRepCredential: {
              type: CredentialType.KEY_HASH,
              keyHash: toFixLenBuffer(
                '7293814591e7543561361bafe399d9b5012d537c46cf70fa5e4faa9f',
                28,
              ),
            },
            deposit: toUint(2000000),
            anchor: {
              url: toMaxLenString('https://google.com', URL_MAX_LENGTH),
              dataHash: toFixLenBuffer(
                '339ec66289039dbf9fa803be62b2b4f294b51adb719d7feef3f35619b3aee73e',
                32,
              ),
            },
          },
          {
            type: CertificateType.DREP_UPDATE,
            dRepCredential: {
              type: CredentialType.KEY_HASH,
              keyHash: toFixLenBuffer(
                '7293814591e7543561361bafe399d9b5012d537c46cf70fa5e4faa9f',
                28,
              ),
            },
            anchor: {
              url: toMaxLenString('https://yahoo.com', URL_MAX_LENGTH),
              dataHash: toFixLenBuffer(
                'a248769f4e4f23a2984548e7ee53cbe00c0596b54206bdac1023d485138a3e07',
                32,
              ),
            },
          },
          {
            type: CertificateType.DREP_DEREGISTRATION,
            dRepCredential: {
              type: CredentialType.KEY_HASH,
              keyHash: toFixLenBuffer(
                '7293814591e7543561361bafe399d9b5012d537c46cf70fa5e4faa9f',
                28,
              ),
            },
            deposit: toUint(2000000),
          },
          {
            type: CertificateType.STAKE_AND_VOTE_DELEGATION,
            stakeCredential: {
              type: CredentialType.KEY_HASH,
              keyHash: toFixLenBuffer(
                '86dcecee2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d101',
                28,
              ),
            },
            poolKeyHash: toFixLenBuffer(
              'deadbeef2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d101',
              28,
            ),
            dRep: {
              type: DRepType.KEY_HASH,
              keyHash: toFixLenBuffer(
                '7293814591e7543561361bafe399d9b5012d537c46cf70fa5e4faa9f',
                28,
              ),
            },
          },
          {
            type: CertificateType.STAKE_REGISTRATION_AND_DELEGATION,
            stakeCredential: {
              type: CredentialType.KEY_HASH,
              keyHash: toFixLenBuffer(
                '86dcecee2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d101',
                28,
              ),
            },
            poolKeyHash: toFixLenBuffer(
              'deadbeef2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d101',
              28,
            ),
            deposit: toUint(2000000),
          },
          {
            type: CertificateType.STAKE_REGISTRATION_WITH_VOTE_DELEGATION,
            stakeCredential: {
              type: CredentialType.KEY_HASH,
              keyHash: toFixLenBuffer(
                '86dcecee2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d101',
                28,
              ),
            },
            dRep: {
              type: DRepType.KEY_HASH,
              keyHash: toFixLenBuffer(
                '7293814591e7543561361bafe399d9b5012d537c46cf70fa5e4faa9f',
                28,
              ),
            },
            deposit: toUint(2000000),
          },
          {
            type: CertificateType.STAKE_REGISTRATION_WITH_STAKE_AND_VOTE_DELEGATION,
            stakeCredential: {
              type: CredentialType.KEY_HASH,
              keyHash: toFixLenBuffer(
                '86dcecee2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d101',
                28,
              ),
            },
            poolKeyHash: toFixLenBuffer(
              'deadbeef2ca5017ed3a8bef8386f4ea19411872975818b6c8e40d101',
              28,
            ),
            dRep: {
              type: DRepType.KEY_HASH,
              keyHash: toFixLenBuffer(
                '7293814591e7543561361bafe399d9b5012d537c46cf70fa5e4faa9f',
                28,
              ),
            },
            deposit: toUint(2000000),
          },
        ],
        hasTag: false,
      } as CddlNonEmptyOrderedSet<Certificate>,
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
  },
]

type TransformTransactionBodyTestCase = {
  testName: string
  cbor: string
  validationErrors: ValidationError[]
  auxiliaryData?: unknown
  txBody: TransactionBody
}

export const TransformTransactionTestCases: TransformTransactionBodyTestCase[] =
  [
    {
      testName: 'Simple tx body with canonical auxiliary data',
      cbor: 'a50081825820bc8bf52ea894fb8e442fe3eea628be87d0c9a37baef185b70eb00a5c8a849d3b000181825839000743d16cfe3c4fcc0c11c2403bbc10dbc7ecdd4477e053481a368e7a06e2ae44dff6770dc0f4ada3cf4cf2605008e27aecdb332ad349fda71a0023583c021a00029b75031a01a3bd8f075820fb7099a47afd6efb4f9cccf9d0f8745331a19eb8b3f50548ffadae9de8551743',
      validationErrors: [],
      auxiliaryData: CanonicalAuxiliaryData.data,
      txBody: {
        inputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                'bc8bf52ea894fb8e442fe3eea628be87d0c9a37baef185b70eb00a5c8a849d3b',
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
              coin: toUint(2316348),
            },
            datumHash: undefined,
          },
        ],
        fee: toUint(170869),
        ttl: toUint(27508111),
        certificates: undefined,
        withdrawals: undefined,
        update: undefined,
        auxiliaryDataHash: CanonicalAuxiliaryData.hash,
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
    },
    {
      testName: 'Simple tx body with non canonical auxiliary data',
      cbor: 'a50081825820bc8bf52ea894fb8e442fe3eea628be87d0c9a37baef185b70eb00a5c8a849d3b000181825839000743d16cfe3c4fcc0c11c2403bbc10dbc7ecdd4477e053481a368e7a06e2ae44dff6770dc0f4ada3cf4cf2605008e27aecdb332ad349fda71a0023583c021a00029b75031a01a3bd8f075820fb7099a47afd6efb4f9cccf9d0f8745331a19eb8b3f50548ffadae9de8551743',
      validationErrors: [],
      auxiliaryData: NonCanonicalAuxiliaryData.data,
      txBody: {
        inputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                'bc8bf52ea894fb8e442fe3eea628be87d0c9a37baef185b70eb00a5c8a849d3b',
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
              coin: toUint(2316348),
            },
            datumHash: undefined,
          },
        ],
        fee: toUint(170869),
        ttl: toUint(27508111),
        certificates: undefined,
        withdrawals: undefined,
        update: undefined,
        auxiliaryDataHash: NonCanonicalAuxiliaryData.transformedHash,
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
    },
    {
      testName: 'Simple tx body with auxiliary data hash but no auxiliary data',
      cbor: 'a50081825820bc8bf52ea894fb8e442fe3eea628be87d0c9a37baef185b70eb00a5c8a849d3b000181825839000743d16cfe3c4fcc0c11c2403bbc10dbc7ecdd4477e053481a368e7a06e2ae44dff6770dc0f4ada3cf4cf2605008e27aecdb332ad349fda71a0023583c021a00029b75031a01a3bd8f075820fb7099a47afd6efb4f9cccf9d0f8745331a19eb8b3f50548ffadae9de8551743',
      validationErrors: [],
      auxiliaryData: null,
      txBody: {
        inputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                'bc8bf52ea894fb8e442fe3eea628be87d0c9a37baef185b70eb00a5c8a849d3b',
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
              coin: toUint(2316348),
            },
            datumHash: undefined,
          },
        ],
        fee: toUint(170869),
        ttl: toUint(27508111),
        certificates: undefined,
        withdrawals: undefined,
        update: undefined,
        auxiliaryDataHash: toFixLenBuffer(
          'fb7099a47afd6efb4f9cccf9d0f8745331a19eb8b3f50548ffadae9de8551743',
          32,
        ),
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
    },
    {
      testName:
        'Tx body with tag 258 in collateral inputs and required signers, but not inputs',
      cbor: 'a800818258203b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b700018283583d105e2f080eb93bad86d401545e0ce5f2221096d6477e11e6643922fa8d2ed495234dc0d667c1316ff84e572310e265edb31330448b36b7179e28dd419e1a006ca7935820ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce18883583930167f6dbf610ae030f043adb1f3af78754ed9595ad4ac1f7ed9ff6466760fb6955d1217b1f1f208df6d45ab23c9e17b0c984a2d3a22bbbfb8821a0001e91fa1581cd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2a146546f6b656e3101582000ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce102182a030a0b5820ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce1880dd90102818258203b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7000ed9010282581cfea6646c67fb467f8a5425e9c752e1e262b0420ba4b638f39514049a581ceea6646c67fb467f8a5425e9c752e1e262b0420ba4b638f39514049a0f01',
      validationErrors: [
        {
          fixable: true,
          reason: ValidationErrorReason.TX_INCONSISTENT_SET_TAGS,
          position: 'transaction_body',
        },
      ],
      txBody: {
        inputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
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
            address: fromBech32(
              'addr_test1zp0z7zqwhya6mpk5q929ur897g3pp9kkgalpreny8y304rfw6j2jxnwq6enuzvt0lp89wgcsufj7mvcnxpzgkd4hz70z3h2pnc8lhq8r',
            ),
            amount: {
              type: AmountType.WITHOUT_MULTIASSET,
              coin: toUint(7120787),
            },
            datumHash: {
              type: DatumType.HASH,
              hash: toFixLenBuffer(
                'ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce188',
                32,
              ),
            },
          },
          {
            format: TxOutputFormat.ARRAY_LEGACY,
            address: fromBech32(
              'addr_test1xqt87mdlvy9wqv8sgwkmrua00p65ak2ett22c8m7m8lkgenkp7mf2hgjz7clrusgmak5t2ere8shkrycfgkn5g4mh7uqvcq039',
            ),
            amount: {
              type: AmountType.WITH_MULTIASSET,
              coin: toUint(125215),
              multiasset: [
                {
                  policyId: toFixLenBuffer(
                    'd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2',
                    28,
                  ),
                  tokens: [
                    {
                      assetName: Buffer.from('Token1') as MaxLenBuffer<32>,
                      amount: toUint(1),
                    },
                  ],
                },
              ],
            },
            datumHash: {
              type: DatumType.HASH,
              hash: toFixLenBuffer(
                '00ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce1',
                32,
              ),
            },
          },
        ],
        fee: toUint(42),
        ttl: toUint(10),
        certificates: undefined,
        withdrawals: undefined,
        update: undefined,
        auxiliaryDataHash: undefined,
        validityIntervalStart: undefined,
        mint: undefined,
        scriptDataHash: toFixLenBuffer(
          'ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce188',
          32,
        ),
        collateralInputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
                32,
              ),
              index: toUint(0),
            },
          ],
          hasTag: true,
        } as CddlNonEmptySet<TransactionInput>,
        requiredSigners: {
          items: [
            toFixLenBuffer(
              'fea6646c67fb467f8a5425e9c752e1e262b0420ba4b638f39514049a',
              28,
            ),
            toFixLenBuffer(
              'eea6646c67fb467f8a5425e9c752e1e262b0420ba4b638f39514049a',
              28,
            ),
          ],
          hasTag: true,
        } as CddlNonEmptySet<RequiredSigner>,
        networkId: toUint(1),
        collateralReturnOutput: undefined,
        totalCollateral: undefined,
        referenceInputs: undefined,
        votingProcedures: undefined,
        proposalProcedures: undefined,
        treasury: undefined,
        donation: undefined,
      },
    },
  ]

type ValidTransactionTestCase = {
  testName: string
  cbor: string
  tx: Transaction
}

export const ValidTransactionTestCases: ValidTransactionTestCase[] = [
  {
    testName: 'Simple tx',
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
  {
    testName: 'Simple tx with multisig witnesses and auxiliaryData',
    cbor: '83a3008282582014461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d0082582094461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d00018182583931550d0f8b591480fe57e832ab99d6c2fc387c8f417ab09399cb74b5e1f8ecfa2654cfe1dd931439db45e43f5d1a73129dcb7e4acc736c766a000200a20081825820abd0f26723a5de57c10eb483b14c0aec1c365d911d46ab38684c2b9b2fa4a4915840f2b04185587ed5af88cac6778b0a8392f1cd4d51e6c3722d96db62cae9d716f2d71a22aac6bde7ec097e1357b9e2ffa70eb9ab5d757d24180c843593fb302f0901828201828200581cc4b9265645fde9536c0795adbcc5291767a0c61fd62448341d7e03868200581ce01b7ece78d656ad5848362ded335254167378c1723cd94df336a6308200581c7ed7fe51d02aede226df3912f4f347bf9598138091801119a3dc7a1f82a11904d2a163666f6f6362617280',
    tx: {
      body: {
        inputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                '14461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d',
                32,
              ),
              index: toUint(0),
            },
            {
              transactionId: toFixLenBuffer(
                '94461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d',
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
              'addr1x92s6rutty2gpljhaqe2hxwkct7rsly0g9atpyueed6ttc0canazv4x0u8wex9pemdz7g06arfe398wt0e9vcumvwe4qx4ar6m',
            ),
            amount: {
              type: AmountType.WITHOUT_MULTIASSET,
              coin: toUint(0),
            },
            datumHash: undefined,
          },
        ],
        fee: toUint(0),
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
        [
          1,
          [
            [
              1,
              [
                [
                  0,
                  toFixLenBuffer(
                    'c4b9265645fde9536c0795adbcc5291767a0c61fd62448341d7e0386',
                    28,
                  ),
                ],
                [
                  0,
                  toFixLenBuffer(
                    'e01b7ece78d656ad5848362ded335254167378c1723cd94df336a630',
                    28,
                  ),
                ],
              ],
            ],
            [
              0,
              toFixLenBuffer(
                '7ed7fe51d02aede226df3912f4f347bf9598138091801119a3dc7a1f',
                28,
              ),
            ],
          ],
        ],
      ]),
      auxiliaryData: [new Map([[1234, {foo: 'bar'}]]), []],
    },
  },
  {
    /*
      cardano-cli transaction build-raw \
          --alonzo-era \
          --tx-in "94461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d#0" \
          --tx-in-script-file payment.script \
          --tx-in "94461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d#1" \
          --tx-in-script-file stake.script \
          --tx-in "94461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d#2" \
          --tx-in-script-file datum-equals-redeemer.plutus \
          --tx-in-datum-value '"chocolate"' \
          --tx-in-redeemer-value '"chocolate"' \
          --tx-in-execution-units "(1000000000, 2000000)" \
          --tx-in-collateral "94461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d#3" \
          --tx-out "$(cat payment.addr)"+0 \
          --fee 0 \
          --protocol-params-file protocol.json \
          --out-file tx-plutus.draft
          --cddl-format
    */
    testName: 'Simple tx with alonzo-era tx items',
    cbor: '84a5008382582094461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d0082582094461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d0182582094461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d02018182583931550d0f8b591480fe57e832ab99d6c2fc387c8f417ab09399cb74b5e1f8ecfa2654cfe1dd931439db45e43f5d1a73129dcb7e4acc736c766a0002000b58202d1c584b45751ab66d924c4a47f7fe7ea5831e0b485f8d9d290e69eb809c013b0d8182582094461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d03a50081825820abd0f26723a5de57c10eb483b14c0aec1c365d911d46ab38684c2b9b2fa4a4915840f2b04185587ed5af88cac6778b0a8392f1cd4d51e6c3722d96db62cae9d716f2d71a22aac6bde7ec097e1357b9e2ffa70eb9ab5d757d24180c843593fb302f0901828201828200581cc4b9265645fde9536c0795adbcc5291767a0c61fd62448341d7e03868200581ce01b7ece78d656ad5848362ded335254167378c1723cd94df336a6308200581c7ed7fe51d02aede226df3912f4f347bf9598138091801119a3dc7a1f038158425840010000332233322222253353004333573466ebc00c00801801440204c98d4c01ccd5ce2481094e6f7420457175616c000084984880084880048004480048004104814963686f636f6c61746505818400024963686f636f6c617465821a001e84801a3b9aca00f5f6',
    tx: {
      body: {
        inputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                '94461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d',
                32,
              ),
              index: toUint(0),
            },
            {
              transactionId: toFixLenBuffer(
                '94461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d',
                32,
              ),
              index: toUint(1),
            },
            {
              transactionId: toFixLenBuffer(
                '94461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d',
                32,
              ),
              index: toUint(2),
            },
          ],
          hasTag: false,
        } as CddlSet<TransactionInput>,
        outputs: [
          {
            format: TxOutputFormat.ARRAY_LEGACY,
            address: fromBech32(
              'addr1x92s6rutty2gpljhaqe2hxwkct7rsly0g9atpyueed6ttc0canazv4x0u8wex9pemdz7g06arfe398wt0e9vcumvwe4qx4ar6m',
            ),
            amount: {
              type: AmountType.WITHOUT_MULTIASSET,
              coin: toUint(0),
            },
            datumHash: undefined,
          },
        ],
        fee: toUint(0),
        ttl: undefined,
        certificates: undefined,
        withdrawals: undefined,
        update: undefined,
        auxiliaryDataHash: undefined,
        validityIntervalStart: undefined,
        mint: undefined,
        scriptDataHash: toFixLenBuffer(
          '2d1c584b45751ab66d924c4a47f7fe7ea5831e0b485f8d9d290e69eb809c013b',
          32,
        ),
        collateralInputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                '94461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d',
                32,
              ),
              index: toUint(3),
            },
          ],
          hasTag: false,
        } as CddlNonEmptySet<TransactionInput>,
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
        [
          1,
          [
            [
              1,
              [
                [
                  0,
                  toFixLenBuffer(
                    'c4b9265645fde9536c0795adbcc5291767a0c61fd62448341d7e0386',
                    28,
                  ),
                ],
                [
                  0,
                  toFixLenBuffer(
                    'e01b7ece78d656ad5848362ded335254167378c1723cd94df336a630',
                    28,
                  ),
                ],
              ],
            ],
            [
              0,
              toFixLenBuffer(
                '7ed7fe51d02aede226df3912f4f347bf9598138091801119a3dc7a1f',
                28,
              ),
            ],
          ],
        ],
        [
          3,
          [
            Buffer.from(
              '5840010000332233322222253353004333573466ebc00c00801801440204c98d4c01ccd5ce2481094e6f7420457175616c0000849848800848800480044800480041',
              'hex',
            ),
          ],
        ],
        [4, [Buffer.from('63686f636f6c617465', 'hex')]],
        [
          5,
          [
            [
              0,
              2,
              Buffer.from('63686f636f6c617465', 'hex'),
              [2000000, 1000000000],
            ],
          ],
        ],
      ]),
      scriptValidity: true,
      auxiliaryData: null,
    },
  },
  {
    testName:
      'Tx with tag 258 in collateral inputs and required signers, but not inputs',
    cbor: '84a800818258203b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b700018283583d105e2f080eb93bad86d401545e0ce5f2221096d6477e11e6643922fa8d2ed495234dc0d667c1316ff84e572310e265edb31330448b36b7179e28dd419e1a006ca7935820ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce18883583930167f6dbf610ae030f043adb1f3af78754ed9595ad4ac1f7ed9ff6466760fb6955d1217b1f1f208df6d45ab23c9e17b0c984a2d3a22bbbfb8821a0001e91fa1581cd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2a146546f6b656e3101582000ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce102182a030a0b5820ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce1880dd90102818258203b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7000ed9010282581cfea6646c67fb467f8a5425e9c752e1e262b0420ba4b638f39514049a581ceea6646c67fb467f8a5425e9c752e1e262b0420ba4b638f39514049a0f01a0f5f6',
    tx: {
      body: {
        inputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
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
              'addr_test1zp0z7zqwhya6mpk5q929ur897g3pp9kkgalpreny8y304rfw6j2jxnwq6enuzvt0lp89wgcsufj7mvcnxpzgkd4hz70z3h2pnc8lhq8r',
            ),
            amount: {
              type: AmountType.WITHOUT_MULTIASSET,
              coin: toUint(7120787),
            },
            datumHash: {
              type: DatumType.HASH,
              hash: toFixLenBuffer(
                'ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce188',
                32,
              ),
            },
          },
          {
            format: TxOutputFormat.ARRAY_LEGACY,
            address: fromBech32(
              'addr_test1xqt87mdlvy9wqv8sgwkmrua00p65ak2ett22c8m7m8lkgenkp7mf2hgjz7clrusgmak5t2ere8shkrycfgkn5g4mh7uqvcq039',
            ),
            amount: {
              type: AmountType.WITH_MULTIASSET,
              coin: toUint(125215),
              multiasset: [
                {
                  policyId: toFixLenBuffer(
                    'd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2',
                    28,
                  ),
                  tokens: [
                    {
                      assetName: Buffer.from('Token1') as MaxLenBuffer<32>,
                      amount: toUint(1),
                    },
                  ],
                },
              ],
            },
            datumHash: {
              type: DatumType.HASH,
              hash: toFixLenBuffer(
                '00ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce1',
                32,
              ),
            },
          },
        ],
        fee: toUint(42),
        ttl: toUint(10),
        certificates: undefined,
        withdrawals: undefined,
        update: undefined,
        auxiliaryDataHash: undefined,
        validityIntervalStart: undefined,
        mint: undefined,
        scriptDataHash: toFixLenBuffer(
          'ffd4d009f554ba4fd8ed1f1d703244819861a9d34fd4753bcf3ff32f043ce188',
          32,
        ),
        collateralInputs: {
          items: [
            {
              transactionId: toFixLenBuffer(
                '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
                32,
              ),
              index: toUint(0),
            },
          ],
          hasTag: true,
        } as CddlNonEmptySet<TransactionInput>,
        requiredSigners: {
          items: [
            toFixLenBuffer(
              'fea6646c67fb467f8a5425e9c752e1e262b0420ba4b638f39514049a',
              28,
            ),
            toFixLenBuffer(
              'eea6646c67fb467f8a5425e9c752e1e262b0420ba4b638f39514049a',
              28,
            ),
          ],
          hasTag: true,
        } as CddlNonEmptySet<RequiredSigner>,
        networkId: toUint(1),
        collateralReturnOutput: undefined,
        totalCollateral: undefined,
        referenceInputs: undefined,
        votingProcedures: undefined,
        proposalProcedures: undefined,
        treasury: undefined,
        donation: undefined,
      },
      witnessSet: {},
      scriptValidity: true,
      auxiliaryData: null,
    },
  },
]
