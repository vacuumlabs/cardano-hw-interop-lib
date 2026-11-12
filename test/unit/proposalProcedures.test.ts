import {expect} from 'chai'

import {ParseErrorReason, ValidationErrorReason} from '../../src/errors'
import {parseProposalProcedure} from '../../src/txParsers'
import {validateGovAction} from '../../src/txValidators'
import type {GovAction} from '../../src/types'
import {GovActionType} from '../../src/types'
import type {InvalidParseTestCase} from '../test_utils'
import {registerTests, toFixLenBuffer, toUint} from '../test_utils'

const InvalidProposalProcedureTestCases: InvalidParseTestCase[] = [
  {
    testName: 'Unknown governance action type',
    // [deposit, reward_account, gov_action [9], anchor]
    cbor: '841b000000174876e800581de082293a49e3ef29a4f9c32e4c18f202f5324182db7790f48dccf7a6dd810982782168747470733a2f2f6578616d706c652e636f6d2f70726f706f73616c2e6a736f6e58200000000000000000000000000000000000000000000000000000000000000000',
    errMsg: ParseErrorReason.INVALID_GOV_ACTION_TYPE,
  },
]

registerTests(
  'Parse proposal procedure',
  parseProposalProcedure,
  [],
  InvalidProposalProcedureTestCases,
)

describe('Validate governance action', () => {
  const position = 'gov_action'
  const rewardAccount = toFixLenBuffer(
    'e082293a49e3ef29a4f9c32e4c18f202f5324182db7790f48dccf7a6dd',
    29,
  )

  it('Parameter change with cost models', () => {
    const govAction: GovAction = {
      type: GovActionType.PARAMETER_CHANGE,
      prevGovActionId: null,
      protocolParamUpdate: [{key: toUint(18), value: new Map()}],
      policyHash: null,
    }
    expect([...validateGovAction(govAction, position)]).to.deep.equal([
      {
        fixable: false,
        reason: ValidationErrorReason.PARAMETER_CHANGE_ACTION_WITH_COST_MODELS,
        position: `${position}.protocol_param_update`,
      },
    ])
  })

  it('Parameter change without protocol parameters', () => {
    const govAction: GovAction = {
      type: GovActionType.PARAMETER_CHANGE,
      prevGovActionId: null,
      protocolParamUpdate: [],
      policyHash: null,
    }
    expect([...validateGovAction(govAction, position)]).to.deep.equal([
      {
        fixable: false,
        reason:
          ValidationErrorReason.PARAMETER_CHANGE_ACTION_WITHOUT_PROTOCOL_PARAMETERS,
        position: `${position}.protocol_param_update`,
      },
    ])
  })

  it('Treasury withdrawals with duplicate reward accounts', () => {
    const govAction: GovAction = {
      type: GovActionType.TREASURY_WITHDRAWALS,
      withdrawals: [
        {rewardAccount, amount: toUint(1000000)},
        {rewardAccount, amount: toUint(2000000)},
      ],
      policyHash: null,
    }
    expect([...validateGovAction(govAction, position)]).to.deep.equal([
      {
        fixable: false,
        reason: ValidationErrorReason.GOV_ACTION_MAP_WITH_DUPLICATE_KEYS,
        position: `${position}.withdrawals`,
      },
    ])
  })
})
