import type {ValidationError} from './errors'
import {err, ValidationErrorReason} from './errors'
import type {
  Amount,
  Certificate,
  Int,
  Mint,
  Multiasset,
  RequiredSigner,
  TransactionBody,
  TransactionInput,
  TransactionOutput,
  Uint,
  Withdrawal,
  CddlSet,
  CddlNonEmptySet,
  CddlNonEmptyOrderedSet,
  VoterVotes,
  PoolRegistrationCertificate,
} from './types'
import {AmountType, CertificateType, DatumType, TxOutputFormat} from './types'
import {bind, unreachable} from './utils'

const UINT16_MAX = 65535
const MAX_UINT_64_STR = '18446744073709551615'
const MIN_INT_64_STR = '-9223372036854775808'
const MAX_INT_64_STR = '9223372036854775807'

type ValidatorReturnType = Generator<ValidationError>

/**
 * Validate the given `cond` yielding the `err` if validation fails
 *
 * @yields ValidationError if the `cond` is false
 */
function* validate(cond: boolean, err: ValidationError): ValidatorReturnType {
  if (!cond) yield err
}

/**
 * Runs the given validator only if the provided value is not null or undefined
 */
function* validateOptional<T>(
  x: T | undefined | null,
  validateFn: (x: T) => ValidatorReturnType,
): ValidatorReturnType {
  if (x != null) yield* validateFn(x)
}

/**
 * Validates a list according to the constraints in CIP-0021:
 *  * an empty optional list is not accepted and must not be included
 *  * the length of a list must not exceed `UINT16_MAX`, i.e. 65535
 */
function* validateListConstraints(
  list: unknown[],
  position: string,
  requiredList: boolean,
): ValidatorReturnType {
  if (!requiredList) {
    yield* validate(
      list.length > 0,
      err(
        ValidationErrorReason.OPTIONAL_EMPTY_LISTS_AND_MAPS_MUST_NOT_BE_INCLUDED,
        position,
      ),
    )
  }
  yield* validate(
    list.length <= UINT16_MAX,
    err(ValidationErrorReason.NUMBER_OF_ELEMENTS_EXCEEDS_UINT16, position),
  )
}

const validateUint64 = (n: Uint, position: string) =>
  validate(
    n >= 0 && n <= BigInt(MAX_UINT_64_STR),
    err(ValidationErrorReason.UNSIGNED_INTEGER_NOT_UINT64, position),
  )

const validateInt64 = (n: Int, position: string) =>
  validate(
    n >= BigInt(MIN_INT_64_STR) && n <= BigInt(MAX_INT_64_STR),
    err(ValidationErrorReason.INTEGER_NOT_INT64, position),
  )

function* validateTxInputs(
  txInputs: CddlSet<TransactionInput>,
): ValidatorReturnType {
  yield* validateListConstraints(
    txInputs.items,
    'transaction_body.inputs',
    true,
  )

  for (const [i, input] of txInputs.items.entries()) {
    yield* validateUint64(input.index, `transaction_body.inputs[${i}].index`)
  }
}

function* validateMultiasset<T extends Int | Uint>(
  multiasset: Multiasset<T>,
  validateAmount: (n: T, position: string) => ValidatorReturnType,
  position: string,
): ValidatorReturnType {
  yield* validateListConstraints(multiasset, position, false)

  for (const {policyId, tokens} of multiasset) {
    yield* validateListConstraints(
      tokens,
      `${position}[${policyId.toString('hex')}]`,
      false,
    )

    for (const {assetName, amount} of tokens) {
      yield* validateAmount(
        amount,
        `${position}[${policyId.toString('hex')}][${assetName.toString(
          'hex',
        )}]`,
      )
    }
  }
}

function* validateTxOutputAmount(
  amount: Amount,
  position: string,
): ValidatorReturnType {
  switch (amount.type) {
    case AmountType.WITHOUT_MULTIASSET:
      yield* validateUint64(amount.coin, `${position}.amount`)
      break
    case AmountType.WITH_MULTIASSET:
      yield* validateUint64(amount.coin, `${position}.amount`)
      // Although this check is also preformed by the `validateMultiasset`
      // function, this is a very specific check for the output format
      // that it is okay that they are defacto preformed twice with
      // different ValidationErrors, and both errors are marked as fixable
      yield* validate(
        amount.multiasset.length > 0,
        err(
          ValidationErrorReason.OUTPUT_AMOUNT_WITHOUT_TOKENS_MUST_NOT_BE_A_TUPLE,
          `${position}.amount`,
        ),
      )
      yield* validateMultiasset(
        amount.multiasset,
        validateUint64,
        `${position}`,
      )
      break
    default:
      unreachable(amount)
  }
}

function* validateTxOutput(
  output: TransactionOutput,
  position: string,
): ValidatorReturnType {
  yield* validateTxOutputAmount(output.amount, position)

  switch (output.format) {
    case TxOutputFormat.MAP_BABBAGE:
      yield* validate(
        output.datum?.type !== DatumType.INLINE ||
          output.datum.bytes.length > 0,
        err(
          ValidationErrorReason.INLINE_DATUM_MUST_NOT_BE_EMPTY_IF_DEFINED,
          `${position}.datum.bytes`,
        ),
      )
      yield* validate(
        output.referenceScript == null || output.referenceScript?.length > 0,
        err(
          ValidationErrorReason.REFERENCE_SCRIPT_MUST_NOT_BE_EMPTY_IF_DEFINED,
          `${position}.reference_script`,
        ),
      )
      break
    default:
      break
  }
}

function* validateTxOutputs(outputs: TransactionOutput[]): ValidatorReturnType {
  yield* validateListConstraints(outputs, 'transaction_body.outputs', true)

  for (const [i, output] of outputs.entries()) {
    yield* validateTxOutput(output, `transaction_body.outputs[${i}]`)
  }
}

function* validateCertificates(
  certificates: CddlNonEmptyOrderedSet<Certificate>,
): ValidatorReturnType {
  yield* validateListConstraints(
    certificates.items,
    'transaction_body.certificates',
    false,
  )

  for (const [i, certificate] of certificates.items.entries()) {
    switch (certificate.type) {
      case CertificateType.POOL_REGISTRATION:
        yield* validateUint64(
          certificate.poolParams.pledge,
          `transaction_body.certificates[${i}].pool_params.pledge`,
        )
        yield* validateUint64(
          certificate.poolParams.cost,
          `transaction_body.certificates[${i}].pool_params.cost`,
        )
        yield* validateUint64(
          certificate.poolParams.margin[0],
          `transaction_body.certificates[${i}].pool_params.margin[0]`,
        )
        yield* validateUint64(
          certificate.poolParams.margin[1],
          `transaction_body.certificates[${i}].pool_params.margin[1]`,
        )
        break
      case CertificateType.POOL_RETIREMENT:
        yield* validateUint64(
          certificate.epoch,
          `transaction_body.certificates[${i}].epoch`,
        )
        break
      case CertificateType.GENESIS_KEY_DELEGATION:
        yield* validate(
          false,
          err(
            ValidationErrorReason.UNSUPPORTED_CERTIFICATE_GENESIS_KEY_DELEGATION,
            `transaction_body.certificates[${i}]`,
          ),
        )
        break
      case CertificateType.MOVE_INSTANTANEOUS_REWARDS_CERT:
        yield* validate(
          false,
          err(
            ValidationErrorReason.UNSUPPORTED_CERTIFICATE_MOVE_INSTANTANEOUS_REWARDS_CERT,
            `transaction_body.certificates[${i}]`,
          ),
        )
        break
      case CertificateType.STAKE_AND_VOTE_DELEGATION:
        yield* validate(
          false,
          err(
            ValidationErrorReason.UNSUPPORTED_CERTIFICATE_STAKE_VOTE_DELEG,
            `transaction_body.certificates[${i}]`,
          ),
        )
        break
      case CertificateType.STAKE_REGISTRATION_AND_DELEGATION:
        yield* validate(
          false,
          err(
            ValidationErrorReason.UNSUPPORTED_CERTIFICATE_STAKE_REG_DELEG,
            `transaction_body.certificates[${i}]`,
          ),
        )
        break
      case CertificateType.STAKE_REGISTRATION_WITH_VOTE_DELEGATION:
        yield* validate(
          false,
          err(
            ValidationErrorReason.UNSUPPORTED_CERTIFICATE_VOTE_REG_DELEG,
            `transaction_body.certificates[${i}]`,
          ),
        )
        break
      case CertificateType.STAKE_REGISTRATION_WITH_STAKE_AND_VOTE_DELEGATION:
        yield* validate(
          false,
          err(
            ValidationErrorReason.UNSUPPORTED_CERTIFICATE_STAKE_VOTE_REG_DELEG,
            `transaction_body.certificates[${i}]`,
          ),
        )
        break
      case CertificateType.STAKE_REGISTRATION_CONWAY:
      case CertificateType.STAKE_DEREGISTRATION_CONWAY:
        yield* validateUint64(
          certificate.deposit,
          `transaction_body.certificates[${i}].deposit`,
        )
        break
      default:
        break
    }
  }
}

function* validateWithdrawals(withdrawals: Withdrawal[]): ValidatorReturnType {
  yield* validateListConstraints(
    withdrawals,
    'transaction_body.withdrawals',
    false,
  )

  for (const {rewardAccount, amount} of withdrawals) {
    yield* validateUint64(
      amount,
      `transaction_body.withdrawals[${rewardAccount.toString('hex')}]`,
    )
  }
}

const validateMint = (mint: Mint) =>
  validateMultiasset(mint, validateInt64, 'transaction_body.mint')

function* validateCollateralInputs(
  collateralInputs: CddlNonEmptySet<TransactionInput>,
): ValidatorReturnType {
  yield* validateListConstraints(
    collateralInputs.items,
    'transaction_body.collateral_inputs',
    false,
  )

  for (const [i, collateralInput] of collateralInputs.items.entries()) {
    yield* validateUint64(
      collateralInput.index,
      `transaction_body.collateral_inputs[${i}].index`,
    )
  }
}

function* validateRequiredSigners(
  requiredSigners: CddlNonEmptySet<RequiredSigner>,
): ValidatorReturnType {
  yield* validateListConstraints(
    requiredSigners.items,
    'transaction_body.required_signers',
    false,
  )
}

function* validateReferenceInputs(
  referenceInputs: CddlNonEmptySet<TransactionInput>,
): ValidatorReturnType {
  yield* validateListConstraints(
    referenceInputs.items,
    'transaction_body.reference_inputs',
    false,
  )

  for (const [i, input] of referenceInputs.items.entries()) {
    yield* validateUint64(
      input.index,
      `transaction_body.reference_inputs[${i}].index`,
    )
  }
}

function* validateTxCollateralReturnOutput(
  output: TransactionOutput,
  position: string,
): ValidatorReturnType {
  validateTxOutputAmount(output.amount, position)
  switch (output.format) {
    case TxOutputFormat.MAP_BABBAGE:
      yield* validate(
        output.datum == null,
        err(
          ValidationErrorReason.COLLATERAL_RETURN_MUST_NOT_CONTAIN_DATUM,
          `${position}.datum`,
        ),
      )
      yield* validate(
        output.referenceScript == null,
        err(
          ValidationErrorReason.COLLATERAL_RETURN_MUST_NOT_CONTAIN_REFERENCE_SCRIPT,
          `${position}.reference_script`,
        ),
      )
      break
    default:
      break
  }
}

function* validateVotingProcedures(
  voterVotesArray: VoterVotes[],
): ValidatorReturnType {
  yield* validateListConstraints(
    voterVotesArray,
    'transaction_body.voting_procedures',
    true,
  )

  yield* validate(
    voterVotesArray.length <= 1,
    err(
      ValidationErrorReason.TOO_MANY_VOTERS_IN_VOTING_PROCEDURES,
      `transaction_body.voting_procedures`,
    ),
  )

  for (const [i, voterVotes] of voterVotesArray.entries()) {
    yield* validate(
      voterVotes.votes.length === 1,
      err(
        ValidationErrorReason.INVALID_NUMBER_OF_VOTING_PROCEDURES,
        `transaction_body.voting_procedures[${i}].votes`,
      ),
    )

    for (const [j, voterVote] of voterVotes.votes.entries()) {
      yield* validateUint64(
        voterVote.govActionId.index,
        `transaction_body.voting_procedures[${i}].votes[${j}].govActionId.index`,
      )
    }
  }
}

/**
 * Checks if a transaction contains pool registration certificate; if it does,
 * runs a series of validators for pool registration transactions.
 */
function* validatePoolRegistrationTransaction(
  txBody: TransactionBody,
): ValidatorReturnType {
  // If the transaction doesn't contain pool registration certificates we can
  // skip all the validations.
  if (
    txBody.certificates === undefined ||
    txBody.certificates.items.find(
      ({type}) => type === CertificateType.POOL_REGISTRATION,
    ) === undefined
  ) {
    return
  }

  yield* validate(
    txBody.certificates.items.length === 1,
    err(
      ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_OTHER_CERTIFICATES,
      'transaction_body.certificates',
    ),
  )

  // We consider the transaction to have no withdrawals if the field is not
  // present or if the array length is 0. Checking only whether the field is
  // not present is not sufficient because the transaction could contain an
  // empty array which is a fixable error but it would fail this validation,
  // which is not fixable. This could lead to a scenario where a potentially
  // fixable transaction would have an unfixable validation error reported.
  yield* validate(
    txBody.withdrawals === undefined || txBody.withdrawals.length === 0,
    err(
      ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_WITHDRAWALS,
      'transaction_body.withdrawals',
    ),
  )

  // The same applies here, but mint has a nested array for the tokens that
  // needs to be checked in a similar way
  yield* validate(
    txBody.mint === undefined ||
      txBody.mint.length === 0 ||
      txBody.mint.every(({tokens}) => tokens.length === 0),
    err(
      ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_MINT_ENTRY,
      'transaction_body.mint',
    ),
  )

  // no Plutus elements in tx outputs
  yield* validate(
    txBody.outputs.every((output) => {
      switch (output.format) {
        case TxOutputFormat.MAP_BABBAGE:
          if (output.datum !== undefined) {
            return false
          }
          if (output.referenceScript !== undefined) {
            return false
          }
          break
        case TxOutputFormat.ARRAY_LEGACY:
          if (output.datumHash !== undefined) {
            return false
          }
          break
        default:
          unreachable(output)
      }
      return true
    }),
    err(
      ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_PLUTUS_OUTPUTS,
      'transaction_body.outputs',
    ),
  )

  yield* validate(
    txBody.scriptDataHash === undefined,
    err(
      ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_SCRIPT_DATA_HASH,
      'transaction_body.script_data_hash',
    ),
  )

  yield* validate(
    txBody.collateralInputs === undefined,
    err(
      ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_COLLATERAL_INPUTS,
      'transaction_body.collateral_inputs',
    ),
  )

  yield* validate(
    txBody.requiredSigners === undefined,
    err(
      ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_REQUIRED_SIGNERS,
      'transaction_body.required_signers',
    ),
  )

  yield* validate(
    txBody.collateralReturnOutput === undefined,
    err(
      ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_COLLATERAL_RETURN_OUTPUT,
      'transaction_body.collateral_return_output',
    ),
  )

  yield* validate(
    txBody.totalCollateral === undefined,
    err(
      ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_TOTAL_COLLATERAL,
      'transaction_body.total_collateral',
    ),
  )

  yield* validate(
    txBody.referenceInputs === undefined,
    err(
      ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_REFERENCE_INPUTS,
      'transaction_body.reference_inputs',
    ),
  )

  yield* validate(
    txBody.votingProcedures === undefined,
    err(
      ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_VOTING_PROCEDURES,
      'transaction_body.voting_procedures',
    ),
  )

  yield* validate(
    txBody.treasury === undefined,
    err(
      ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_TREASURY,
      'transaction_body.treasury',
    ),
  )

  yield* validate(
    txBody.donation === undefined,
    err(
      ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_DONATION,
      'transaction_body.donation',
    ),
  )
}

/**
 * Validates tx body according to CIP-0021. Properties that are enforced during parsing (e.g. hash
 * lengths) are not validated.
 */
function* validateTxBody(txBody: TransactionBody): ValidatorReturnType {
  yield* validateTxInputs(txBody.inputs)
  yield* validateTxOutputs(txBody.outputs)
  yield* validateUint64(txBody.fee, 'transaction_body.fee')
  yield* validateOptional(
    txBody.ttl,
    bind(validateUint64, 'transaction_body.ttl'),
  )
  yield* validateOptional(txBody.certificates, validateCertificates)
  yield* validateOptional(txBody.withdrawals, validateWithdrawals)
  yield* validate(
    txBody.update === undefined,
    err(ValidationErrorReason.UNSUPPORTED_TX_UPDATE, 'transaction_body.update'),
  )
  yield* validateOptional(
    txBody.validityIntervalStart,
    bind(validateUint64, 'transaction_body.validity_interval_start'),
  )
  yield* validateOptional(txBody.mint, validateMint)
  yield* validateOptional(txBody.collateralInputs, validateCollateralInputs)
  yield* validateOptional(txBody.requiredSigners, validateRequiredSigners)
  yield* validateOptional(
    txBody.networkId,
    bind(validateUint64, 'transaction_body.network_id'),
  )
  yield* validateOptional(
    txBody.collateralReturnOutput,
    bind(
      validateTxCollateralReturnOutput,
      'transaction_body.collateral_return_output',
    ),
  )
  yield* validateOptional(
    txBody.totalCollateral,
    bind(validateUint64, 'transaction_body.total_collateral'),
  )
  yield* validateOptional(txBody.referenceInputs, validateReferenceInputs)
  yield* validateOptional(txBody.votingProcedures, validateVotingProcedures)
  yield* validate(
    txBody.proposalProcedures === undefined,
    err(
      ValidationErrorReason.UNSUPPORTED_TX_PROPOSAL_PROCEDURES,
      'transaction_body.proposal_procedures',
    ),
  )
  yield* validateOptional(
    txBody.treasury,
    bind(validateUint64, 'transaction_body.treasury'),
  )
  yield* validateOptional(
    txBody.donation,
    bind(validateUint64, 'transaction_body.donation'),
  )

  // extra checks for transactions containing stake pool registration certificates
  yield* validatePoolRegistrationTransaction(txBody)

  // check for consistency of set tags
  const poolRegistrationCertificate = txBody.certificates?.items.find(
    ({type}) => type === CertificateType.POOL_REGISTRATION,
  ) as PoolRegistrationCertificate
  const allSets = [
    txBody.inputs,
    txBody.certificates,
    txBody.collateralInputs,
    txBody.requiredSigners,
    txBody.referenceInputs,
    txBody.proposalProcedures,
    poolRegistrationCertificate?.poolParams.poolOwners,
  ]
  const tagIsPresent = allSets.some((s) => s !== undefined && s.hasTag)
  const tagIsAbsent = allSets.some((s) => s !== undefined && !s.hasTag)
  const tagsAreInconsistent = tagIsPresent && tagIsAbsent
  yield* validate(
    !tagsAreInconsistent,
    err(ValidationErrorReason.TX_INCONSISTENT_SET_TAGS, 'transaction_body'),
  )
}

/**
 * Runs a series of validators against the given input, returning all the
 * validation errors found.
 */
export const validateTxCommon = (
  inputCbor: Buffer,
  canonicalCbor: Buffer,
  txBody: TransactionBody,
): ValidationError[] => [
  // Collect the errors from all the validations
  ...validate(
    inputCbor.equals(canonicalCbor),
    err(ValidationErrorReason.CBOR_IS_NOT_CANONICAL, 'transaction'),
  ),
  ...validateTxBody(txBody),
]
