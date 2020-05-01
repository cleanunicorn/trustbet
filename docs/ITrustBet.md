## `ITrustBet`






### `betDetails(uint256 betId) → uint256, string, string, string[], uint256, address, address, uint256, enum ITrustBet.BetStatus, address[] bettors, uint256[] selectedOptionIndexes, int256[] resultOptionIndexes` (external)

Returns bet details



### `betSelectedOption(uint256 betId, address bettor) → uint256` (external)

Return index of selected bet option by the bettor



### `createBet(string name, string description, string[] options, uint256 value, address trustee, uint256 expirationDate) → uint256 betId` (external)





### `startBet(uint256 betId)` (external)





### `acceptBet(uint256 betId, uint256 optionIndex)` (external)





### `postBetResult(uint256 betId, uint256 optionIndex)` (external)






### `CreatedBet(uint256 betId, string name, string description, string[] options, uint256 value, address trustee, uint256 expirationDate)`





### `BetStarted(uint256 betId)`





### `BetClosed(uint256 betId, uint256 winningOptionIndex)`





### `BetDisputed(uint256 betId)`





### `BetAccepted(uint256 betId, address bettor, uint256 selectedOptionIndex, uint256 value)`





### `BetResultPosted(uint256 betId, uint256 optionIndex)`





