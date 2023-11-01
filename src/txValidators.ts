import type {ValidationError} from './errors'
import {err, ValidationErrorReason} from './errors'
import type {
  Amount,
  Certificate,
  Int,
  Mint,
  Multiasset,
  RequiredSigner,
  CredentialType,
  StakeDelegationCertificate,
  StakeDeregistrationCertificate,
  StakeRegistrationCertificate,
  TransactionBody,
  TransactionInput,
  TransactionOutput,
  Uint,
  Withdrawal,
} from './types'
import {AmountType, CertificateType, DatumType, TxOutputFormat} from './types'
import {bind, getRewardAccountStakeCredentialType, unreachable} from './utils'

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

function* validateTxInputs(txInputs: TransactionInput[]): ValidatorReturnType {
  yield* validateListConstraints(txInputs, 'transaction_body.inputs', true)

  for (const [i, input] of txInputs.entries()) {
    yield* validateUint64(input.index, `transaction_body.inputs[${i}].index`)
  }
}

function* validateMultiasset<T>(
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
  certificates: Certificate[],
): ValidatorReturnType {
  yield* validateListConstraints(
    certificates,
    'transaction_body.certificates',
    false,
  )

  for (const [i, certificate] of certificates.entries()) {
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

function* validateStakeCredentials(
  certificates: Certificate[] | undefined,
  withdrawals: Withdrawal[] | undefined,
): ValidatorReturnType {
  const certificateStakeCredentialTypes: Set<CredentialType> = new Set()
  const withdrawalStakeCredentialTypes: Set<CredentialType> = new Set()

  if (certificates) {
    // We must first filter out the certificates that contain stake credentials
    const certificatesWithStakeCredentials = certificates.filter(
      ({type}) =>
        type === CertificateType.STAKE_REGISTRATION ||
        type === CertificateType.STAKE_DEREGISTRATION ||
        type === CertificateType.STAKE_DELEGATION,
    ) as (
      | StakeRegistrationCertificate
      | StakeDeregistrationCertificate
      | StakeDelegationCertificate
    )[]
    certificatesWithStakeCredentials.forEach(({stakeCredential}) =>
      certificateStakeCredentialTypes.add(stakeCredential.type),
    )
    // We check the set of stake credential types to be less or equal to one,
    // because if there are 0 types it means there were no certificates with
    // stake credentials which is possible and it shouldn't trigger this error
    yield* validate(
      certificateStakeCredentialTypes.size <= 1,
      err(
        ValidationErrorReason.WITHDRAWALS_MUST_HAVE_THE_SAME_TYPE_OF_STAKE_CREDENTIAL,
        'transaction_body.certificates',
      ),
    )
  }

  if (withdrawals) {
    withdrawals.forEach(({rewardAccount}) =>
      withdrawalStakeCredentialTypes.add(
        getRewardAccountStakeCredentialType(rewardAccount),
      ),
    )
    // Here we also check the number of stake credential types to be less or
    // equal to one, because we could have been dealing with an empty array
    // and that's a ValidationError that is caught elsewhere and shouldn't
    // be caught by this check
    yield* validate(
      withdrawalStakeCredentialTypes.size <= 1,
      err(
        ValidationErrorReason.WITHDRAWALS_MUST_HAVE_THE_SAME_TYPE_OF_STAKE_CREDENTIAL,
        'transaction_body.withdrawals',
      ),
    )
  }

  if (
    certificateStakeCredentialTypes.size === 1 &&
    withdrawalStakeCredentialTypes.size === 1
  ) {
    // We only trigger this check if both certificates and withdrawals have
    // consistent stake credential types otherwise it is useless to check
    // whether they are consistent in respect to each other.
    yield* validate(
      [...certificateStakeCredentialTypes][0] ===
        [...withdrawalStakeCredentialTypes][0],
      err(
        ValidationErrorReason.CERTIFICATES_AND_WITHDRAWALS_STAKE_CREDENTIAL_TYPES_MUST_BE_CONSISTENT,
        'transaction_body',
      ),
    )
  }
}

const validateMint = (mint: Mint) =>
  validateMultiasset(mint, validateInt64, 'transaction_body.mint')

function* validateCollateralInputs(
  collateralInputs: TransactionInput[],
): ValidatorReturnType {
  yield* validateListConstraints(
    collateralInputs,
    'transaction_body.collateral_inputs',
    false,
  )

  for (const [i, collateralInput] of collateralInputs.entries()) {
    yield* validateUint64(
      collateralInput.index,
      `transaction_body.collateral_inputs[${i}].index`,
    )
  }
}

function* validateRequiredSigners(
  requiredSigners: RequiredSigner[],
): ValidatorReturnType {
  yield* validateListConstraints(
    requiredSigners,
    'transaction_body.required_signers',
    false,
  )
}

function* validateReferenceInputs(
  referenceInputs: TransactionInput[],
): ValidatorReturnType {
  yield* validateListConstraints(
    referenceInputs,
    'transaction_body.reference_inputs',
    false,
  )

  for (const [i, input] of referenceInputs.entries()) {
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

/**
 * Checks if a transaction contains pool registration certificate, if it does
 * runs a series of validators for pool registration transactions.
 */
function* validatePoolRegistrationTransaction(
  txBody: TransactionBody,
): ValidatorReturnType {
  // If the transaction doesn't contain pool registration certificates we can
  // skip all the validations.
  if (
    !txBody.certificates ||
    txBody.certificates.find(
      ({type}) => type === CertificateType.POOL_REGISTRATION,
    ) === undefined
  ) {
    return
  }

  yield* validate(
    txBody.certificates.length === 1,
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
    !txBody.withdrawals || txBody.withdrawals.length === 0,
    err(
      ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_WITHDRAWALS,
      'transaction_body.withdrawals',
    ),
  )
  // The same applies here, but mint has a nested array for the tokens that
  // needs to be checked in a similar way
  yield* validate(
    !txBody.mint ||
      txBody.mint.length === 0 ||
      txBody.mint.every(({tokens}) => tokens.length === 0),
    err(
      ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_MINT_ENTRY,
      'transaction_body.mint',
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
  yield* validateStakeCredentials(txBody.certificates, txBody.withdrawals)
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
  yield* validatePoolRegistrationTransaction(txBody)
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
