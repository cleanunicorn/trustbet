pragma solidity >= 0.6.4;
pragma experimental ABIEncoderV2;

interface ITrustBet {
    /**
        @notice defines bet status
     */
    enum BetStatus {
        // Initialized
        // - The bet was created and it is waiting for Bettors to accept it.
        // - Bettors can join the bet.
        Initialized,

        // Started
        // - No more bettors can join the bet.
        // - Bettors can post results.
        Started,

        // Closed
        // - All bettors posted results.
        // - There is full consensus on posted results, all bettors posted the identical result.
        Closed,

        // Disputed
        // - At least 2 or more bettors posted result.
        // - There is at least 1 result which differs from the other results, there is no full consensus.
        Disputed,

        // Cancelled
        // - Manager cancelled the bet while bet was still active
        // - Bet expired and somebody cancelled the bet before bet got to `Closed` state
        Cancelled
    }

    /**
        @notice Returns bet details
     */
    function betDetails(
        uint betId
    ) external view returns (
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
        address[] memory bettors,
        // selected option index when bettor entered the bet
        uint[] memory selectedOptionIndexes,
        // reported option index by bettor as the result at the end of the bet
        int[] memory resultOptionIndexes
    );

    // Manager actions
    event CreatedBet(
        uint betId,
        string name,
        string description,
        string[] options,
        uint value,
        address trustee,
        uint expirationDate
    );

    function createBet(
        string calldata name,
        string calldata description,
        string[] calldata options,
        uint value,
        address trustee,
        uint expirationDate
    ) external returns (uint betId);

    event BetStarted(
        uint betId
    );

    function startBet(uint betId) external;

    event BetClosed(
        uint betId,
        uint winningOptionIndex
    );

    event BetDisputed(
        uint betId
    );

    // Bettor actions

    event BetAccepted(
        uint betId,
        address bettor,
        uint selectedOptionIndex,
        uint value
    );

    event BetResultPosted(
        uint betId,
        uint optionIndex
    );

    function acceptBet(uint betId, uint optionIndex) external payable;

    function postBetResult(
        uint betId,
        uint optionIndex
    ) external;

    function withdrawWinnings(
        uint betId
    ) external;

    // collectWinningBet

    // // Trustee actions
    // function resolveBet(
    //     uint betId,
    //     string calldata option
    // )
    // external;

    // function cancelBet(
    //     uint betId
    // )
    // external;
}
