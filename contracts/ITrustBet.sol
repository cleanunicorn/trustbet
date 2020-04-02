pragma solidity >= 0.6.0;
pragma experimental ABIEncoderV2;

interface ITrustBet {
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
        // bettorsCount
        uint
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

    function betPostedResult(
        uint betId,
        address bettor
    ) external view returns(
        // postedOptionIndex
        uint
    );

    // function bettorOption(
    //     uint betId,
    //     address bettor,

    // )

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
