import { ParseErrorReason } from '../../src/errors'
import { parseWithdrawals } from '../../src/txParsers'
import type { Withdrawal } from '../../src/types'
import type { InvalidParseTestcase, ValidParseTestcase } from '../test_utils'
import { registerTests, rewardAccount, toUint } from '../test_utils'

const ValidWithdrawalsTestcases: ValidParseTestcase<Withdrawal[]>[] = [
    {
        testname: 'One withdrawal',
        cbor: 'a1581de12c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d187b',
        parsed: [{
            rewardAccount: rewardAccount('stake1uykqf807mz7yrm00h0yrtjs2www2e9s4272sych0fz7078gjzd4uw'),
            amount: toUint(123),
        }],
    },
    {
        testname: 'Two withdrawals',
        cbor: 'a2581de12c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d00581de1d7d8a321633b3d1ab1651eeb258ad898ebcef1d348b54148f18e15da1bffffffffffffffff',
        parsed: [
            {
                rewardAccount: rewardAccount('stake1uykqf807mz7yrm00h0yrtjs2www2e9s4272sych0fz7078gjzd4uw'),
                amount: toUint(0),
            },
            {
                rewardAccount: rewardAccount('stake1u8ta3gepvvan6x43v50wkfv2mzvwhnh36dyt2s2g7x8ptks528lzm'),
                amount: toUint("18446744073709551615"),
            },
        ],
    },
]

const InvalidWithdrawalsTestcases: InvalidParseTestcase[] = [
    {
        testname: 'Not a map',
        cbor: '83016161f6',
        errMsg: ParseErrorReason.INVALID_TX_WITHDRAWALS,
    },
    {
        testname: 'Invalid reward account as map key',
        cbor: 'a2581de12c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d000102',
        errMsg: ParseErrorReason.INVALID_REWARD_ACCOUNT,
    },
    {
        testname: 'Invalid withdrawal amonut as map value',
        cbor: 'a2581de12c049dfed8bc41edefbbc835ca0a739cac961557950262ef48bcff1d00581de1d7d8a321633b3d1ab1651eeb258ad898ebcef1d348b54148f18e15da6161',
        errMsg: ParseErrorReason.INVALID_WITHDRAWAL_AMOUNT,
    },
]

registerTests('Parse withdrawals', parseWithdrawals, ValidWithdrawalsTestcases, InvalidWithdrawalsTestcases)
