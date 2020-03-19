const {
    accounts,
    contract
} = require('@openzeppelin/test-environment')

const {
    expect
} = require('chai')

const {
    BN,
    expectEvent,
} = require("@openzeppelin/test-helpers")

const TrustBet = contract.fromArtifact('TrustBet')

// Bet definition
const betDescription = "What is the answer to life the universe and everything?"
const betOptions = [
    "42",
    "No answer",
    "0"
]

// Actors
const [
    trustee
] = accounts

// Array equality
let array_equal = (a, b) => {
    return !!a && !!b && !(a < b || b < a);
}

describe('TrustBet', async () => {
    it('passes the test', async () => {
        expect(true)
    })

    beforeEach(async () => {
        this.TrustBet = await TrustBet.new()
    })

    context('deploy contract', async () => {
        it('deploys the contract', async () => {
            expect(this.TrustBet.address != null)
        })
    })

    context('bet', async () => {
        it('creates new bet', async () => {
            const createBetTx = await this.TrustBet.createBet(
                betDescription,
                betOptions,
                trustee
            )


            expectEvent(
                createBetTx,
                'CreatedBet', {
                    betId: new BN('0'),
                    description: betDescription,
                    // Array equality is broken in JavaScript, the check is done below
                    // options: betOptions,
                    trustee: trustee,
                },
            )

            expect(array_equal(betOptions, createBetTx.logs[0].args.options), "bet options should match").to.be.true

        })
    })
})
