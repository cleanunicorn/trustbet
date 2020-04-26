pragma solidity >= 0.6.4;
pragma experimental ABIEncoderV2;

interface ITrustBet {
    /**
        @notice defines bet status
     */
    enum BetStatus {
        Initialized,
        Started,
        Closed,
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

    /**
        @notice Return index of selected bet option by the bettor
     */
    function betSelectedOption(
        uint betId,
        address bettor
    ) external view returns(
        // selectedOptionIndex
        uint
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

    // event BetClosed(
    //     uint betId,
    //     uint winningOptionIndex
    // );

    function startBet(uint betId) external;

    function closeBet(uint betId) external;

    // // Bettor actions

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
