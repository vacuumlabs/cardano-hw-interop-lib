import type { Amount, Multiasset, RawTransaction, Transaction, TransactionBody, TransactionOutput } from './types'
import { AmountType } from './types'

const transformOptionalList = <T>(optionalList?: T[]): T[] | undefined =>
    optionalList?.length === 0 ? undefined : optionalList

const transformMultiasset = <T>(multiasset?: Multiasset<T>): Multiasset<T> | undefined =>
    multiasset === undefined ? undefined : transformOptionalList(
        multiasset
            .map(({policyId, tokens}) => ({policyId, tokens: transformOptionalList(tokens)}))
            .filter(({tokens}) => tokens !== undefined) as Multiasset<T>
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

const transformOutputs = (txOutputs: TransactionOutput[]): TransactionOutput[] =>
    txOutputs.map(({address, amount, datumHash}) => ({
        address,
        amount: transformAmount(amount),
        datumHash,
    }))

export const transformTxBody = (txBody: TransactionBody): TransactionBody => ({
    ...txBody,
    outputs: transformOutputs(txBody.outputs),
    certificates: transformOptionalList(txBody.certificates),
    withdrawals: transformOptionalList(txBody.withdrawals),
    collaterals: transformOptionalList(txBody.collaterals),
    requiredSigners: transformOptionalList(txBody.requiredSigners),
})

export const transformTx = (tx: Transaction): Transaction => ({
    ...tx,
    body: transformTxBody(tx.body),
})

export const transformRawTx = (rawTx: RawTransaction): RawTransaction => ({
    ...rawTx,
    body: transformTxBody(rawTx.body),
})
