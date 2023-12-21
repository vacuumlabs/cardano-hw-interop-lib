export enum ValidationErrorReason {
  // Unfixable validation errors
  UNSUPPORTED_TX_UPDATE = 'The transaction body entry update must not be included',
  UNSUPPORTED_TX_PROPOSAL_PROCEDURES = 'The transaction body entry proposal_procedures must not be included',
  UNSUPPORTED_CERTIFICATE_GENESIS_KEY_DELEGATION = 'Certificate of type genesis_key_delegation is not supported and must not be included',
  UNSUPPORTED_CERTIFICATE_MOVE_INSTANTANEOUS_REWARDS_CERT = 'Certificate of type move_instantaneous_rewards_cert is not supported and must not be included',
  UNSUPPORTED_CERTIFICATE_STAKE_VOTE_DELEG = 'Certificate of type stake_vote_deleg_cert is not supported and must not be included',
  UNSUPPORTED_CERTIFICATE_STAKE_REG_DELEG = 'Certificate of type stake_reg_deleg_cert is not supported and must not be included',
  UNSUPPORTED_CERTIFICATE_VOTE_REG_DELEG = 'Certificate of type vote_reg_deleg_cert is not supported and must not be included',
  UNSUPPORTED_CERTIFICATE_STAKE_VOTE_REG_DELEG = 'Certificate of type stake_vote_reg_deleg_cert is not supported and must not be included',
  INTEGER_NOT_INT64 = 'Hardware wallets support integers up to int64, integers from -2^63 to 2^63-1',
  UNSIGNED_INTEGER_NOT_UINT64 = 'Hardware wallets support unsigned integers up to uint64, unsigned integers from 0 to 2^64-1',
  NUMBER_OF_ELEMENTS_EXCEEDS_UINT16 = 'The number of transaction elements individually must not exceed UINT16_MAX, i.e. 65535',
  POOL_REGISTRATION_CERTIFICATE_WITH_OTHER_CERTIFICATES = 'If a transaction contains a pool registration certificate, then it must not contain any other certificate',
  POOL_REGISTRATION_CERTIFICATE_WITH_WITHDRAWALS = 'If a transaction contains a pool registration certificate, then it must not contain any withdrawal',
  POOL_REGISTRATION_CERTIFICATE_WITH_MINT_ENTRY = 'If a transaction contains a pool registration certificate, then it must not contain mint entry',
  POOL_REGISTRATION_CERTIFICATE_WITH_PLUTUS_OUTPUTS = 'If a transaction contains a pool registration certificate, then it must not contain datums and reference scripts in outputs',
  POOL_REGISTRATION_CERTIFICATE_WITH_SCRIPT_DATA_HASH = 'If a transaction contains a pool registration certificate, then it must not contain script data hash',
  POOL_REGISTRATION_CERTIFICATE_WITH_COLLATERAL_INPUTS = 'If a transaction contains a pool registration certificate, then it must not contain collateral inputs',
  POOL_REGISTRATION_CERTIFICATE_WITH_REQUIRED_SIGNERS = 'If a transaction contains a pool registration certificate, then it must not contain required signers',
  POOL_REGISTRATION_CERTIFICATE_WITH_COLLATERAL_RETURN_OUTPUT = 'If a transaction contains a pool registration certificate, then it must not contain collateral return output',
  POOL_REGISTRATION_CERTIFICATE_WITH_TOTAL_COLLATERAL = 'If a transaction contains a pool registration certificate, then it must not contain total collateral',
  POOL_REGISTRATION_CERTIFICATE_WITH_REFERENCE_INPUTS = 'If a transaction contains a pool registration certificate, then it must not contain reference inputs',
  POOL_REGISTRATION_CERTIFICATE_WITH_VOTING_PROCEDURES = 'If a transaction contains a pool registration certificate, then it must not contain voting procedures',
  POOL_REGISTRATION_CERTIFICATE_WITH_TREASURY = 'If a transaction contains a pool registration certificate, then it must not contain treasury value entry',
  POOL_REGISTRATION_CERTIFICATE_WITH_DONATION = 'If a transaction contains a pool registration certificate, then it must not contain treasury donation entry',
  TOO_MANY_VOTERS_IN_VOTING_PROCEDURES = 'Only a single voter is allowed in voting procedures',
  INVALID_NUMBER_OF_VOTING_PROCEDURES = 'There must be exactly one voting procedure per voter',

  // Fixable validation errors
  CBOR_IS_NOT_CANONICAL = 'CBOR is not canonical',
  OPTIONAL_EMPTY_LISTS_AND_MAPS_MUST_NOT_BE_INCLUDED = 'Optional empty lists and maps must not be included as part of the transaction body or its elements',
  OUTPUT_AMOUNT_WITHOUT_TOKENS_MUST_NOT_BE_A_TUPLE = 'Output amount (value) without tokens must not be a tuple',
  INLINE_DATUM_MUST_NOT_BE_EMPTY_IF_DEFINED = 'Inline datum must not be empty if defined',
  REFERENCE_SCRIPT_MUST_NOT_BE_EMPTY_IF_DEFINED = 'Reference script must not be empty if defined',
  COLLATERAL_RETURN_MUST_NOT_CONTAIN_DATUM = 'Collateral return must not contain datum',
  COLLATERAL_RETURN_MUST_NOT_CONTAIN_REFERENCE_SCRIPT = 'Collateral return must not contain reference script',
  TX_INCONSISTENT_SET_TAGS = 'Inconsistent set tags 258 across the transaction body',
}

const FIXABLE = true
const UNFIXABLE = false

const validationErrorFixability: Record<ValidationErrorReason, boolean> = {
  // unfixable
  [ValidationErrorReason.UNSUPPORTED_TX_UPDATE]: UNFIXABLE,
  [ValidationErrorReason.UNSUPPORTED_TX_PROPOSAL_PROCEDURES]: UNFIXABLE,
  [ValidationErrorReason.UNSUPPORTED_CERTIFICATE_GENESIS_KEY_DELEGATION]:
    UNFIXABLE,
  [ValidationErrorReason.UNSUPPORTED_CERTIFICATE_MOVE_INSTANTANEOUS_REWARDS_CERT]:
    UNFIXABLE,
  [ValidationErrorReason.UNSUPPORTED_CERTIFICATE_STAKE_VOTE_DELEG]: UNFIXABLE,
  [ValidationErrorReason.UNSUPPORTED_CERTIFICATE_STAKE_REG_DELEG]: UNFIXABLE,
  [ValidationErrorReason.UNSUPPORTED_CERTIFICATE_VOTE_REG_DELEG]: UNFIXABLE,
  [ValidationErrorReason.UNSUPPORTED_CERTIFICATE_STAKE_VOTE_REG_DELEG]:
    UNFIXABLE,
  [ValidationErrorReason.INTEGER_NOT_INT64]: UNFIXABLE,
  [ValidationErrorReason.UNSIGNED_INTEGER_NOT_UINT64]: UNFIXABLE,
  [ValidationErrorReason.NUMBER_OF_ELEMENTS_EXCEEDS_UINT16]: UNFIXABLE,
  [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_OTHER_CERTIFICATES]:
    UNFIXABLE,
  [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_WITHDRAWALS]:
    UNFIXABLE,
  [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_MINT_ENTRY]:
    UNFIXABLE,
  [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_PLUTUS_OUTPUTS]:
    UNFIXABLE,
  [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_SCRIPT_DATA_HASH]:
    UNFIXABLE,
  [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_COLLATERAL_INPUTS]:
    UNFIXABLE,
  [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_REQUIRED_SIGNERS]:
    UNFIXABLE,
  [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_COLLATERAL_RETURN_OUTPUT]:
    UNFIXABLE,
  [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_TOTAL_COLLATERAL]:
    UNFIXABLE,
  [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_REFERENCE_INPUTS]:
    UNFIXABLE,
  [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_VOTING_PROCEDURES]:
    UNFIXABLE,
  [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_TREASURY]:
    UNFIXABLE,
  [ValidationErrorReason.POOL_REGISTRATION_CERTIFICATE_WITH_DONATION]:
    UNFIXABLE,
  [ValidationErrorReason.TOO_MANY_VOTERS_IN_VOTING_PROCEDURES]: UNFIXABLE,
  [ValidationErrorReason.INVALID_NUMBER_OF_VOTING_PROCEDURES]: UNFIXABLE,

  // fixable
  [ValidationErrorReason.CBOR_IS_NOT_CANONICAL]: FIXABLE,
  [ValidationErrorReason.OPTIONAL_EMPTY_LISTS_AND_MAPS_MUST_NOT_BE_INCLUDED]:
    FIXABLE,
  [ValidationErrorReason.OUTPUT_AMOUNT_WITHOUT_TOKENS_MUST_NOT_BE_A_TUPLE]:
    FIXABLE,
  [ValidationErrorReason.INLINE_DATUM_MUST_NOT_BE_EMPTY_IF_DEFINED]: FIXABLE,
  [ValidationErrorReason.REFERENCE_SCRIPT_MUST_NOT_BE_EMPTY_IF_DEFINED]:
    FIXABLE,
  [ValidationErrorReason.COLLATERAL_RETURN_MUST_NOT_CONTAIN_DATUM]: FIXABLE,
  [ValidationErrorReason.COLLATERAL_RETURN_MUST_NOT_CONTAIN_REFERENCE_SCRIPT]:
    FIXABLE,
  [ValidationErrorReason.TX_INCONSISTENT_SET_TAGS]: FIXABLE,
}

export type ValidationError = {
  fixable: boolean
  reason: ValidationErrorReason
  position: string
}

/**
 * Constructs a `ValidationError`, automatically determines the fixability
 * based on the provided `ValidationErrorReason`
 */
export const err = (
  reason: ValidationErrorReason,
  position: string,
): ValidationError => ({
  fixable: validationErrorFixability[reason],
  reason,
  position,
})
