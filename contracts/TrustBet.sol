pragma solidity >= 0.6.4;
pragma experimental ABIEncoderV2;

import "./ITrustBet.sol";


/**
    @title A contract that intermediates a way for friends to create bets
 */
contract TrustBet is ITrustBet {
    struct Bettor {
        // This is true for all bettors that accepted the bet
        bool exists;
        // Index of the selected option when accepting the bet
        uint selectedOptionIndex;
        // Index of the option which is reported as the result of the bet
        int resultOptionIndex;
        // Bettor collected winnings
        bool withdrewWinnings;
    }

    struct Bet {
        // Details
        string name;
        string description;
        string[] options;
        uint value;

        // Trustee
        address trustee;

        // Manager
        address manager;

        // Expiration Date
        uint expirationDate;

        // Bettors
        address[] bettorsArray;
        mapping(address => Bettor) bettors;

        // Final result option obtained by all Bettors posting the same result or the trustee forcing the result
        int finalResultOptionIndex;

        // Status
        BetStatus status;
    }

    Bet[] private _bets;

    /**
        @notice Create a new bet
        @param name The name of the bet
        @param description A detailed description of the bet
        @param options A list of possible options that the Bettors can choose from
        @param trustee The address of a trusted party which can force the result of a bet in case the Bettors do not agree on the outcome
        @return betId The newly created bet id
     */
    function createBet(
        string memory name,
        string memory description,
        string[] memory options,
        uint value,
        address trustee,
        uint expirationDate
    )
        public
        override(ITrustBet)
        returns (
            uint
        )
    {
        Bet memory bet;
        bet.name = name;
        bet.description = description;
        bet.options = options;
        bet.value = value;
        bet.trustee = trustee;
        bet.manager = msg.sender;
        bet.expirationDate = expirationDate;
        bet.status = BetStatus.Initialized;
        bet.finalResultOptionIndex = -1;

        _bets.push(bet);

        uint betId = _bets.length - 1;

        emit CreatedBet(
            betId,
            name,
            description,
            options,
            value,
            trustee,
            expirationDate
        );

        return betId;
    }

    /**
        @notice Returns information about a created bet
        @param betId the id  of the bet
     */
    function bet(
        uint betId
    )
        external
        view
        override(ITrustBet)
        returns (
            // name
            string memory,
            // description
            string memory,
            // options
            string[] memory,
            // value
            uint,
            // manager
            address,
            // trustee
            address,
            // expirationDate
            uint,
            // status
            BetStatus
        )
    {
        require(betId <= _bets.length, "Bet does not exist");

        Bet storage bet = _bets[betId];

        return (
            // name
            bet.name,
            // description
            bet.description,
            // options
            bet.options,
            // value
            bet.value,
            // manager
            bet.manager,
            // trustee
            bet.trustee,
            // expirationDate
            bet.expirationDate,
            // status
            bet.status
        );
    }

    /**
        TODO: Add comment
     */
    function bettors(
        uint betId
    )
        external
        view
        override(ITrustBet)
        returns (
            // bettors
            address[] memory,
            // selected option index when bettor entered the bet
            uint[] memory,
            // reported option index by bettor as the result at the end of the bet
            int[] memory
        )
    {
        require(betId <= _bets.length, "Bet does not exist");

        Bet storage bet = _bets[betId];

        // Gather selected option for each bettor
        uint[] memory selectedOption = new uint[](bet.bettorsArray.length);
        for (uint i = 0; i < bet.bettorsArray.length; i++) {
            selectedOption[i] = bet.bettors[bet.bettorsArray[i]].selectedOptionIndex;
        }

        // Gather posted result for each bettor
        int[] memory postedResults = new int[](bet.bettorsArray.length);
        for (uint i = 0; i < bet.bettorsArray.length; i++) {
            postedResults[i] = bet.bettors[bet.bettorsArray[i]].resultOptionIndex;
        }

        return (
            bet.bettorsArray,
            selectedOption,
            postedResults
        );
    }

    function result(
        uint betId
    )
        external
        view
        override(ITrustBet)
        returns (
            // result option index
            uint
        )
    {
        require(betId <= _bets.length, "Bet does not exist");

        Bet storage bet = _bets[betId];

        require(bet.status == BetStatus.Closed, "Can only return result when bet is closed");

        return uint(bet.finalResultOptionIndex);
    }

    /**
        @notice Start the bet after all Bettors joined. No additional Bettors can join the bet after it started.
        @dev Only the Manager of the bet can start it
        @param betId The id of the bet that should start
     */
    function startBet(uint betId)
        external
        override(ITrustBet)
    {
        Bet storage bet = _bets[betId];

        require(bet.status == BetStatus.Initialized, "Can only start when bet is initialized");

        require(bet.manager == msg.sender, "Only the manager can start the bet");

        bet.status = BetStatus.Started;

        emit BetStarted(
            betId
        );
    }

    /**
        @notice The Bettor can accept a bet and also has to send the funds.
        @param betId the id of the bet to be accepted
        @param selectedOptionIndex the option picked by the Bettor
     */
    function acceptBet(
        uint betId,
        uint selectedOptionIndex
    )
        external
        payable
        override(ITrustBet)
    {
        require(betId <= _bets.length, "Bet does not exist");

        Bet storage bet = _bets[betId];

        require(bet.status == BetStatus.Initialized, "Can only accept when bet is initialized");
        require(selectedOptionIndex <= bet.options.length, "Option does not exist");
        require(msg.value == bet.value, "Sent value does not match bet value");
        require(bet.bettors[msg.sender].exists == false, "Cannot accept the same bet twice");

        // Create bettor structure
        Bettor storage bettor = bet.bettors[msg.sender];
        bettor.exists = true;
        bettor.selectedOptionIndex = selectedOptionIndex;
        // This starts as -1 to reflect that no result index was posted
        bettor.resultOptionIndex = -1;

        // Add bettor
        bet.bettorsArray.push(msg.sender);

        emit BetAccepted({
            betId: betId,
            bettor: msg.sender,
            selectedOptionIndex: selectedOptionIndex,
            value: msg.value
        });
    }

    /**
        @notice Bettor should post the real outcome of the bet.
        @param betId the id of the bet
        @param resultOptionIndex the real outcome of the bet identified by the index
     */
    function postBetResult(
        uint betId,
        uint resultOptionIndex
    )
        external
        override(ITrustBet)
    {
        require(betId <= _bets.length, "Bet does not exist");

        Bet storage bet = _bets[betId];

        require(bet.status == BetStatus.Started, "Can only post result when bet is started");
        require(resultOptionIndex <= bet.options.length, "Option does not exist");
        require(bet.bettors[msg.sender].exists, "Bettor is not part of the bet");
        require(bet.bettors[msg.sender].resultOptionIndex == -1, "Bettor already posted result");

        Bettor storage bettor = bet.bettors[msg.sender];
        bettor.resultOptionIndex = int(resultOptionIndex);

        emit BetResultPosted(
            betId,
            resultOptionIndex
        );

        // Check if all Bettors posted results and if all of them match
        bool allBettors = true;
        bool resultsConflict = false;
        for (uint i = 0; i < bet.bettorsArray.length; i++) {
            Bettor storage bettorIter = bet.bettors[bet.bettorsArray[i]];

            // If not all bettors posted results
            if (bettorIter.resultOptionIndex == -1) {
                allBettors = false;
            } else {
                // If there is a result different from the current result,
                // the bet moves into a `Disputed` state
                if (int(resultOptionIndex) != bettorIter.resultOptionIndex) {
                    resultsConflict = true;
                }
            }
        }

        // If at least one of the results is different, move the bet into
        // the Disputed state. We do not have consensus, the Trustee needs to intervene.
        if (resultsConflict) {
            bet.status = BetStatus.Disputed;
            emit BetDisputed(
                betId
            );
            return;
        }

        // If all bettors posted result and there are no conflicts, move the bet into
        // the Closed state. We have consensus, winners can start withdrawing their funds
        if (allBettors) {
            bet.status = BetStatus.Closed;
            bet.finalResultOptionIndex = int(resultOptionIndex);
            emit BetClosed(
                betId,
                resultOptionIndex
            );
        }
    }

    /**
        @notice Bettor can withdraw winnings if they won the bet
        @param betId the id of the bet
     */
    function withdrawWinnings(
        uint betId
    )
        external
        override(ITrustBet)
    {
        require(betId <= _bets.length, "Bet does not exist");

        Bet storage bet = _bets[betId];

        require(bet.status == BetStatus.Closed, "Bet is not closed");

        Bettor storage bettor = bet.bettors[msg.sender];

        require(bettor.exists, "Account is not a bettor");
        require(bettor.withdrewWinnings == false, "Bettor already withdrew winnings");
        require(bettor.selectedOptionIndex == uint(bet.finalResultOptionIndex), "Bettor is not a winner");

        bettor.withdrewWinnings = true;

        // Count winners
        uint winnerCount = 0;
        for (uint i = 0; i < bet.bettorsArray.length; i++) {
            if (bet.bettors[bet.bettorsArray[i]].selectedOptionIndex == uint(bet.finalResultOptionIndex)) {
                winnerCount++;
            }
        }

        msg.sender.transfer(bet.value * bet.bettorsArray.length / winnerCount);
    }
}
