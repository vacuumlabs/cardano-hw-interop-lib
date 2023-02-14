import {ParseErrorReason} from '../../src/errors'
import {parseInputs} from '../../src/txParsers'
import type {TransactionInput} from '../../src/types'
import type {InvalidParseTestCase, ValidParseTestCase} from '../test_utils'
import {registerTests, toFixLenBuffer, toUint} from '../test_utils'

const ValidInputsTestCases: ValidParseTestCase<TransactionInput[]>[] = [
  {
    testName: 'One input',
    cbor: '81825820B64AE44E1195B04663AB863B62337E626C65B0C9855A9FBB9EF4458F81A6F5EE01',
    parsed: [
      {
        transactionId: toFixLenBuffer(
          'B64AE44E1195B04663AB863B62337E626C65B0C9855A9FBB9EF4458F81A6F5EE',
          32,
        ),
        index: toUint(1),
      },
    ],
  },
  {
    testName: 'Three inputs',
    cbor: '8382582094461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d00825820b64ae44e1195b04663ab863b62337e626c65b0c9855a9fbb9ef4458f81a6f5ee00825820b64ae44e1195b04663ab863b62337e626c65b0c9855a9fbb9ef4458f81a6f5ee1bffffffffffffffff',
    parsed: [
      {
        transactionId: toFixLenBuffer(
          '94461e17271b4a108f679eb7b6947aea29573296a5edca635d583fb40785e05d',
          32,
        ),
        index: toUint(0),
      },
      {
        transactionId: toFixLenBuffer(
          'B64AE44E1195B04663AB863B62337E626C65B0C9855A9FBB9EF4458F81A6F5EE',
          32,
        ),
        index: toUint(0),
      },
      {
        transactionId: toFixLenBuffer(
          'B64AE44E1195B04663AB863B62337E626C65B0C9855A9FBB9EF4458F81A6F5EE',
          32,
        ),
        index: toUint('18446744073709551615'),
      },
    ],
  },
]

const InvalidInputsTestCases: InvalidParseTestCase[] = [
  {
    testName: 'Not an array',
    cbor: 'a100f6',
    errMsg: ParseErrorReason.INVALID_TX_INPUTS,
  },
  {
    testName: 'Invalid input structure',
    cbor: '8183187b0102',
    errMsg: ParseErrorReason.INVALID_TX_INPUT,
  },
  {
    testName: 'Invalid tx id',
    cbor: '8182581fB64AE44E1195B04663AB863B62337E626C65B0C9855A9FBB9EF4458F81A6F501',
    errMsg: ParseErrorReason.INVALID_TRANSACTION_ID,
  },
  {
    testName: 'Invalid index',
    cbor: '81825820B64AE44E1195B04663AB863B62337E626C65B0C9855A9FBB9EF4458F81A6F5EE20',
    errMsg: ParseErrorReason.INVALID_TX_INPUT_INDEX,
  },
]

registerTests(
  'Parse transaction inputs',
  parseInputs,
  ValidInputsTestCases,
  InvalidInputsTestCases,
)
