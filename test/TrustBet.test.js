const {
    accounts,
    contract,
} = require('@openzeppelin/test-environment')

const {
    expect,
} = require('chai')

const {
    BN,
    expectEvent,
    expectRevert,
} = require('@openzeppelin/test-helpers')

const TrustBet = contract.fromArtifact('TrustBet')

// Bet definition
const betName = 'The answer to life'
const betDescription = 'What is the answer to life the universe and everything?'
const betOptions = [
    '42',
    'No answer',
    '0',
]

// Actors
const [
    manager,
    trustee,
    otherAccount,
] = accounts

// Array equality
const arrayEqual = (a, b) => {
    return !!a && !!b && !(a < b || b < a)
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

    context('create bet', async () => {
        it('new', async () => {
            const createBetTx = await this.TrustBet.createBet(
                betName,
                betDescription,
                betOptions,
                trustee,
            )

            expectEvent(
                createBetTx,
                'CreatedBet', {
                    betId: new BN('0'),
                    name: betName,
                    description: betDescription,
                    // Array equality is broken in JavaScript, the check is done below
                    // options: betOptions,
                    trustee: trustee,
                },
            )

            // HACK: Check option equality
            expect(
                arrayEqual(betOptions, createBetTx.logs[0].args.options),
                'bet options should match',
            ).to.be.equal(true)
        })
    })

    context('start bet', async () => {
        const betId = new BN('0')

        beforeEach(() => {
            this.TrustBet.createBet(
                betName,
                betDescription,
                betOptions,
                trustee,
                {
                    from: manager,
                },
            )
        })

        it('the manager can start the bet', async () => {
            const startBetTx = await this.TrustBet.startBet(
                betId, { from: manager }
            );

            expectEvent(
                startBetTx,
                'BetStarted',
                {
                    betId: betId,
                },
            )
        })

        it('nobody else can start the bet', async () => {
            await expectRevert(
                this.TrustBet.startBet(
                    betId, {from: otherAccount}
                ),
                'Only the manager can start the bet'
            )
        })
    })
})
