export enum ValidationErrorReason {
    // Unfixable validation errors
    UNSUPPORTED_TX_UPDATE = 'The transaction body entry update must not be included',
    UNSUPPORTED_CERTIFICATE_GENESIS_KEY_DELEGATION = 'Certificate of type genesis_key_delegation is not supported and must not be included',
    UNSUPPORTED_CERTIFICATE_MOVE_INSTANTANEOUS_REWARDS_CERT = 'Certificate of type move_instantaneous_rewards_cert is not supported and must not be included',
    INTEGER_NOT_INT64 = 'Hardware wallets support integers up to int64, integers from -2^63 to 2^63-1',
    UNSIGNED_INTEGER_NOT_UINT64 = 'Hardware wallets support unsigned integers up to uint64, unsigned integers from 0 to 2^64-1',
    NUMBER_OF_ELEMENTS_EXCEEDS_UINT16 = 'The number of transaction elements individually must not exceed UINT16_MAX, i.e. 65535',
    CERTIFICATES_MUST_HAVE_THE_SAME_TYPE_OF_STAKE_CREDENTIAL = 'All certificates included in a transaction must have the same type of stake credential',
    WITHDRAWALS_MUST_HAVE_THE_SAME_TYPE_OF_STAKE_CREDENTIAL = 'All withdrawals included in a transaction must have the same type of stake credential',
    CERTIFICATES_AND_WITHDRAWALS_STAKE_CREDENTIAL_TYPES_MUST_BE_CONSISTENT = 'The stake credential type of certificates must be consistent with the type used for withdrawals',
    POOL_REGISTRATION_CERTIFICATE_WITH_OTHER_CERTIFICATES = 'If a transaction contains a pool registration certificate, then it must not contain any other certificate',
    POOL_REGISTRATION_CERTIFICATE_WITH_WITHDRAWALS = 'If a transaction contains a pool registration certificate, then it must not contain any withdrawal',
    POOL_REGISTRATION_CERTIFICATE_WITH_MINT_ENTRY = 'If a transaction contains a pool registration certificate, then it must not contain mint entry',

    // Fixable validation errors
    CBOR_IS_NOT_CANONICAL = 'CBOR is not canonical',
    OPTIONAL_EMPTY_LISTS_AND_MAPS_MUST_NOT_BE_INCLUDED = 'Optional empty lists and maps must not be included as part of the transaction body or its elements',
    OUTPUT_AMOUNT_WITHOUT_TOKENS_MUST_NOT_BE_A_TUPLE = 'Output amount (value) without tokens must not be a tuple',
    INLINE_DATUM_MUST_NOT_BE_EMPTY_IF_DEFINED = 'Inline datum must not be empty if defined',
    REFERENCE_SCRIPT_MUST_NOT_BE_EMPTY_IF_DEFINED = 'Reference script must not be empty if defined',
    COLLATERAL_RETURN_MUST_NOT_CONTAIN_DATUM = 'Collateral return must not contain datum',
    COLLATERAL_RETURN_MUST_NOT_CONTAIN_REFERENCE_SCRIPT = 'Collateral return must not contain reference script',
}

const FIXABLE = true
const UNFIXABLE = false

const validationErrorFixability: Record<ValidationErrorReason, boolean> = {
    [ValidationErrorReason.UNSUPPORTED_TX_UPDATE]: UNFIXABLE,
    [ValidationErrorReason.UNSUPPORTED_CERTIFICATE_GENESIS_KEY_DELEGATION]: UNFIXABLE,
    [ValidationErrorReason.UNSUPPORTED_CERTIFICATE_MOVE_INSTANTANEOUS_REWARDS_CERT]: UNFIXABLE,
    [ValidationErrorReason.INTEGER_NOT_INT64]: UNFIXABLE,
    [ValidationErrorReason.UNSIGNED_INTEGER_NOT_UINT64]: UNFIXABLE,
    [ValidationErrorReason.NUMBER_OF_ELEMENTS_EXCEEDS_UINT16]: UNFIXABLE,
    [ValidationErrorReason.CERTIFICATES_MUST_HAVE_THE_SAME_TYPE_OF_STAKE_CREDENTIAL]: UNFIXABLE,
    [ValidationErrorReason.WITHDRAWALS_MUST_HAVE_THE_SAME_TYPE_OF_STAKE_CREDENTIAL]: UNFIXABLE,
    [ValidationErrorReason.CERTIFICATES_AND_WITHDRAWALS_STAKE_CREDENTIAL_TYPES_MUST_BE_CONSISTENT]: UNFIXABLE,
    [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_OTHER_CERTIFICATES]: UNFIXABLE,
    [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_WITHDRAWALS]: UNFIXABLE,
    [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_MINT_ENTRY]: UNFIXABLE,
    [ValidationErrorReason.CBOR_IS_NOT_CANONICAL]: FIXABLE,
    [ValidationErrorReason.OPTIONAL_EMPTY_LISTS_AND_MAPS_MUST_NOT_BE_INCLUDED]: FIXABLE,
    [ValidationErrorReason.OUTPUT_AMOUNT_WITHOUT_TOKENS_MUST_NOT_BE_A_TUPLE]: FIXABLE,
    [ValidationErrorReason.INLINE_DATUM_MUST_NOT_BE_EMPTY_IF_DEFINED]: FIXABLE,
    [ValidationErrorReason.REFERENCE_SCRIPT_MUST_NOT_BE_EMPTY_IF_DEFINED]: FIXABLE,
    [ValidationErrorReason.COLLATERAL_RETURN_MUST_NOT_CONTAIN_DATUM]: FIXABLE,
    [ValidationErrorReason.COLLATERAL_RETURN_MUST_NOT_CONTAIN_REFERENCE_SCRIPT]: FIXABLE,
}

export type ValidationError = {
    fixable: boolean,
    reason: ValidationErrorReason,
    position: string,
}

/**
 * Constructs a `ValidationError`, automatically determines the fixability
 * based on the provided `ValidationErrorReason`
 */
export const err = (reason: ValidationErrorReason, position: string): ValidationError => ({
    fixable: validationErrorFixability[reason],
    reason,
    position,
})
