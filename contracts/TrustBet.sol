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
    function betDetails(
        uint betId
    )
        external
        view
        override(ITrustBet)
        returns (
            // betId
            uint,
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
            BetStatus,
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
        int[] memory postedResult = new int[](bet.bettorsArray.length);

        return (
            // betId
            betId,
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
            bet.status,
            // bettors
            bet.bettorsArray,
            // bettors' selected option
            selectedOption,
            // bettors' posted result
            postedResult
        );
    }

    /**
        @notice Return index of selected bet option by the bettor
        @dev Fails if the bet does not exist or if the bettor did not select any option
        @param betId the id of the bet
        @param bettor the address of the bettor
        @return index of selected option by the bettor
     */
    function betSelectedOption(
        uint betId,
        address bettor
    )
        external
        view
        override(ITrustBet)
        returns(
            // selectedOptionIndex
            uint
        )
    {
        require(betId <= _bets.length, "Bet does not exist");

        require(_bets[betId].bettors[bettor].exists, "Bettor did not accept bet");

        return (_bets[betId].bettors[bettor].selectedOptionIndex);
    }

    /**
        @notice Start the bet after all Bettors joined. No additional Bettors can join the bet after it started.
        @dev Only the creator of the bet can start it
        @param betId The id of the bet that should start
     */
    function startBet(uint betId)
        public
        override(ITrustBet)
    {
        Bet storage bet = _bets[betId];

        require(bet.status == BetStatus.Initialized, "Bet was already initialized before");

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
        public
        payable
        override(ITrustBet)
    {
        require(betId <= _bets.length, "Bet does not exist");

        Bet storage bet = _bets[betId];

        require(bet.status == BetStatus.Initialized, "Can only accept when bet is initialized");
        require(selectedOptionIndex <= bet.options.length, "Option does not exist");
        require(msg.value == bet.value, "Sent value does not match bet value");
        require(bet.bettors[msg.sender].exists == false, "Cannot accept the same bet twice");

        // Add bettor
        Bettor storage bettor = bet.bettors[msg.sender];
        bettor.exists = true;
        bettor.selectedOptionIndex = selectedOptionIndex;
        // This starts as -1 to reflect that no result index was posted
        bettor.resultOptionIndex = -1;

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
        public
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
    }

    /**
        @notice The Manager can close the bet after which no additional
        Bettors can join the bet.
        @param betId the id of the bet to be closed
     */
    function closeBet(
        uint betId
    )
        public
        override(ITrustBet)
    {
        Bet storage bet = _bets[betId];

        require(msg.sender == bet.manager, "Only the manager can close the bet");
    }

}
