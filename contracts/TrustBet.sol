pragma solidity = 0.6.3;
pragma experimental ABIEncoderV2;

import "./ITrustBet.sol";


contract TrustBet is ITrustBet {
    struct Bet {
        string _description;
        string[] _options;
        address _trustee;
    }

    Bet[] private _bets;

    function createBet(
        string memory description,
        string[] memory options,
        address trustee
    )
        public
        override(ITrustBet)
        returns (
            uint
        )
    {
        _bets.push(Bet(description, options, trustee));

        uint betId = _bets.length - 1;

        emit CreatedBet(
            betId,
            description,
            options,
            trustee
        );

        return betId;
    }
}
