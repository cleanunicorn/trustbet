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
    },
}
