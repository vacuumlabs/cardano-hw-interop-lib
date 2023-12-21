import type {
  Amount,
  AUXILIARY_DATA_HASH_LENGTH,
  Datum,
  FixLenBuffer,
  Int,
  Multiasset,
  PoolRegistrationCertificate,
  ReferenceScript,
  Transaction,
  TransactionBody,
  TransactionOutput,
  Uint,
  Unparsed,
} from './types'
import {AmountType, CertificateType, DatumType, TxOutputFormat} from './types'
import {blake2b256, encodeToCbor, unreachable} from './utils'

const transformOptionalList = <T>(optionalList?: T[]): T[] | undefined =>
  optionalList?.length === 0 ? undefined : optionalList

const transformMultiasset = <T extends Int | Uint>(
  multiasset?: Multiasset<T>,
): Multiasset<T> | undefined =>
  multiasset === undefined
    ? undefined
    : transformOptionalList(
        multiasset
          .map(({policyId, tokens}) => ({
            policyId,
            tokens: transformOptionalList(tokens),
          }))
          .filter(({tokens}) => tokens !== undefined) as Multiasset<T>,
      )

const transformAmount = (amount: Amount): Amount => {
  switch (amount.type) {
    case AmountType.WITHOUT_MULTIASSET:
      return amount
    case AmountType.WITH_MULTIASSET: {
      // Applying the rule that outputs containing no multi-asset tokens
      // must be serialized as a simple tuple
      const multiasset = transformMultiasset(amount.multiasset)

      if (multiasset === undefined) {
        return {
          type: AmountType.WITHOUT_MULTIASSET,
          coin: amount.coin,
        }
      }

      return {
        type: AmountType.WITH_MULTIASSET,
        coin: amount.coin,
        multiasset,
      }
    }
    default:
      unreachable(amount)
  }
}

const transformDatum = (datum: Datum | undefined): Datum | undefined => {
  if (datum === undefined) return datum

  switch (datum.type) {
    case DatumType.HASH:
      return datum
    case DatumType.INLINE:
      if (datum.bytes.length === 0) {
        return undefined
      }
      return datum
    default:
      unreachable(datum)
  }
}

const transformReferenceScript = (
  referenceScript: ReferenceScript | undefined,
): ReferenceScript | undefined =>
  referenceScript === undefined
    ? undefined
    : referenceScript.length === 0
    ? undefined
    : referenceScript

const transformTxOutput = (output: TransactionOutput): TransactionOutput => {
  switch (output.format) {
    case TxOutputFormat.ARRAY_LEGACY:
      return {
        ...output,
        amount: transformAmount(output.amount),
      }
    case TxOutputFormat.MAP_BABBAGE:
      return {
        ...output,
        amount: transformAmount(output.amount),
        datum: transformDatum(output.datum),
        referenceScript: transformReferenceScript(output.referenceScript),
      }
    default:
      unreachable(output)
  }
}

/**
 * If the auxiliary data hash does not match the provided auxiliary data, it is replaced with the
 * correct hash. This is useful if the auxiliary data was reserialized canonically.
 * Some clients don't pass in auxiliary data along with the auxiliary data hash when signing the tx
 * (i.e. auxiliaryData is null). In such case, return the original hash (otherwise we would replace
 * the provided hash with a hash of undefined data).
 */
const transformAuxiliaryDataHash = (
  auxiliaryDataHash:
    | FixLenBuffer<typeof AUXILIARY_DATA_HASH_LENGTH>
    | undefined,
  auxiliaryData: Unparsed,
): FixLenBuffer<typeof AUXILIARY_DATA_HASH_LENGTH> | undefined =>
  auxiliaryData == null
    ? auxiliaryDataHash
    : blake2b256(encodeToCbor(auxiliaryData))

// Add 258 tags everywhere if at least one is present.
// In the future, when the tags are mandatory,
// we should add them everywhere even if not present.
export const makeSetTagsConsistent = (
  txBody: TransactionBody,
): TransactionBody => {
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
  if (tagIsPresent) {
    allSets.map((s) => {
      if (s !== undefined) {
        s.hasTag = true
      }
    })
  }
  return txBody
}

export const transformTxBody = (
  txBody: TransactionBody,
  auxiliaryData: Unparsed,
): TransactionBody => {
  const transformedBody = {
    ...txBody,
    outputs: txBody.outputs.map(transformTxOutput),
    withdrawals: transformOptionalList(txBody.withdrawals),
    auxiliaryDataHash: transformAuxiliaryDataHash(
      txBody.auxiliaryDataHash,
      auxiliaryData,
    ),
    collateralReturnOutput:
      txBody.collateralReturnOutput &&
      transformTxOutput(txBody.collateralReturnOutput),
    votingProcedures: transformOptionalList(txBody.votingProcedures),
  }
  return makeSetTagsConsistent(transformedBody)
}

export const transformTx = (tx: Transaction): Transaction => ({
  ...tx,
  body: transformTxBody(tx.body, tx.auxiliaryData),
})
