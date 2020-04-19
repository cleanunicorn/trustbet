pragma solidity >= 0.6.4;
pragma experimental ABIEncoderV2;

import "./ITrustBet.sol";


/**
    @title A contract that intermediates a way for friends to create bets
 */
contract TrustBet is ITrustBet {
    struct PostedResult {
        uint postedOptionIndex;
        bool exists;
    }

    struct Bettor {
        uint optionIndex;
        bool exists;
        PostedResult result;
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

        // Bettors selected option
        uint[] selectedOptions;

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
            // bettors' selected option
            uint[] memory
        )
    {
        require(betId <= _bets.length, "Bet does not exist");

        Bet storage bet = _bets[betId];

        uint[] memory selectedOption = new uint[](bet.bettorsArray.length);
        for (uint i = 0; i < bet.bettorsArray.length; i++) {
            selectedOption[i] = bet.bettors[bet.bettorsArray[i]].optionIndex;
        }

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
            selectedOption
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

        return (_bets[betId].bettors[bettor].optionIndex);
    }

    /**
        @notice Return index of posted result bet option by the bettor
        @dev Fails
        - if the bet does not exist
        - if the bettor did not post any option
        @param betId the id of the bet
        @param bettor the address of the bettor
        @return index of the posted option by the bettor
     */
    function betPostedResult(
        uint betId,
        address bettor
    )
        external
        view
        override(ITrustBet)
        returns(
            //postedOptionIndex
            uint
        )
    {
        // TODO: check bet exists
        // TODO: check bettor posted

        return _bets[betId].bettors[bettor].result.postedOptionIndex;
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
        @param optionIndex the option picked by the Bettor
     */
    function acceptBet(
        uint betId,
        uint optionIndex
    )
        public
        payable
        override(ITrustBet)
    {
        require(betId <= _bets.length, "Bet does not exist");

        Bet storage bet = _bets[betId];

        require(bet.status == BetStatus.Initialized, "Can only accept when bet is initialized");

        require(optionIndex <= bet.options.length, "Option does not exist");

        require(msg.value == bet.value, "Sent value does not match bet value");

        require(bet.bettors[msg.sender].exists == false, "Cannot accept the same bet twice");

        // Add bettor
        Bettor storage bettor = bet.bettors[msg.sender];
        bettor.exists = true;
        bettor.optionIndex = optionIndex;

        bet.bettorsArray.push(msg.sender);

        emit BetAccepted({
            betId: betId,
            bettor: msg.sender,
            optionIndex: optionIndex,
            value: msg.value
        });
    }

    /**
        @notice Bettor should post the real outcome of the bet.
        @param betId the id of the bet
        @param optionIndex the real outcome of the bet identified by the index
     */
    function postBetResult(
        uint betId,
        uint optionIndex
    )
        public
        override(ITrustBet)
    {
        require(betId <= _bets.length, "Bet does not exist");

        Bet storage bet = _bets[betId];

        require(bet.status == BetStatus.Started, "Can only post result when bet is started");

        require(optionIndex <= bet.options.length, "Option does not exist");

        require(bet.bettors[msg.sender].exists, "Bettor is not part of the bet");

        require(bet.bettors[msg.sender].result.exists == false, "Bettor already posted result");

        PostedResult memory postedResult;
        postedResult.exists = true;
        postedResult.postedOptionIndex = optionIndex;

        Bettor storage bettor = bet.bettors[msg.sender];
        bettor.result = postedResult;

        emit BetResultPosted(
            betId,
            optionIndex
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
