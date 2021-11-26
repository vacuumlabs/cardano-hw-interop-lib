import type { TransactionBody } from '../../../src/index'
import type { MaxlenBuffer, Port} from '../../../src/types'
import { AmountType, CertificateType, RelayType, StakeCredentialType } from '../../../src/types'
import { fromBech32, ipv4ToBuffer, rewardAccount, toFixlenBuffer, toInt, toMaxLenString, toUint } from '../../test_utils'

type TxBodyTestcase = {
    testname: string,
    txBody: TransactionBody,
    expectedTxBodyCbor: string,
}

export const TxBodyTestcases: TxBodyTestcase[] = [
    {
        testname: 'Simple tx body',
        txBody: {
            inputs: [{
                transactionId: toFixlenBuffer('ba638246bd9be05aa46e865320c354efea75cf5796e88b763faaa30c9fbb78de', 32),
                index: toUint(0),
            }],
            outputs: [{
                address: fromBech32('addr_test1qqr585tvlc7ylnqvz8pyqwauzrdu0mxag3m7q56grgmgu7sxu2hyfhlkwuxupa9d5085eunq2qywy7hvmvej456flknswgndm3'),
                amount: {
                    type: AmountType.WITHOUT_MULTIASSET,
                    coin: toUint(0),
                },
            }],
            fee: toUint(123456),
        },
        expectedTxBodyCbor: 'a30081825820ba638246bd9be05aa46e865320c354efea75cf5796e88b763faaa30c9fbb78de000181825839000743d16cfe3c4fcc0c11c2403bbc10dbc7ecdd4477e053481a368e7a06e2ae44dff6770dc0f4ada3cf4cf2605008e27aecdb332ad349fda700021a0001e240',
    },
    {
        testname: 'Tx body with withdrawal',
        txBody: {
            inputs: [{
                transactionId: toFixlenBuffer('94461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d', 32),
                index: toUint(0),
            }],
            outputs: [{
                address: fromBech32('addr_test1qqr585tvlc7ylnqvz8pyqwauzrdu0mxag3m7q56grgmgu7sxu2hyfhlkwuxupa9d5085eunq2qywy7hvmvej456flknswgndm3'),
                amount: {
                    type: AmountType.WITHOUT_MULTIASSET,
                    coin: toUint(1035701025),
                },
            }],
            fee: toUint(244241),
            withdrawals: [
                {
                    rewardAccount: rewardAccount('stake_test17pmqld54t5fp0v037gyd7m294v3unctmpjvy5tf6y2amlwqun8tdp'),
                    amount: toUint(12425116),
                },
                {
                    rewardAccount: rewardAccount('stake_test17z6ff56lydsf8e72a46a9wvmrefreh5ntfh55tf8dw0mgqg860tem'),
                    amount: toUint(129570000),
                },
            ],
        },
        expectedTxBodyCbor: 'a4008182582094461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d000181825839000743d16cfe3c4fcc0c11c2403bbc10dbc7ecdd4477e053481a368e7a06e2ae44dff6770dc0f4ada3cf4cf2605008e27aecdb332ad349fda71a3dbb8b21021a0003ba1105a2581df0760fb6955d1217b1f1f208df6d45ab23c9e17b0c984a2d3a22bbbfb81a00bd979c581df0b494d35f236093e7caed75d2b99b1e523cde935a6f4a2d276b9fb4011a07b914d0',
    },
    {
        testname: 'Tx body with multiple outputs and multiasset',
        txBody: {
            inputs: [{
                transactionId: toFixlenBuffer('b64ae44e1195b04663ab863b62337e626c65b0c9855a9fbb9ef4458f81a6f5ee', 32),
                index: toUint('18446744073709551615'),
            }],
            outputs: [
                {
                    address: fromBech32('addr_test1xqt87mdlvy9wqv8sgwkmrua00p65ak2ett22c8m7m8lkgenkp7mf2hgjz7clrusgmak5t2ere8shkrycfgkn5g4mh7uqvcq039'),
                    amount: {
                        type: AmountType.WITH_MULTIASSET,
                        coin: toUint(125215),
                        multiasset: [{
                            policyId: toFixlenBuffer('d7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2', 28),
                            tokens: [{
                                assetName: Buffer.from('Token1') as MaxlenBuffer<32>,
                                amount: toUint(1),
                            }],
                        }],
                    },
                },
                {
                    address: fromBech32('addr_test1qqr585tvlc7ylnqvz8pyqwauzrdu0mxag3m7q56grgmgu7sxu2hyfhlkwuxupa9d5085eunq2qywy7hvmvej456flknswgndm3'),
                    amount: {
                        type: AmountType.WITH_MULTIASSET,
                        coin: toUint(1035701025),
                        multiasset: [{
                            policyId: toFixlenBuffer('d7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2', 28),
                            tokens: [
                                {
                                    assetName: Buffer.from('Token1') as MaxlenBuffer<32>,
                                    amount: toUint(1400215),
                                },
                                {
                                    assetName: Buffer.from('Token2') as MaxlenBuffer<32>,
                                    amount: toUint(12513265),
                                },
                            ],
                        }],
                    },
                },
            ],
            fee: toUint(197891),
            mint: [{
                policyId: toFixlenBuffer('d7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2', 28),
                tokens: [
                    {
                        assetName: Buffer.from('Token1') as MaxlenBuffer<32>,
                        amount: toInt(-10000000),
                    },
                    {
                        assetName: Buffer.from('Token2') as MaxlenBuffer<32>,
                        amount: toInt('9223372036854775807'),
                    },
                ],
            }],
        },
        expectedTxBodyCbor: 'a40081825820b64ae44e1195b04663ab863b62337e626c65b0c9855a9fbb9ef4458f81a6f5ee1bffffffffffffffff018282583930167f6dbf610ae030f043adb1f3af78754ed9595ad4ac1f7ed9ff6466760fb6955d1217b1f1f208df6d45ab23c9e17b0c984a2d3a22bbbfb8821a0001e91fa1581cd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2a146546f6b656e3101825839000743d16cfe3c4fcc0c11c2403bbc10dbc7ecdd4477e053481a368e7a06e2ae44dff6770dc0f4ada3cf4cf2605008e27aecdb332ad349fda7821a3dbb8b21a1581cd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2a246546f6b656e311a00155d9746546f6b656e321a00beeff1021a0003050309a1581cd7a7c6999786354b6dbee181a2f562a628a75fce126f4da40ce5d9b2a246546f6b656e313a0098967f46546f6b656e321b7fffffffffffffff',
    },
    {
        testname: 'Tx body with certificates',
        txBody: {
            inputs: [{
                transactionId: toFixlenBuffer('b64ae44e1195b04663ab863b62337e626c65b0c9855a9fbb9ef4458f81a6f5ee', 32),
                index: toUint(42),
            }],
            outputs: [{
                address: fromBech32('addr1qxdn4yany8lc6ewkmuwxmpza2ndm7t9ngyzlmdzwecdh6vfvqjwlak9ug8k7lw7gxh9q5uuu4jtp24u4qf3w7j9uluwssp092m'),
                amount: {
                    type: AmountType.WITHOUT_MULTIASSET,
                    coin: toUint(1),
                },
            }],
            fee: toUint(1244241),
            certificates: [
                {
                    type: CertificateType.STAKE_REGISTRATION,
                    stakeCredential: {
                        type: StakeCredentialType.ADDRESS_KEY_HASH,
                        hash: toFixlenBuffer('2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d', 28),
                    },
                },
                {
                    type: CertificateType.STAKE_DEREGISTRATION,
                    stakeCredential: {
                        type: StakeCredentialType.SCRIPT_HASH,
                        hash: toFixlenBuffer('c1d58a7602c3bd8104cd2a871a2d1cb68f6f6669bd37a7688618ee55', 28),
                    },
                },
                {
                    type: CertificateType.STAKE_DELEGATION,
                    stakeCredential: {
                        type: StakeCredentialType.ADDRESS_KEY_HASH,
                        hash: toFixlenBuffer('2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d', 28),
                    },
                    poolKeyHash: toFixlenBuffer('001337292eec9b3eefc6802f71cb34c21a7963eb12466d52836aa390', 28),
                },
                {
                    type: CertificateType.POOL_REGISTRATION,
                    poolParams: {
                        operator: toFixlenBuffer('4DFBC0559B2E1D6AF62C447F0A0D6290A8B05E075EF08DB38C1B81A8', 28),
                        vrfKeyHash: toFixlenBuffer('67C5C0B45DB55E8C82752263207B9A92C2D5FA6C671ACEED9DF451CAD3FAC7A3', 32),
                        pledge: toUint(123456),
                        cost: toUint(100000000),
                        margin: [toUint(3), toUint(25)],
                        rewardAccount: rewardAccount('stake1u8ta3gepvvan6x43v50wkfv2mzvwhnh36dyt2s2g7x8ptks528lzm'),
                        poolOwners: [
                            toFixlenBuffer('2C049DFED8BC41EDEFBBC835CA0A739CAC961557950262EF48BCFF1D', 28),
                            toFixlenBuffer('F699C6400F85BDCA54E44D0CAD1F6141CE049A411C0D695FC30C3F73', 28),
                        ],
                        relays: [
                            {
                                type: RelayType.SINGLE_HOST_ADDRESS,
                                port: 666 as Port,
                                ipv4: null,
                                ipv6: toFixlenBuffer('00470626000000470000000011110000', 16),
                            },
                            {
                                type: RelayType.SINGLE_HOST_NAME,
                                port: null,
                                dnsName: toMaxLenString('address.vacuumlabs.com', 64),
                            },
                            {
                                type: RelayType.MULTI_HOST_NAME,
                                dnsName: toMaxLenString('another.address.vacuumlabs.com', 64),
                            },
                            {
                                type: RelayType.SINGLE_HOST_ADDRESS,
                                port: 65535 as Port,
                                ipv4: ipv4ToBuffer("127.0.0.255"),
                                ipv6: null,
                            },
                        ],
                        poolMetadata: {
                            url: toMaxLenString("https://pool-metadata.vacuumlabs.com", 64),
                            metadataHash: toFixlenBuffer("E318D62E3D5CC3CC23CA1123438E439D7AAC6C6C423320F670D159726AC9D11F", 32),
                        },
                    },
                },
                {
                    type: CertificateType.POOL_RETIREMENT,
                    poolKeyHash: toFixlenBuffer('4dfbc0559b2e1d6af62c447f0a0d6290a8b05e075ef08db38c1b81a8', 28),
                    epoch: toUint(122814),
                },
            ],
        },
        expectedTxBodyCbor: 'a40081825820b64ae44e1195b04663ab863b62337e626c65b0c9855a9fbb9ef4458f81a6f5ee182a0181825839019b3a93b321ff8d65d6df1c6d845d54dbbf2cb34105fdb44ece1b7d312c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d01021a0012fc51048582008200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d82018201581cc1d58a7602c3bd8104cd2a871a2d1cb68f6f6669bd37a7688618ee5583028200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d581c001337292eec9b3eefc6802f71cb34c21a7963eb12466d52836aa3908a03581c4dfbc0559b2e1d6af62c447f0a0d6290a8b05e075ef08db38c1b81a8582067c5c0b45db55e8c82752263207b9a92c2d5fa6c671aceed9df451cad3fac7a31a0001e2401a05f5e100d81e82031819581de1d7d8a321633b3d1ab1651eeb258ad898ebcef1d348b54148f18e15da82581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d581cf699c6400f85bdca54e44d0cad1f6141ce049a411c0d695fc30c3f7384840019029af650004706260000004700000000111100008301f676616464726573732e76616375756d6c6162732e636f6d8202781e616e6f746865722e616464726573732e76616375756d6c6162732e636f6d840019ffff447f0000fff682782468747470733a2f2f706f6f6c2d6d657461646174612e76616375756d6c6162732e636f6d5820e318d62e3d5cc3cc23ca1123438e439d7aac6c6c423320f670d159726ac9d11f8304581c4dfbc0559b2e1d6af62c447f0a0d6290a8b05e075ef08db38c1b81a81a0001dfbe',
    },
]
