## `TrustBet`






### `createBet(string name, string description, string[] options, uint256 value, address trustee, uint256 expirationDate) → uint256` (public)

Create a new bet




### `betDetails(uint256 betId) → uint256, string, string, string[], uint256, address, address, uint256, enum ITrustBet.BetStatus, address[], uint256[], int256[]` (external)

Returns information about a created bet




### `betSelectedOption(uint256 betId, address bettor) → uint256` (external)

Return index of selected bet option by the bettor


Fails if the bet does not exist or if the bettor did not select any option


### `startBet(uint256 betId)` (external)

Start the bet after all Bettors joined. No additional Bettors can join the bet after it started.


Only the Manager of the bet can start it


### `acceptBet(uint256 betId, uint256 selectedOptionIndex)` (external)

The Bettor can accept a bet and also has to send the funds.




### `postBetResult(uint256 betId, uint256 resultOptionIndex)` (external)

Bettor should post the real outcome of the bet.





