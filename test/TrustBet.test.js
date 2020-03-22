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
const betValue = new BN('10')

// Actors
const [
    manager,
    trustee,
    bettorA,
    otherAccount,
] = accounts

// Array equality
const arrayEqual = (a, b) => {
    return !!a && !!b && !(a < b || b < a)
}

describe('TrustBet', async () => {
    beforeEach(async () => {
        this.TrustBet = await TrustBet.new()
    })

    context('deploy', async () => {
        it('deploys successfully', async () => {
            expect(this.TrustBet.address != null)
        })
    })

    context('create bet', async () => {
        it('new', async () => {
            const createBetTx = await this.TrustBet.createBet(
                betName,
                betDescription,
                betOptions,
                betValue,
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
                    value: betValue,
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

        beforeEach(async () => {
            await this.TrustBet.createBet(
                betName,
                betDescription,
                betOptions,
                betValue,
                trustee, {
                    from: manager,
                },
            )
        })

        it('manager can start the bet', async () => {
            const startBetTx = await this.TrustBet.startBet(
                betId, {
                    from: manager,
                },
            )

            expectEvent(
                startBetTx,
                'BetStarted', {
                    betId: betId,
                },
            )
        })

        it('nobody else can start the bet', async () => {
            await expectRevert(
                this.TrustBet.startBet(
                    betId, {
                        from: otherAccount,
                    },
                ),
                'Only the manager can start the bet',
            )
        })
    })

    context('accept bet', async () => {
        const betId = new BN('0')
        const bettorAOptionIndex = new BN('0')
        // const bettorBOption = 1;
        const nonExistentOptionIndex = new BN('999')
        const nonExistentBetId = new BN('999')

        beforeEach(async () => {
            await this.TrustBet.createBet(
                betName,
                betDescription,
                betOptions,
                betValue,
                trustee, {
                    from: manager,
                },
            )
        })

        it('accept bet', async () => {
            const acceptBetTx = await this.TrustBet.acceptBet(
                betId,
                bettorAOptionIndex, {
                    from: bettorA,
                    value: betValue,
                },
            )

            expectEvent(
                acceptBetTx,
                'BetAccepted', {
                    betId: betId,
                    bettor: bettorA,
                    optionIndex: bettorAOptionIndex,
                    value: betValue,
                },
            )
        })

        it('cannot accept non existent bet', async () => {
            await expectRevert(
                this.TrustBet.acceptBet(
                    nonExistentBetId,
                    bettorAOptionIndex,
                    {
                        from: bettorA,
                        value: betValue,
                    },
                ),
                'Bet does not exist',
            )
        })

        it('cannot accept non existent option', async () => {
            await expectRevert(
                this.TrustBet.acceptBet(
                    betId,
                    nonExistentOptionIndex,
                    {
                        from: bettorA,
                        value: betValue,
                    },
                ),
                'Option does not exist',
            )
        })

        it('cannot accept without sending the value', async () => {
            await expectRevert(
                this.TrustBet.acceptBet(
                    betId,
                    bettorAOptionIndex,
                    {
                        from: bettorA,
                        value: 0,
                    },
                ),
                'Sent value does not match bet value',
            )
        })

        it('same bettor cannot accept the same bet twice', async () => {
            await this.TrustBet.acceptBet(
                betId,
                bettorAOptionIndex,
                {
                    from: bettorA,
                    value: betValue,
                },
            )

            await expectRevert(
                this.TrustBet.acceptBet(
                    betId,
                    bettorAOptionIndex,
                    {
                        from: bettorA,
                        value: betValue,
                    },
                ),
                'Cannot accept the same bet twice',
            )
        })

        it('cannot accept after the bet started', async () => {
            await this.TrustBet.startBet(
                betId,
                {from:manager},
            )

            await expectRevert(
                this.TrustBet.acceptBet(
                    betId,
                    bettorAOptionIndex,
                    {
                        from: bettorA,
                        value: betValue,
                    }
                ),
                'Can only accept when bet is initialized',
            )
        })
        // closed
        // cancelled
    })

    // context('close bet', async () => {
    //     const betId = 0;

    //     beforeEach(async () => {
    //         await this.TrustBet.createBet(
    //             betName,
    //             betDescription,
    //             betOptions,
    //             trustee,
    //             {
    //                 from: manager,
    //             },
    //         )
    //     })

    //     it('manager can close the bet if all bettors posted results', async () => {
    //         await this.TrustBet.closeBet(
    //             betId
    //         )
    //     })
    // })
})
