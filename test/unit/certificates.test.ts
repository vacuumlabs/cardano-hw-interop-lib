import {ParseErrorReason} from '../../src/errors'
import {parseCertificates} from '../../src/txParsers'
import {
  Certificate,
  Port,
  CertificateType,
  RelayType,
  CredentialType,
  CddlSet,
  KeyHash,
  CddlNonEmptyOrderedSet,
  DRepType,
  URL_MAX_LENGTH,
  DNS_NAME_MAX_LENGTH,
} from '../../src/types'
import {
  ipv4ToBuffer,
  registerTests,
  rewardAccount,
  toFixLenBuffer,
  toMaxLenString,
  toUint,
  InvalidParseTestCase,
  ValidParseTestCase,
} from '../test_utils'

const ValidCertificatesTestCases: ValidParseTestCase<
  CddlNonEmptyOrderedSet<Certificate>
>[] = [
  {
    testName: 'One stake registration legacy',
    cbor: '8182008200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d',
    parsed: {
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
      ],
      hasTag: false,
    } as CddlNonEmptyOrderedSet<Certificate>,
  },
  {
    testName: 'One stake registration Conway',
    cbor: '8183078200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d06',
    parsed: {
      items: [
        {
          type: CertificateType.STAKE_REGISTRATION_CONWAY,
          stakeCredential: {
            type: CredentialType.KEY_HASH,
            keyHash: toFixLenBuffer(
              '2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d',
              28,
            ),
          },
          deposit: toUint(6),
        },
      ],
      hasTag: false,
    } as CddlNonEmptyOrderedSet<Certificate>,
  },
  {
    testName: 'Two stake registrations',
    cbor: '8282008200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d82008200581cc1d58a7602c3bd8104cd2a871a2d1cb68f6f6669bd37a7688618ee55',
    parsed: {
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
          type: CertificateType.STAKE_REGISTRATION,
          stakeCredential: {
            type: CredentialType.KEY_HASH,
            keyHash: toFixLenBuffer(
              'c1d58a7602c3bd8104cd2a871a2d1cb68f6f6669bd37a7688618ee55',
              28,
            ),
          },
        },
      ],
      hasTag: false,
    } as CddlNonEmptyOrderedSet<Certificate>,
  },
  {
    testName: 'Stake certificates',
    cbor: '8383078200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d0683088201581cc1d58a7602c3bd8104cd2a871a2d1cb68f6f6669bd37a7688618ee550683028200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d581c001337292eec9b3eefc6802f71cb34c21a7963eb12466d52836aa390',
    parsed: {
      items: [
        {
          type: CertificateType.STAKE_REGISTRATION_CONWAY,
          stakeCredential: {
            type: CredentialType.KEY_HASH,
            keyHash: toFixLenBuffer(
              '2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d',
              28,
            ),
          },
          deposit: toUint(6),
        },
        {
          type: CertificateType.STAKE_DEREGISTRATION_CONWAY,
          stakeCredential: {
            type: CredentialType.SCRIPT_HASH,
            scriptHash: toFixLenBuffer(
              'c1d58a7602c3bd8104cd2a871a2d1cb68f6f6669bd37a7688618ee55',
              28,
            ),
          },
          deposit: toUint(6),
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
      ],
      hasTag: false,
    } as CddlNonEmptyOrderedSet<Certificate>,
  },
  {
    testName: 'Stake pool certificates',
    cbor: '828a03581c4dfbc0559b2e1d6af62c447f0a0d6290a8b05e075ef08db38c1b81a8582067c5c0b45db55e8c82752263207b9a92c2d5fa6c671aceed9df451cad3fac7a31a0001e2401a05f5e100d81e82031819581de1d7d8a321633b3d1ab1651eeb258ad898ebcef1d348b54148f18e15da82581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d581cf699c6400f85bdca54e44d0cad1f6141ce049a411c0d695fc30c3f7384840019029af650004706260000004700000000111100008301f676616464726573732e76616375756d6c6162732e636f6d8202781e616e6f746865722e616464726573732e76616375756d6c6162732e636f6d840019ffff447f0000fff682782468747470733a2f2f706f6f6c2d6d657461646174612e76616375756d6c6162732e636f6d5820e318d62e3d5cc3cc23ca1123438e439d7aac6c6c423320f670d159726ac9d11f8304581c4dfbc0559b2e1d6af62c447f0a0d6290a8b05e075ef08db38c1b81a81a0001dfbe',
    parsed: {
      items: [
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
                  URL_MAX_LENGTH,
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
  },
  {
    testName: 'DRep certificates',
    cbor: '8384108200581c1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8008276616464726573732e76616375756d6c6162732e636f6d5820E318D62E3D5CC3CC23CA1123438E439D7AAC6C6C423320F670D159726AC9D11F83118200581c1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce80083128200581c1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce88276616464726573732e76616375756d6c6162732e636f6d5820E318D62E3D5CC3CC23CA1123438E439D7AAC6C6C423320F670D159726AC9D11F',
    parsed: {
      items: [
        {
          type: CertificateType.DREP_REGISTRATION,
          dRepCredential: {
            type: CredentialType.KEY_HASH,
            keyHash: toFixLenBuffer(
              '1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8',
              28,
            ),
          },
          deposit: toUint(0),
          anchor: {
            url: toMaxLenString('address.vacuumlabs.com', URL_MAX_LENGTH),
            dataHash: toFixLenBuffer(
              'E318D62E3D5CC3CC23CA1123438E439D7AAC6C6C423320F670D159726AC9D11F',
              32,
            ),
          },
        },
        {
          type: CertificateType.DREP_DEREGISTRATION,
          dRepCredential: {
            type: CredentialType.KEY_HASH,
            keyHash: toFixLenBuffer(
              '1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8',
              28,
            ),
          },
          deposit: toUint(0),
        },
        {
          type: CertificateType.DREP_UPDATE,
          dRepCredential: {
            type: CredentialType.KEY_HASH,
            keyHash: toFixLenBuffer(
              '1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8',
              28,
            ),
          },
          anchor: {
            url: toMaxLenString('address.vacuumlabs.com', URL_MAX_LENGTH),
            dataHash: toFixLenBuffer(
              'E318D62E3D5CC3CC23CA1123438E439D7AAC6C6C423320F670D159726AC9D11F',
              32,
            ),
          },
        },
      ],
      hasTag: false,
    } as CddlNonEmptyOrderedSet<Certificate>,
  },
  {
    testName: 'Vote delegation certificates',
    cbor: '8483098200581c1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce88200581cabcdefc7db733c057fed63fa085113dfb570566eb708d548d2f7cce883098201581c1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce88201581cabcdefc7db733c057fed63fa085113dfb570566eb708d548d2f7cce883098200581c1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8810283098200581c1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce88103',
    parsed: {
      items: [
        {
          type: CertificateType.VOTE_DELEGATION,
          stakeCredential: {
            type: CredentialType.KEY_HASH,
            keyHash: toFixLenBuffer(
              '1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8',
              28,
            ),
          },
          dRep: {
            type: DRepType.KEY_HASH,
            keyHash: toFixLenBuffer(
              'abcdefc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8',
              28,
            ),
          },
        },
        {
          type: CertificateType.VOTE_DELEGATION,
          stakeCredential: {
            type: CredentialType.SCRIPT_HASH,
            scriptHash: toFixLenBuffer(
              '1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8',
              28,
            ),
          },
          dRep: {
            type: DRepType.SCRIPT_HASH,
            scriptHash: toFixLenBuffer(
              'abcdefc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8',
              28,
            ),
          },
        },
        {
          type: CertificateType.VOTE_DELEGATION,
          stakeCredential: {
            type: CredentialType.KEY_HASH,
            keyHash: toFixLenBuffer(
              '1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8',
              28,
            ),
          },
          dRep: {
            type: DRepType.ABSTAIN,
          },
        },
        {
          type: CertificateType.VOTE_DELEGATION,
          stakeCredential: {
            type: CredentialType.KEY_HASH,
            keyHash: toFixLenBuffer(
              '1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8',
              28,
            ),
          },
          dRep: {
            type: DRepType.NO_CONFIDENCE,
          },
        },
      ],
      hasTag: false,
    } as CddlNonEmptyOrderedSet<Certificate>,
  },
  {
    testName: 'Constitutional committee certificates',
    cbor: '82830e8200581c1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce88200581c1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8830f8201581c1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8f6',
    parsed: {
      items: [
        {
          type: CertificateType.AUTHORIZE_COMMITTEE_HOT,
          coldCredential: {
            type: CredentialType.KEY_HASH,
            keyHash: toFixLenBuffer(
              '1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8',
              28,
            ),
          },
          hotCredential: {
            type: CredentialType.KEY_HASH,
            keyHash: toFixLenBuffer(
              '1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8',
              28,
            ),
          },
        },
        {
          type: CertificateType.RESIGN_COMMITTEE_COLD,
          coldCredential: {
            type: CredentialType.SCRIPT_HASH,
            scriptHash: toFixLenBuffer(
              '1033bbc7db733c057fed63fa085113dfb570566eb708d548d2f7cce8',
              28,
            ),
          },
          anchor: null,
        },
      ],
      hasTag: false,
    } as CddlNonEmptyOrderedSet<Certificate>,
  },
  /* TODO
  {
    testName: 'Combined certificates',
    cbor: '80',
    parsed: {
      items: [
        {
          type: CertificateType.STAKE_AND_VOTE_DELEGATION,
        },
        {
          type: CertificateType.STAKE_REGISTRATION_AND_DELEGATION,
        },
        {
          type: CertificateType.STAKE_REGISTRATION_WITH_VOTE_DELEGATION,
        },
        {
          type: CertificateType.STAKE_REGISTRATION_WITH_STAKE_AND_VOTE_DELEGATION,
        },
      ],
      hasTag: false,
    } as CddlNonEmptyOrderedSet<Certificate>,
  },
*/
]

const InvalidCertificatesTestCases: InvalidParseTestCase[] = [
  {
    testName: 'Not an array',
    cbor: 'a100f6',
    errMsg: ParseErrorReason.INVALID_CERTIFICATES,
  },
  {
    testName: 'Items in array not unique',
    cbor: '8482008200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d82008200581cc1d58a7602c3bd8104cd2a871a2d1cb68f6f6669bd37a7688618ee5582008200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d82008200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1e',
    errMsg: ParseErrorReason.INVALID_CERTIFICATES,
  },
  {
    testName: 'Invalid certificate structure',
    cbor: '81818200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d',
    errMsg: ParseErrorReason.INVALID_CERTIFICATE,
  },
  {
    testName: 'Invalid certificate type',
    cbor: '8182198200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d',
    errMsg: ParseErrorReason.INVALID_CERTIFICATE_TYPE,
  },
  {
    testName: 'Invalid stake registration credential',
    cbor: '8182008100',
    errMsg: ParseErrorReason.INVALID_CREDENTIAL,
  },
  {
    testName: 'Invalid stake registration credential type',
    cbor: '8182008202581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d',
    errMsg: ParseErrorReason.INVALID_CREDENTIAL_TYPE,
  },
  {
    testName: 'Invalid stake registration key hash',
    cbor: '8182008200581d2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1dff',
    errMsg: ParseErrorReason.INVALID_CREDENTIAL_KEY_HASH,
  },
  {
    testName: 'Invalid pool registration owner',
    cbor: '8582008200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d82018201581cc1d58a7602c3bd8104cd2a871a2d1cb68f6f6669bd37a7688618ee5583028200581c2c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d581c001337292eec9b3eefc6802f71cb34c21a7963eb12466d52836aa3908a03581c4dfbc0559b2e1d6af62c447f0a0d6290a8b05e075ef08db38c1b81a8582067c5c0b45db55e8c82752263207b9a92c2d5fa6c671aceed9df451cad3fac7a31a0001e2401a05f5e100d81e82031819581de1d7d8a321633b3d1ab1651eeb258ad898ebcef1d348b54148f18e15da810084840019029af650004706260000004700000000111100008301f676616464726573732e76616375756d6c6162732e636f6d8202781e616e6f746865722e616464726573732e76616375756d6c6162732e636f6d840019ffff447f0000fff682782468747470733a2f2f706f6f6c2d6d657461646174612e76616375756d6c6162732e636f6d5820e318d62e3d5cc3cc23ca1123438e439d7aac6c6c423320f670d159726ac9d11f8304581c4dfbc0559b2e1d6af62c447f0a0d6290a8b05e075ef08db38c1b81a81a0001dfbe',
    errMsg: ParseErrorReason.INVALID_POOL_OWNER,
  },
]

registerTests(
  'Parse certificates',
  parseCertificates,
  ValidCertificatesTestCases,
  InvalidCertificatesTestCases,
)
