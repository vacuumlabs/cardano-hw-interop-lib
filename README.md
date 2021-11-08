# cardano-hw-interoperability-lib

JavaScript library to validate and transform Cardano transactions accroding to [CIP-0021](https://github.com/cardano-foundation/CIPs/blob/master/CIP-0021/CIP-0021.md).

## Available methods

The provided functions operate on either a:
* transaction body - only the transaction body as defined in the [shelley-ma.cddl#49](https://github.com/input-output-hk/cardano-ledger/blob/master/eras/shelley-ma/test-suite/cddl-files/shelley-ma.cddl#L49)
* signed transaction - transaction as defined in the [shelley-ma.cddl#13](https://github.com/input-output-hk/cardano-ledger/blob/master/eras/shelley-ma/test-suite/cddl-files/shelley-ma.cddl#L13)
* raw transaction - transaction outputed by `cardano-cli transaction build-raw`

we will refer to them collectively as a *transaction*.

### `parse`
Parses a CBOR encoded *transaction* into a Transaction object. If the CBOR is malformed the parser will throw an error. Available methods:
```ts
parseTxBody(txBodyCbor: Buffer) => TransactionBody
parseSignedTx(signedTxCbor: Buffer) => SignedTransaction
parseRawTx(rawTxCbor: Buffer) => RawTransaction
```
When parsing a signed/raw transaction fields other than the transaction body are only decoded from CBOR and are not parsed according to the CDDL, in TypeScript they have type `unknown`.

The `TransactionBody` object mostly follows the CDDL, but sometimes makes small deviations for better DX, such as parsing certain tuples as objects, or maps as arrays because working with maps is cumbersome in JavaScript.

### `encode`
Takes a Transaction object and encodes it back to CBOR using canonical CBOR serialization format as specified in [Section 3.9 of CBOR RFC](https://datatracker.ietf.org/doc/html/rfc7049#section-3.9). Available methods:
```ts
encodeTxBody(txBody: TransactionBody) => Buffer
encodeSignedTx(signedTx: SignedTransaction) => Buffer
encodeRawTx(rawTx: RawTransaction) => Buffer
```

### `validate`
Takes a CBOR encoded *transaction*, validates it according to `CIP-0021` and returns an array of found validation errors.
The validation errors are of type `ValidationError` and we distinguish between *fixable* and *unfixable* errors. If the `validate` function reports:
* no *fixable* and no *unfixable* errors then the CBOR is already fully compliant with CIP-0021.
* only *fixable* errors then a call to a `transform` function will solve the found errors and the *transcation* will be compliant with CIP-0021.
* *unfixable* errors then the library is not able to transform the CBOR by itself.

Available methods:
```ts
validateTxBody(txBodyCbor: Buffer) => ValidationError[]
validateSignedTx(signedTxCbor: Buffer) => ValidationError[]
validateRawTx(rawTxCbor: Buffer) => ValidationError[]
```

The list of all possible validation errors can be found [here](./src/errors/validationError.ts)

### `transform`
Takes a Transaction object and applies non-destructive transformations on it to fix fixable validation errors. Returns a new transformed Transaction object. Available methods:
```ts
transformTxBody(txBody: TransactionBody) => TransactionBody
transformSignedTx(signedTx: SignedTransaction) => SignedTransaction
transformRawTx(rawTx: RawTransaction) => RawTransaction
```

