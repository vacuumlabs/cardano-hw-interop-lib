import type { ValidationError } from './errors'
import { err, ValidationErrorReason } from './errors'
import type { Certificate, Collateral, Int, Mint, Multiasset, RequiredSigner, StakeCredentialType, StakeDelegationCertificate, StakeDeregistrationCertificate, StakeRegistrationCertificate, TransactionBody, TransactionInput, TransactionOutput, Uint, Withdrawal } from './types'
import { AmountType, CertificateType } from './types'
import { bind, getRewardAccountStakeCredentialType } from './utils'

const UINT16_MAX = 65535
const MAX_UINT_64_STR = "18446744073709551615"
const MIN_INT_64_STR = "-9223372036854775808"
const MAX_INT_64_STR = "9223372036854775807"

type ValidatorReturnType = Generator<ValidationError>

/**
 * Validate the given `cond` yielding the `err` if validation fails
 *
 * @yields ValidationError if the `cond` is false
 */
function *validate(cond: boolean, err: ValidationError): ValidatorReturnType {
    if (!cond) yield err
}

/**
 * Runs the given validator only if the provided value is not null or undefined
 */
function *validateOptional<T>(x: T | undefined | null, validateFn: (x: T) => ValidatorReturnType): ValidatorReturnType {
    x === undefined || x === null ? x : yield* validateFn(x)
}

/**
 * Validates a list according to the constraints in CIP-0021:
 *  * an empty list is not accepted and must not be included
 *  * the length of a list must not exceed `UINT16_MAX`, i.e. 65535
 */
function *validateListConstraints(list: any[], position: string): ValidatorReturnType {
    yield* validate(list.length > 0, err(ValidationErrorReason.OPTIONAL_EMPTY_LISTS_AND_MAPS_MUST_NOT_BE_INCLUDED, position))
    yield* validate(list.length <= UINT16_MAX, err(ValidationErrorReason.NUMBER_OF_ELEMENTS_EXCEEDS_UINT16, position))
}

const validateUint64 = (n: Uint, position: string) =>
    validate(n >= 0 && n <= BigInt(MAX_UINT_64_STR), err(ValidationErrorReason.UNSIGNED_INTEGER_NOT_UINT64, position))

const validateInt64 = (n: Int, position: string) =>
    validate(n >= BigInt(MIN_INT_64_STR) && n <= BigInt(MAX_INT_64_STR), err(ValidationErrorReason.INTEGER_NOT_INT64, position))

function *validateTxInputs(txInputs: TransactionInput[]): ValidatorReturnType {
    yield* validateListConstraints(txInputs, 'transaction_body.inputs')

    for (const [index, input] of txInputs.entries()) {
        yield* validateUint64(input.index, `transaction_body.inputs[${index}].index`)
    }
}

function *validateMultiasset<T>(multiasset: Multiasset<T>, validateAmount: (n: T, position: string) => ValidatorReturnType, position: string): ValidatorReturnType {
    yield* validateListConstraints(multiasset, position)

    for (const {policyId, tokens} of multiasset) {
        yield* validateListConstraints(tokens, `${position}[${policyId.toString('hex')}]`)

        for (const {assetName, amount} of tokens) {
            yield* validateAmount(amount, `${position}[${policyId.toString('hex')}][${assetName.toString('hex')}]`)
        }
    }
}

function *validateTxOutputs(txOutputs: TransactionOutput[]): ValidatorReturnType {
    yield* validateListConstraints(txOutputs, 'transaction_body.outputs')

    for (const [index, {amount}] of txOutputs.entries()) {
        switch (amount.type) {
        case AmountType.WITHOUT_MULTIASSET:
            yield* validateUint64(amount.coin, `transaction_body.outputs[${index}].amount`)
            break
        case AmountType.WITH_MULTIASSET:
            yield* validateUint64(amount.coin, `transaction_body.outputs[${index}].amount`)
            // Although this check is also preformed by the `validateMultiasset`
            // function, this is a very specific check for the output format
            // that it is okay that they are defacto preformed twice with
            // different ValidationErrors, and both errors are marked as fixable
            yield* validate(amount.multiasset.length > 0, err(ValidationErrorReason.OUTPUT_WITHOUT_TOKENS_MUST_BE_A_SIMPLE_TUPLE, `transaction_body.outputs[${index}].amount`))
            yield* validateMultiasset(amount.multiasset, validateUint64, `transaction_body.ouputs[${index}]`)
            break
        }
    }
}

function *validateCertificates(certificates: Certificate[]): ValidatorReturnType {
    yield* validateListConstraints(certificates, 'transaction_body.certificates')

    for (const [index, certificate] of certificates.entries()) {
        switch (certificate.type) {
        case CertificateType.POOL_REGISTRATION:
            yield* validateUint64(certificate.poolParams.pledge, `transaction_body.certificates[${index}].pool_params.pledge`)
            yield* validateUint64(certificate.poolParams.cost, `transaction_body.certificates[${index}].pool_params.cost`)
            yield* validateUint64(certificate.poolParams.margin[0], `transaction_body.certificates[${index}].pool_params.margin[0]`)
            yield* validateUint64(certificate.poolParams.margin[1], `transaction_body.certificates[${index}].pool_params.margin[1]`)
            break
        case CertificateType.POOL_RETIREMENT:
            yield* validateUint64(certificate.epoch, `transaction_body.certificates[${index}].epoch`)
            break
        case CertificateType.GENESIS_KEY_DELEGATION:
            yield* validate(false, err(ValidationErrorReason.UNSUPPORTED_CERTIFICATE_GENESIS_KEY_DELEGATION, `transaction_body.certificates[${index}]`))
            break
        case CertificateType.MOVE_INSTANTANEOUS_REWARDS_CERT:
            yield* validate(false, err(ValidationErrorReason.UNSUPPORTED_CERTIFICATE_MOVE_INSTANTANEOUS_REWARDS_CERT, `transaction_body.certificates[${index}]`))
            break
        default:
            break
        }
    }
}

function *validateWithdrawals(withdrawals: Withdrawal[]): ValidatorReturnType {
    yield* validateListConstraints(withdrawals, 'transaction_body.withdrawals')

    for (const {rewardAccount, amount} of withdrawals) {
        yield* validateUint64(amount, `transaction_body.withdrawals[${rewardAccount.toString('hex')}]`)
    }
}

function *validateStakeCredentials(certificates: Certificate[] | undefined, withdrawals: Withdrawal[] | undefined): ValidatorReturnType {
    const certificateStakeCredentialTypes: Set<StakeCredentialType> = new Set()
    const withdrawalStakeCredentialTypes: Set<StakeCredentialType> = new Set()

    if (certificates) {
        // We must first filter out the certificates that contain stake credentials
        const certificatesWithStakeCredentials = certificates.filter(({type}) => (
            type === CertificateType.STAKE_REGISTRATION
            || type === CertificateType.STAKE_DEREGISTRATION
            || type === CertificateType.STAKE_DELEGATION
        )) as (StakeRegistrationCertificate | StakeDeregistrationCertificate | StakeDelegationCertificate)[]
        certificatesWithStakeCredentials.forEach(({stakeCredential}) => certificateStakeCredentialTypes.add(stakeCredential.type))
        // We check the set of stake credential types to be less or equal to one,
        // because if there are 0 types it means there were no certificates with
        // stake credentials which is possible and it shouldn't trigger this error
        yield* validate(certificateStakeCredentialTypes.size <= 1, err(ValidationErrorReason.WITHDRAWALS_MUST_HAVE_THE_SAME_TYPE_OF_STAKE_CREDENTIAL, 'transaction_body.certificates'))
    }

    if (withdrawals) {
        withdrawals.forEach(({rewardAccount}) => withdrawalStakeCredentialTypes.add(getRewardAccountStakeCredentialType(rewardAccount)))
        // Here we also check the number of stake credential types to be less or
        // equal to one, because we could have been dealing with an empty array
        // and that's a ValidationError that is caught elsewhere and shouldn't
        // be caught by this check
        yield* validate(withdrawalStakeCredentialTypes.size <= 1, err(ValidationErrorReason.WITHDRAWALS_MUST_HAVE_THE_SAME_TYPE_OF_STAKE_CREDENTIAL, 'transaction_body.withdrawals'))
    }

    if (certificateStakeCredentialTypes.size === 1 && withdrawalStakeCredentialTypes.size === 1) {
        // We only trigger this check if both certificates and withdrawals have
        // consistent stake credential types otherwise it is useless to check
        // whether they are consistent in respect to each other.
        yield* validate([...certificateStakeCredentialTypes][0] === [...withdrawalStakeCredentialTypes][0], err(ValidationErrorReason.CERTIFICATES_AND_WITHDRAWALS_STAKE_CREDENTIAL_TYPES_MUST_BE_CONSISTENT, 'transaction_body'))
    }
}

const validateMint = (mint: Mint) => validateMultiasset(mint, validateInt64, 'transaction_body.mint')

function *validateCollaterals(txCollaterals: Collateral[]): ValidatorReturnType {
    yield* validateListConstraints(txCollaterals, 'transaction_body.collaterals')

    for (const [index, collateral] of txCollaterals.entries()) {
        yield* validateUint64(collateral.index, `transaction_body.collaterals[${index}].index`)
    }
}

function *validateRequiredSigners(txRequiredSigners: RequiredSigner[]): ValidatorReturnType {
    yield* validateListConstraints(txRequiredSigners, 'transaction_body.required_signers')
}

/**
 * Checks if a transaction contains pool registration certificate, if it does
 * runs a series of validators for pool registration transactions.
 */
function *validatePoolRegistrationTransaction(txBody: TransactionBody): ValidatorReturnType {
    // If the transaction doesn't contain pool registration certificates we can
    // skip all the validations.
    if (!txBody.certificates || txBody.certificates.find(({type}) => type === CertificateType.POOL_REGISTRATION) === undefined) {
        return
    }

    yield* validate(txBody.certificates.length === 1, err(ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_OTHER_CERTIFICATES, 'transaction_body.certificates'))
    // We consider the transaction to have no withdrawals if the field is not
    // present or if the array length is 0. Checking only whether the field is
    // not present is not sufficient because the transaction could contain an
    // empty array which is a fixable error but it would fail this validation,
    // which is not fixable. This could lead to a scenario where a potentionally
    // fixable transaction would have an unfixable validation error reported.
    yield* validate(!txBody.withdrawals || txBody.withdrawals.length === 0, err(ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_WITHDRAWALS, 'transaction_body.withdrawals'))
    // The same applies here, but mint has a nested array for the tokens that
    // needs to be checked in a similar way
    yield* validate(!txBody.mint || txBody.mint.length === 0 || txBody.mint.every(({tokens}) => tokens.length === 0), err(ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_MINT_ENTRY, 'transaction_body.mint') )
}

function *validateTxBody(txBody: TransactionBody): ValidatorReturnType {
    yield* validateTxInputs(txBody.inputs)
    yield* validateTxOutputs(txBody.outputs)
    yield* validateUint64(txBody.fee, 'transaction_body.fee')
    yield* validateOptional(txBody.ttl, bind(validateUint64, 'transaction_body.ttl'))
    yield* validateOptional(txBody.certificates, validateCertificates)
    yield* validateOptional(txBody.withdrawals, validateWithdrawals)
    yield* validateStakeCredentials(txBody.certificates, txBody.withdrawals)
    yield* validate(txBody.update === undefined, err(ValidationErrorReason.UNSUPPORTED_TX_UPDATE, 'transaction_body.update'))
    yield* validateOptional(txBody.validityIntervalStart, bind(validateUint64, 'transaction_body.validity_interval_start'))
    yield* validateOptional(txBody.mint, validateMint)
    yield* validateOptional(txBody.collaterals, validateCollaterals)
    yield* validateOptional(txBody.requiredSigners, validateRequiredSigners)
    yield* validateOptional(txBody.networkId, bind(validateUint64, 'transaction_body.network_id'))
    yield* validatePoolRegistrationTransaction(txBody)
}

/**
 * Runs a series of validators against the given input, returning all the
 * validation errors found.
 */
export const validateTxCommon = (inputCbor: Buffer, canonicalCbor: Buffer, txBody: TransactionBody): ValidationError[] => ([
    // Collect the errors from all the validations
    ...validate(inputCbor.equals(canonicalCbor), err(ValidationErrorReason.CBOR_IS_NOT_CANONICAL, 'transaction')),
    ...validateTxBody(txBody),
])
