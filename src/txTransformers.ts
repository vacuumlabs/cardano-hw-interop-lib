import type {
  Amount,
  AUXILIARY_DATA_HASH_LENGTH,
  Datum,
  FixlenBuffer,
  Multiasset,
  RawTransaction,
  ReferenceScript,
  Transaction,
  TransactionBody,
  TransactionOutput,
} from './types'
import { AmountType, DatumType, TxOutputFormat } from './types'
import { blake2b256, encodeToCbor } from './utils'

const transformOptionalList = <T>(optionalList?: T[]): T[] | undefined =>
  optionalList?.length === 0 ? undefined : optionalList

const transformMultiasset = <T>(
  multiasset?: Multiasset<T>,
): Multiasset<T> | undefined =>
  multiasset === undefined
    ? undefined
    : transformOptionalList(
        multiasset
          .map(({ policyId, tokens }) => ({
            policyId,
            tokens: transformOptionalList(tokens),
          }))
          .filter(({ tokens }) => tokens !== undefined) as Multiasset<T>,
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
  }
}

const transformAuxiliaryDataHash = (
  auxiliaryData: unknown | undefined,
): FixlenBuffer<typeof AUXILIARY_DATA_HASH_LENGTH> | undefined =>
  auxiliaryData ? blake2b256(encodeToCbor(auxiliaryData)) : undefined

export const transformTxBody = (
  txBody: TransactionBody,
  auxiliaryData: unknown,
): TransactionBody => ({
  ...txBody,
  outputs: txBody.outputs.map(transformTxOutput),
  certificates: transformOptionalList(txBody.certificates),
  withdrawals: transformOptionalList(txBody.withdrawals),
  collateralInputs: transformOptionalList(txBody.collateralInputs),
  requiredSigners: transformOptionalList(txBody.requiredSigners),
  collateralReturnOutput:
    txBody.collateralReturnOutput &&
    transformTxOutput(txBody.collateralReturnOutput),
  referenceInputs: transformOptionalList(txBody.referenceInputs),
  auxiliaryDataHash: transformAuxiliaryDataHash(auxiliaryData),
})

export const transformTx = (tx: Transaction): Transaction => ({
  ...tx,
  body: transformTxBody(tx.body, tx.auxiliaryData),
})

export const transformRawTx = (rawTx: RawTransaction): RawTransaction => ({
  ...rawTx,
  body: transformTxBody(rawTx.body, rawTx.auxiliaryData),
})
