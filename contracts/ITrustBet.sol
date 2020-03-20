pragma solidity >= 0.6.0;
pragma experimental ABIEncoderV2;

interface ITrustBet {
    // Manager actions
    event CreatedBet(
        uint betId,
        string name,
        string description,
        string[] options,
        address trustee
    );

    function createBet(
        string calldata name,
        string calldata description,
        string[] calldata options,
        address trustee
    ) external returns (uint betId);

    // function startBet(uint betId) external;

    // function closeBet(uint betId) external;

    // // Better actions
    // function acceptBet(uint betId, string calldata option) external payable;

    // function postBetResult(
    //     uint betId,
    //     string calldata option
    // )
    // external;

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
