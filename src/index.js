const Web3 = require('web3');

const { abi } = require('../build/contracts/TrustBet.json')

async function main() {
    const web3 = new Web3(`http://localhost:7545`)
    const accounts = await web3.eth.getAccounts();
    // console.log(accounts);

    /* You need to add the deployed contract address in TrustBetAddress
    To deploy the contract you need to run `npx oz create`

    $ npx oz create                                                                           130 ↵
    Nothing to compile, all contracts are up to date.
    ? Pick a contract to instantiate TrustBet
    ? Pick a network development
    All implementations are up to date
    ? Call a function to initialize the instance after creating it? No
    ✓ Instance created at 0xB9A3807c287b001619c21f0c3ae4BeccaDb7e6D1
    0xB9A3807c287b001619c21f0c3ae4BeccaDb7e6D1
    */
    const TrustBetAddress = "0xB9A3807c287b001619c21f0c3ae4BeccaDb7e6D1"
    const TrustBet = new web3.eth.Contract(abi, TrustBetAddress);

    const [manager, trustee, bettorA, bettorB] = accounts

    const createBetTx = await TrustBet.methods.createBet(
        // name
        "Answer to life",
        // description
        "What is the answer to life the universe and everything?",
        // options
        [
            "42",
            "Money",
        ],
        // value
        new Web3.utils.BN('10'),
        // trustee
        trustee
    ).send(
        {
            from: manager,
            gas: 500000,
        },
    )

    // Full emitted event
    console.log(createBetTx.events['CreatedBet'])
}

main();
