import cbor from 'cbor'

export const decodeCbor = (buffer: Buffer) => cbor.decode(buffer, {
    preventDuplicateKeys: true,
    tags: {
        // Specifies that tag 30 should be parsed only as a tuple. For example
        // the CDDL specifies unit_interval as:
        // unit_interval = #6.30([uint, uint])
        30: (v: any) => {
            if (!Array.isArray(v) || v.length != 2) {
                throw new Error('Invalid tuple')
            }
            return v
        },
    },
})

export const encodeToCbor = (x: any) => cbor.encodeOne(x, {canonical: true})

