const {
    BN,
    expectEvent,
    expectRevert,
    balance,
    ether,
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
const betValue = ether('1')
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
    bettorC,
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

        it('basic details match', async () => {
            const betCall = await this.TrustBet.bet.call(
                betId,
            )

            expect(betCall[0], 'match name').to.be.equal(betName)
            expect(betCall[1], 'match description').to.be.equal(betDescription)
            expect(arrayEqual(betCall[2], betOptions), 'match options').to.equal(true)
            expect(betCall[3].eq(betValue), 'match value').to.equal(true)
            expect(betCall[4], 'match manager').to.be.equal(manager)
            expect(betCall[5], 'match trustee').to.be.equal(trustee)
            expect(betCall[6].eq(betExpirationDate), 'match expiration date').to.equal(true)
            expect(betCall[7].eq(BET_STATUS.INITIALIZED), 'match status').to.equal(true)
        })

        it('fails if the bet does not exist', async () => {
            await expectRevert(
                this.TrustBet.bet.call(
                    nonExistentBetId,
                ),
                'Bet does not exist',
            )
        })
    })

    context('bettors', async () => {
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

        it('fails if the bet does not exist', async () => {
            await expectRevert(
                this.TrustBet.bettors.call(
                    nonExistentBetId,
                ),
                'Bet does not exist',
            )
        })

        it('is empty by default', async () => {
            const bettorsCall = await this.TrustBet.bettors.call(
                betId,
            )

            expect(arrayEqual(bettorsCall[0], []), 'no bettors').to.equal(true)
            expect(arrayEqual(bettorsCall[1], []), 'no selected options').to.equal(true)
            expect(arrayEqual(bettorsCall[2], []), 'no result options').to.equal(true)
        })

        it('bettor is returned in bet details after accepting bet', async () => {
            await this.TrustBet.acceptBet(
                betId,
                bettorAOptionIndex, {
                    from: bettorA,
                    value: betValue,
                },
            )

            const bettorsCall = await this.TrustBet.bettors.call(
                betId,
            )

            expect(arrayEqual(bettorsCall[0], [bettorA]), 'bettor address').to.be.equal(true)
        })

        it('bettor selected option is returned after accepting bet', async () => {
            await this.TrustBet.acceptBet(
                betId,
                bettorAOptionIndex, {
                    from: bettorA,
                    value: betValue,
                },
            )

            const bettorsCall = await this.TrustBet.bettors.call(
                betId,
            )

            expect(arrayEqual(bettorsCall[1], [bettorAOptionIndex]), 'bettor selected option').to.be.equal(true)
        })

        it('bettor result option is returned after posting result', async () => {
            await this.TrustBet.acceptBet(
                betId,
                bettorAOptionIndex, {
                    from: bettorA,
                    value: betValue,
                },
            )

            await this.TrustBet.startBet(
                betId, {
                    from: manager,
                },
            )

            await this.TrustBet.postBetResult(
                betId,
                bettorAOptionIndex, {
                    from: bettorA,
                },
            )

            const bettorsCall = await this.TrustBet.bettors.call(
                betId,
            )

            expect(arrayEqual(bettorsCall[2], [bettorAOptionIndex]), 'bettor selected option').to.be.equal(true)
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

            const betDetailsCall = await this.TrustBet.bet.call(
                betId,
            )

            expect(betDetailsCall[7].eq(BET_STATUS.STARTED), 'Started state').to.equal(true)
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

            const betDetailsCall = await this.TrustBet.bet.call(
                betId,
            )

            expect(betDetailsCall[7].eq(BET_STATUS.CLOSED), 'bet closed').to.equal(true)
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

            const betDetailsCall = await this.TrustBet.bet.call(
                betId,
            )

            expect(betDetailsCall[7].eq(BET_STATUS.DISPUTED), 'bet disputed').to.equal(true)
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

    context('withdraw winnings', async () => {
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

            await this.TrustBet.postBetResult(
                betId,
                bettorBOptionIndex, {
                    from: bettorA,
                },
            )

            await this.TrustBet.postBetResult(
                betId,
                bettorBOptionIndex, {
                    from: bettorB,
                },
            )
        })

        it('bettor can withdraw winnings', async () => {
            const bettorBBalanceTracker = await balance.tracker(bettorB)
            const bettorBInitialBalance = await bettorBBalanceTracker.get()
            const bettorBWithdrawWinningsTx = await this.TrustBet.withdrawWinnings(
                betId, {
                    from: bettorB,
                    gasPrice: 1,
                },
            )

            const bettorBFinalBalance = await bettorBBalanceTracker.get()

            expect(
                bettorBFinalBalance.eq(bettorBInitialBalance
                    // Add bet value
                    .add(betValue.mul(new BN('2')))
                    // Remove tx fee
                    .sub(new BN(bettorBWithdrawWinningsTx.receipt.gasUsed)),
                ),
                'bettor balance change matches total bet value, minus tx fee',
            ).to.equal(true)
        })

        it('bettor cannot withdraw winnings twice', async () => {
            await this.TrustBet.withdrawWinnings(
                betId, {
                    from: bettorB,
                },
            )

            await expectRevert(
                this.TrustBet.withdrawWinnings(
                    betId, {
                        from: bettorB,
                    },
                ),
                'Bettor already withdrew winnings',
            )
        })

        it('other bettors cannot withdraw undeserved winnings', async () => {
            await expectRevert(
                this.TrustBet.withdrawWinnings(
                    betId, {
                        from: bettorA,
                    },
                ),
                'Bettor is not a winner',
            )
        })

        it('other accounts cannot withdraw winnings', async () => {
            await expectRevert(
                this.TrustBet.withdrawWinnings(
                    betId, {
                        from: otherAccount,
                    },
                ),
                'Account is not a bettor',
            )
        })

        it('bet must exist', async () => {
            await expectRevert(
                this.TrustBet.withdrawWinnings(
                    nonExistentBetId, {
                        from: otherAccount,
                    },
                ),
                'Bet does not exist',
            )
        })

        it('bet must be closed', async () => {
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
                this.TrustBet.withdrawWinnings(
                    createdBetId, {
                        from: otherAccount,
                    },
                ),
                'Bet is not closed',
            )
        })

        context('multiple bettors pick same option', async () => {
            let multipleBettorsBetId

            beforeEach(async () => {
                // Create bet
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
                multipleBettorsBetId = createBetTx.logs[0].args.betId

                // Accept bet
                await this.TrustBet.acceptBet(
                    multipleBettorsBetId,
                    bettorAOptionIndex, {
                        from: bettorA,
                        value: betValue,
                    },
                )

                await this.TrustBet.acceptBet(
                    multipleBettorsBetId,
                    bettorBOptionIndex, {
                        from: bettorB,
                        value: betValue,
                    },
                )

                await this.TrustBet.acceptBet(
                    multipleBettorsBetId,
                    bettorBOptionIndex, {
                        from: bettorC,
                        value: betValue,
                    },
                )

                // Start bet
                await this.TrustBet.startBet(
                    multipleBettorsBetId, {
                        from: manager,
                    },
                )

                // Post result
                await this.TrustBet.postBetResult(
                    multipleBettorsBetId,
                    bettorBOptionIndex, {
                        from: bettorA,
                    },
                )

                await this.TrustBet.postBetResult(
                    multipleBettorsBetId,
                    bettorBOptionIndex, {
                        from: bettorB,
                    },
                )

                await this.TrustBet.postBetResult(
                    multipleBettorsBetId,
                    bettorBOptionIndex, {
                        from: bettorC,
                    },
                )
            })

            it('splits winning funds between winners', async () => {
                const bettorBBalanceTracker = await balance.tracker(bettorB)
                const bettorBInitialBalance = await bettorBBalanceTracker.get()
                const bettorBWithdrawWinningsTx = await this.TrustBet.withdrawWinnings(
                    multipleBettorsBetId, {
                        from: bettorB,
                        gasPrice: 1,
                    },
                )

                const bettorBFinalBalance = await bettorBBalanceTracker.get()

                const txFee = new BN(bettorBWithdrawWinningsTx.receipt.gasUsed)
                const expectedWinning = betValue
                    // 3 bettors
                    .mul(new BN('3'))
                    // 2 winners
                    .div(new BN('2'))
                const expectedFinalBalance = bettorBInitialBalance
                    .sub(txFee)
                    .add(expectedWinning)

                expect(
                    bettorBFinalBalance,
                    'bettor balance change matches winnings, minus tx fee',
                ).to.eql(expectedFinalBalance)
            })
        })
    })

    context('force bet result', async () => {
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

        it('cannot force result on non existent bet', async () => {
            await expectRevert(
                this.TrustBet.forceBetResult(
                    nonExistentBetId,
                    realBetResult, {
                        from: trustee,
                    },
                ),
                'Bet does not exist',
            )
        })

        it('should only be able to force results on started or disputed bets', async () => {
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
                this.TrustBet.forceBetResult(
                    createdBetId,
                    realBetResult, {
                        from: trustee,
                    },
                ),
                'Can only force result when bet is started or disputed',
            )
        })

        it('should be able to force result on a started bet', async () => {
            await this.TrustBet.forceBetResult(
                betId,
                realBetResult, {
                    from: trustee,
                },
            )
        })

        it('should be able to force result on a disputed bet', async () => {
            await this.TrustBet.postBetResult(
                betId,
                bettorAOptionIndex, {
                    from: bettorA,
                },
            )

            await this.TrustBet.postBetResult(
                betId,
                bettorBOptionIndex, {
                    from: bettorB,
                },
            )

            const betCall = await this.TrustBet.bet.call(
                betId,
            )

            expect(betCall[7].eq(BET_STATUS.DISPUTED), 'Disputed state').to.equal(true)

            await this.TrustBet.forceBetResult(
                betId,
                realBetResult, {
                    from: trustee,
                },
            )
        })

        it('should emit event', async () => {
            const forceBetResultTx = await this.TrustBet.forceBetResult(
                betId,
                realBetResult, {
                    from: trustee,
                },
            )

            expectEvent(
                forceBetResultTx,
                'BetClosed', {
                    betId: betId,
                    winningOptionIndex: realBetResult,
                },
            )
        })

        it('should move bet into closed state', async () => {
            await this.TrustBet.forceBetResult(
                betId,
                realBetResult, {
                    from: trustee,
                },
            )

            const betDetailsCall = await this.TrustBet.bet.call(
                betId,
            )

            expect(betDetailsCall[7].eq(BET_STATUS.CLOSED), 'bet closed').to.equal(true)
        })
    })
})
