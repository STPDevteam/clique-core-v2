import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require('dotenv').config({path: '.env'})

const config: HardhatUserConfig = {
  networks: {
    // Test net
    rinkeby: {
      url: `${process.env.provider_rinkeby}`,
      accounts: {
        mnemonic: `${process.env.mnemonic_rinkeby}`,
        path: "m/44'/60'/0'/0",
        initialIndex: 1,
        count: 10
      }
    },
    mumbai: {
      url: `${process.env.provider_mumbai}`,
      accounts: {
        mnemonic: `${process.env.mnemonic_mumbai}`,
        path: "m/44'/60'/0'/0",
        initialIndex: 1,
        count: 10
      }
    },

    // Main net
    mainnet: {
      url: `${process.env.provider_mainnet}`,
      accounts: {
        mnemonic: `${process.env.mnemonic_mainnet}`,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10
      }
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.com/
    apiKey: {
      rinkeby: `${process.env.apiKey}`,
      polygonMumbai: `${process.env.apiKeyPolygon}`,
      mainnet: `${process.env.apiKey}`
    }
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 800
      }
    }
  },
};

export default config;
