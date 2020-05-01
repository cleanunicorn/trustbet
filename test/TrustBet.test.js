const {
    BN,
    expectEvent,
    expectRevert,
} = require('@openzeppelin/test-helpers')

const TrustBet = artifacts.require('TrustBet')

// Bet definition
const betName = 'The answer to life'
const betDescription = 'What is the answer to life the universe and everything?'
const betOptions = [
    'Money',
    '42',
    'Fame',
]
const betValue = new BN('10')
const betExpirationDate = new BN(new Date().getTime() + 86400)

// Bet status
const BET_STATUS = {
    INITIALIZED: new BN('0'),
    STARTED: new BN('1'),
    CLOSED: new BN('2'),
    DISPUTED: new BN('3'),
    CANCELLED: new BN('4'),
}

// Array equality
const arrayEqual = (a, b) => {
    return !!a && !!b && !(a < b || b < a)
}

contract('TrustBet', ([
    manager,
    trustee,
    bettorA,
    bettorB,
    otherAccount,
]) => {
    const betId = new BN('0')
    const bettorAOptionIndex = new BN('0')
    const bettorBOptionIndex = new BN('1')
    const nonExistentOptionIndex = new BN('999')
    const nonExistentBetId = new BN('999')
    const realBetResult = new BN('1')
    const falseBetResult = new BN('2')

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
                betExpirationDate,
            )

            expectEvent(
                createBetTx,
                'CreatedBet', {
                    betId: betId,
                    name: betName,
                    description: betDescription,
                    // Array equality is broken in JavaScript, the check is done below
                    // options: betOptions,
                    value: betValue,
                    trustee: trustee,
                    expirationDate: betExpirationDate,
                },
            )

            // Check option equality
            expect(
                arrayEqual(betOptions, createBetTx.logs[0].args.options),
                'bet options should match',
            ).to.be.equal(true)
        })
    })

    context('bet', async () => {
        beforeEach(async () => {
            await this.TrustBet.createBet(
                betName,
                betDescription,
                betOptions,
                betValue,
                trustee,
                betExpirationDate, {
                    from: manager,
                },
            )
        })

        it('details match', async () => {
            const betDetailsCall = await this.TrustBet.betDetails.call(
                betId,
            )

            expect(betDetailsCall[0].eq(betId), 'match betId').to.equal(true)
            expect(betDetailsCall[1], 'match name').to.be.equal(betName)
            expect(betDetailsCall[2], 'match description').to.be.equal(betDescription)
            expect(arrayEqual(betDetailsCall[3], betOptions), 'match options').to.equal(true)
            expect(betDetailsCall[4].eq(betValue), 'match value').to.equal(true)
            expect(betDetailsCall[5], 'match manager').to.be.equal(manager)
            expect(betDetailsCall[6], 'match trustee').to.be.equal(trustee)
            expect(betDetailsCall[7].eq(betExpirationDate), 'match expiration date').to.equal(true)
            expect(betDetailsCall[8].eq(BET_STATUS.INITIALIZED), 'match status').to.equal(true)
        })

        it('fails if the bet does not exist', async () => {
            await expectRevert(
                this.TrustBet.betDetails.call(
                    nonExistentBetId,
                ),
                'Bet does not exist',
            )
        })
    })

    context('bet options', async () => {
        beforeEach(async () => {
            await this.TrustBet.createBet(
                betName,
                betDescription,
                betOptions,
                betValue,
                trustee,
                betExpirationDate, {
                    from: manager,
                },
            )
        })

        it('returns selected bet option', async () => {
            await this.TrustBet.acceptBet(
                betId,
                bettorAOptionIndex, {
                    from: bettorA,
                    value: betValue,
                },
            )

            const betSelectedOptionCall = await this.TrustBet.betSelectedOption.call(
                betId,
                bettorA,
            )

            expect(betSelectedOptionCall.eq(bettorAOptionIndex), 'match selected option').to.equal(true)
        })

        it('fails if the bet does not exist', async () => {
            await expectRevert(
                this.TrustBet.betSelectedOption.call(
                    nonExistentBetId,
                    bettorA,
                ),
                'Bet does not exist',
            )
        })

        it('fails if the bettor did not accept bet', async () => {
            await expectRevert(
                this.TrustBet.betSelectedOption.call(
                    betId,
                    bettorA,
                ),
                'Bettor did not accept bet',
            )
        })
    })

    context('start bet', async () => {
        beforeEach(async () => {
            await this.TrustBet.createBet(
                betName,
                betDescription,
                betOptions,
                betValue,
                trustee,
                betExpirationDate, {
                    from: manager,
                },
            )
        })

        it('manager can start bet', async () => {
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

        it('cannot start bet twice', async () => {
            await this.TrustBet.startBet(
                betId, {
                    from: manager,
                },
            )

            await expectRevert(
                this.TrustBet.startBet(
                    betId, {
                        from: manager,
                    },
                ), 'Can only start when bet is initialized',
            )
        })

        it('changes bet status to Started', async () => {
            await this.TrustBet.startBet(
                betId, {
                    from: manager,
                },
            )

            const betDetailsCall = await this.TrustBet.betDetails.call(
                betId,
            )

            expect(betDetailsCall[8].eq(BET_STATUS.STARTED), 'Started state').to.equal(true)
        })

        it('nobody else can start bet', async () => {
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
        beforeEach(async () => {
            await this.TrustBet.createBet(
                betName,
                betDescription,
                betOptions,
                betValue,
                trustee,
                betExpirationDate, {
                    from: manager,
                },
            )
        })

        it('bettor can accept bet', async () => {
            await this.TrustBet.acceptBet(
                betId,
                bettorAOptionIndex, {
                    from: bettorA,
                    value: betValue,
                },
            )
        })

        it('emits event when accepting bet', async () => {
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
                    selectedOptionIndex: bettorAOptionIndex,
                    value: betValue,
                },
            )
        })

        it('bettor is returned in bet details after accepting bet', async () => {
            await this.TrustBet.acceptBet(
                betId,
                bettorAOptionIndex, {
                    from: bettorA,
                    value: betValue,
                },
            )

            const betDetailsCall = await this.TrustBet.betDetails.call(
                betId,
            )

            expect(arrayEqual(betDetailsCall[9], [bettorA]), 'bettor address').to.be.equal(true)
            expect(arrayEqual(betDetailsCall[10], [bettorAOptionIndex]), 'bettor selected option').to.be.equal(true)
        })

        it('cannot accept non existent bet', async () => {
            await expectRevert(
                this.TrustBet.acceptBet(
                    nonExistentBetId,
                    bettorAOptionIndex, {
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
                    nonExistentOptionIndex, {
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
                    bettorAOptionIndex, {
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
                bettorAOptionIndex, {
                    from: bettorA,
                    value: betValue,
                },
            )

            await expectRevert(
                this.TrustBet.acceptBet(
                    betId,
                    bettorAOptionIndex, {
                        from: bettorA,
                        value: betValue,
                    },
                ),
                'Cannot accept the same bet twice',
            )
        })

        it('cannot accept after the bet started', async () => {
            await this.TrustBet.startBet(
                betId, {
                    from: manager,
                },
            )

            await expectRevert(
                this.TrustBet.acceptBet(
                    betId,
                    bettorAOptionIndex, {
                        from: bettorA,
                        value: betValue,
                    },
                ),
                'Can only accept when bet is initialized',
            )
        })
        // cannot accept after the bet closed
        // cannot accept after the bet cancelled
    })

    context('post bet result', async () => {
        beforeEach(async () => {
            await this.TrustBet.createBet(
                betName,
                betDescription,
                betOptions,
                betValue,
                trustee,
                betExpirationDate, {
                    from: manager,
                },
            )

            await this.TrustBet.acceptBet(
                betId,
                bettorAOptionIndex, {
                    from: bettorA,
                    value: betValue,
                },
            )

            await this.TrustBet.acceptBet(
                betId,
                bettorBOptionIndex, {
                    from: bettorB,
                    value: betValue,
                },
            )

            await this.TrustBet.startBet(
                betId, {
                    from: manager,
                },
            )
        })

        it('bettor can post bet result', async () => {
            await this.TrustBet.postBetResult(
                betId,
                realBetResult, {
                    from: bettorA,
                },
            )
        })

        it('post bet result returns event', async () => {
            const postBetResultTx = await this.TrustBet.postBetResult(
                betId,
                realBetResult, {
                    from: bettorA,
                },
            )

            expectEvent(
                postBetResultTx,
                'BetResultPosted', {
                    betId: betId,
                    optionIndex: realBetResult,
                },
            )
        })

        it('fails if the bet does not exist', async () => {
            await expectRevert(
                this.TrustBet.postBetResult(
                    nonExistentBetId,
                    realBetResult,
                ),
                'Bet does not exist',
            )
        })

        context('successful only if bet started', async () => {
            it('fails if initialized', async () => {
                const createBetTx = await this.TrustBet.createBet(
                    betName,
                    betDescription,
                    betOptions,
                    betValue,
                    trustee,
                    betExpirationDate, {
                        from: manager,
                    },
                )
                const createdBetId = createBetTx.logs[0].args.betId

                await expectRevert(
                    this.TrustBet.postBetResult(
                        createdBetId,
                        realBetResult,
                    ),
                    'Can only post result when bet is started',
                )
            })
        })

        it('fails if bet option does not exist', async () => {
            await expectRevert(
                this.TrustBet.postBetResult(
                    betId,
                    nonExistentOptionIndex,
                ),
                'Option does not exist',
            )
        })

        it('fails if bettor posts any result twice', async () => {
            await this.TrustBet.postBetResult(
                betId,
                realBetResult, {
                    from: bettorA,
                },
            )

            await expectRevert(
                this.TrustBet.postBetResult(
                    betId,
                    realBetResult, {
                        from: bettorA,
                    },
                ),
                'Bettor already posted result',
            )
        })

        it('fails if bettor was not part of the started bet', async () => {
            await expectRevert(
                this.TrustBet.postBetResult(
                    betId,
                    realBetResult, {
                        from: otherAccount,
                    },
                ),
                'Bettor is not part of the bet',
            )
        })
    })

    context('close bet', async () => {
        beforeEach(async () => {
            await this.TrustBet.createBet(
                betName,
                betDescription,
                betOptions,
                betValue,
                trustee,
                betExpirationDate, {
                    from: manager,
                },
            )

            await this.TrustBet.acceptBet(
                betId,
                bettorAOptionIndex, {
                    from: bettorA,
                    value: betValue,
                },
            )

            await this.TrustBet.acceptBet(
                betId,
                bettorBOptionIndex, {
                    from: bettorB,
                    value: betValue,
                },
            )

            await this.TrustBet.startBet(
                betId, {
                    from: manager,
                },
            )
        })

        it('bet is closed after all bettors post same result', async () => {
            await this.TrustBet.postBetResult(
                betId,
                realBetResult, {
                    from: bettorA,
                },
            )

            await this.TrustBet.postBetResult(
                betId,
                realBetResult, {
                    from: bettorB,
                },
            )

            const betDetailsCall = await this.TrustBet.betDetails.call(
                betId,
            )

            expect(betDetailsCall[8].eq(BET_STATUS.CLOSED), 'bet closed').to.equal(true)
        })

        it('bet emits closed event when last bettor post same result', async () => {
            await this.TrustBet.postBetResult(
                betId,
                realBetResult, {
                    from: bettorA,
                },
            )

            const postBetResultTx = await this.TrustBet.postBetResult(
                betId,
                realBetResult, {
                    from: bettorB,
                },
            )

            expectEvent(
                postBetResultTx,
                'BetClosed', {
                    betId: betId,
                    winningOptionIndex: realBetResult,
                },
            )
        })

        it('bet is disputed after any bettor posts a different result', async () => {
            await this.TrustBet.postBetResult(
                betId,
                realBetResult, {
                    from: bettorA,
                },
            )

            await this.TrustBet.postBetResult(
                betId,
                falseBetResult, {
                    from: bettorB,
                },
            )

            const betDetailsCall = await this.TrustBet.betDetails.call(
                betId,
            )

            expect(betDetailsCall[8].eq(BET_STATUS.DISPUTED), 'bet disputed').to.equal(true)
        })

        it('bet emits disputed event when bettor posts different result from existing ones', async () => {
            await this.TrustBet.postBetResult(
                betId,
                realBetResult, {
                    from: bettorA,
                },
            )

            const postBetResultTx = await this.TrustBet.postBetResult(
                betId,
                falseBetResult, {
                    from: bettorB,
                },
            )

            expectEvent(
                postBetResultTx,
                'BetDisputed', {
                    betId: betId,
                },
            )
        })
    })
})
