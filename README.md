# Cardano HW Interoperability Library

JavaScript library to validate and transform Cardano transactions accroding to [CIP-0021](https://github.com/cardano-foundation/CIPs/blob/master/CIP-0021/CIP-0021.md).

## Available methods

The provided functions operate on either a:

- transaction body - only the transaction body as defined in the [CDDL](https://github.com/input-output-hk/cardano-ledger/blob/master/eras/alonzo/test-suite/cddl-files/alonzo.cddl#L50-L65)
- transaction - as defined in the [CDDL](https://github.com/input-output-hk/cardano-ledger/blob/master/eras/alonzo/test-suite/cddl-files/alonzo.cddl#L13-L18) or outputted by `cardano-cli transaction build-raw`

### `decode`

Parses a CBOR encoded input into a `TransactionBody` or `Transaction`, respectively. If the CBOR is malformed the parser will throw an error. Available methods:

```ts
decodeTxBody(txBodyCbor: Buffer) => TransactionBody
decodeTx(txCbor: Buffer) => Transaction
```

The `TransactionBody` object mostly follows the CDDL, but sometimes makes small deviations for better developer experience, such as parsing certain tuples as objects, or maps as arrays because working with maps is cumbersome in JavaScript.

When parsing a transaction, fields other than the transaction body are only decoded from CBOR and are not parsed according to the CDDL, in TypeScript they have type `unknown`.

### `encode`

Takes a `TransactionBody` or `Transaction` object and encodes it back to CBOR using canonical CBOR serialization format as specified in [Section 3.9 of CBOR RFC](https://datatracker.ietf.org/doc/html/rfc7049#section-3.9). Available methods:

```ts
encodeTxBody(txBody: TransactionBody) => Buffer
encodeTx(tx: Transaction) => Buffer
```

### `validate`

Takes a CBOR encoded input, validates it according to `CIP-0021` and returns an array of found validation errors.
The validation errors are of type `ValidationError` and we distinguish between _fixable_ and _unfixable_ errors. If the `validate` function reports:

- no _fixable_ and no _unfixable_ errors then the CBOR is already fully compliant with CIP-0021.
- only _fixable_ errors then a call to a `transform` function will solve the found errors and the _transcation_ will be compliant with CIP-0021.
- _unfixable_ errors then the library is not able to transform the CBOR by itself.

Available methods:

```ts
validateTxBody(txBodyCbor: Buffer) => ValidationError[]
validateTx(txCbor: Buffer) => ValidationError[]
```

The list of all possible validation errors can be found [here](./src/errors/validationError.ts)

### `transform`

Takes a `TransactionBody` or `Transaction` object and applies non-destructive transformations on it to fix fixable validation errors. Returns a new transformed object of the same type. Available methods:

```ts
transformTxBody(txBody: TransactionBody) => TransactionBody
transformTx(tx: Transaction) => Transaction
```

Note: the length of the resulting CBOR might be increased or decreased which might affect the minimum required fee. An increase in CBOR length should be very rare.
