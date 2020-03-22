pragma solidity >= 0.6.0;
pragma experimental ABIEncoderV2;

interface ITrustBet {
    // Manager actions
    event CreatedBet(
        uint betId,
        string name,
        string description,
        string[] options,
        uint value,
        address trustee
    );

    function createBet(
        string calldata name,
        string calldata description,
        string[] calldata options,
        uint value,
        address trustee
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
        uint optionIndex,
        uint value
    );

    function acceptBet(uint betId, uint optionIndex) external payable;

    // function postBetResult(
    //     uint betId,
    //     string calldata option
    // )
    // external;

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
