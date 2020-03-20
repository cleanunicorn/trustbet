pragma solidity >= 0.6.4;
pragma experimental ABIEncoderV2;

import "./ITrustBet.sol";


contract TrustBet is ITrustBet {
    struct Bet {
        string _name;
        string _description;
        string[] _options;
        address _trustee;
    }

    Bet[] private _bets;

    function createBet(
        string memory name,
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
        _bets.push(Bet({
            _name: name,
            _description: description,
            _options: options,
            _trustee: trustee
        }));

        uint betId = _bets.length - 1;

        emit CreatedBet(
            betId,
            name,
            description,
            options,
            trustee
        );

        return betId;
    }
}
