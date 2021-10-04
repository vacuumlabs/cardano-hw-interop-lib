import { expect } from "chai"

import { foo } from "../src/index"

describe("Example test", () => {
    it("Foo should return bar", () => {
        expect(foo()).to.equal("bar")
    })
})
