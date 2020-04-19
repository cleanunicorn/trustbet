const {
    mnemonic,
} = require('./secrets.json')
const HDWalletProvider = require('@truffle/hdwallet-provider')

module.exports = {
    networks: {
        development: {
            provider: () => new HDWalletProvider(
                mnemonic, 'http://localhost:7545',
            ),
            networkId: 5777,
            gasPrice: 1,
        },
        ropsten: {
            provider: () => new HDWalletProvider(
                mnemonic, 'https://ropsten.infura.io/v3/aae9ac7ee0e14e4ea9d7cced4bcee1a5'
            ),
            networkId: 3,
            gasPrice: 1000,
        }
    },
}
