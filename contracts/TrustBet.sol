pragma solidity >= 0.6.4;
pragma experimental ABIEncoderV2;

import "./ITrustBet.sol";


/**
    @title A contract that intermediates a way for friends to create bets
 */
contract TrustBet is ITrustBet {
    enum BetStatus {
        Initialized,
        Started,
        Closed,
        Cancelled
    }

    struct Bettor {
        uint optionIndex;
        bool exists;
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

        // Status
        BetStatus status;

        // Bettors
        mapping(address => Bettor) bettors;
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
        address trustee
    )
        public
        override(ITrustBet)
        returns (
            uint
        )
    {
        _bets.push(Bet({
            name: name,
            description: description,
            options: options,
            value: value,
            trustee: trustee,
            manager: msg.sender,
            status: BetStatus.Initialized
        }));

        uint betId = _bets.length - 1;

        emit CreatedBet(
            betId,
            name,
            description,
            options,
            value,
            trustee
        );

        return betId;
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

        require(optionIndex <= bet.options.length, "Option does not exist");

        require(msg.value == bet.value, "Sent value does not match bet value");

        require(bet.bettors[msg.sender].exists == false, "Cannot accept the same bet twice");

        // Add bettor
        Bettor storage bettor = bet.bettors[msg.sender];
        bettor.exists = true;
        bettor.optionIndex = optionIndex;

        emit BetAccepted({
            betId: betId,
            bettor: msg.sender,
            optionIndex: optionIndex,
            value: msg.value
        });
    }
}
