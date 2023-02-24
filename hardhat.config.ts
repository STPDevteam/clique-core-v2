import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers";
import "hardhat-contract-sizer";
import "hardhat-log-remover";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import "solidity-coverage";
import "hardhat-gas-reporter";
import {CHAINID} from "./constants/constants";

require('dotenv').config({path: '.env'})

const ETHERSCAN_API_KEYS: Map<number, string> = new Map<number, string>([
    [CHAINID.ETH_MAINNET, `${process.env.apiKey}`],
    [CHAINID.ETH_GOERLI, `${process.env.apiKey}`],
    [CHAINID.POLYGON, `${process.env.apiKeyPolygon}`],
    [CHAINID.POLYGON_MUMBAI, `${process.env.apiKeyPolygon}`],
    [CHAINID.BSC_MAINNET, `${process.env.apiKeybsc}`],
    [CHAINID.BSC_TESTNET, `${process.env.apiKeybsc}`],
    [CHAINID.POLYGON_MANGO, `${process.env.apiKeyPolygon}`]
]);
const chainId = process.env.CHAINID ? Number(process.env.CHAINID) : 5;

const config: HardhatUserConfig = {
  paths: {
    deploy: "scripts/deploy",
    deployments: "deployments",
  },
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
    goerli: {
      url: `${process.env.provider_goerli}`,
      accounts: {
        mnemonic: `${process.env.mnemonic_goerli}`,
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
    baobab: {
      url: `${process.env.provider_baobab}`,
      accounts: {
        mnemonic: `${process.env.mnemonic_baobab}`,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10
      }
    },
    bsctestnet: {
      url: `${process.env.provider_bsctestnet}`,
      accounts: {
        mnemonic: `${process.env.mnemonic_bsctestnet}`,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10
      }
    },
    // Polygon zkEVM Testnet Mango
    mango: {
      url: `${process.env.provider_mango}`,
      accounts: {
        mnemonic: `${process.env.mnemonic_mango}`,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10
      }
    },

    // hederatestnet: {
    //   url: `${process.env.provider_hederatestnet}`,
    //   accounts: 
    //     ["",""]
    // },

    // Main net
    mainnet: {
      url: `${process.env.provider_mainnet}`,
      accounts: {
        mnemonic: `${process.env.mnemonic_mainnet}`,
        path: "m/44'/60'/0'/0",
        initialIndex: 0 ,
        count: 10
      }
    },

    // Polygon main net
    polygon: {
      url: `${process.env.provider_polygon}`,
      accounts: {
        mnemonic: `${process.env.mnemonic_polygon}`,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10
      }
    },

    // BSC main net
    bsc: {
      url: `${process.env.provider_bsc}`,
      accounts: {
        mnemonic: `${process.env.mnemonic_bsc}`,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10
      }
    },

    // klaytn main net
    klaytn: {
      url: `${process.env.provider_klaytn}`,
      accounts: {
        mnemonic: `${process.env.mnemonic_klaytn}`,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10
      }
    }
  },

  
  namedAccounts: {
    deployer: {
      default: 0,
      1: "0x60d1Ce3e4aC99f1f27f276A26BEeb4454d4f1161",
      5: "0x637856e617b168cF63C0A0E4FEf923be7C67FFcf",
      137: "0x60d1Ce3e4aC99f1f27f276A26BEeb4454d4f1161",
      80001: "0x637856e617b168cF63C0A0E4FEf923be7C67FFcf",
      97: "0x77601d3637e32b2afD6b5d8d97e758e131C85Df1",
    },
    admin: {
      default: 1,
      1: "0x5931f4A88807d29B1732cAe52D5cEa6C3DE2119D",
      5: "0xbC86F047d37D29cB97ee7D860c5355A5f12c62d5",
      137: "0x5931f4A88807d29B1732cAe52D5cEa6C3DE2119D",
      80001: "0xbC86F047d37D29cB97ee7D860c5355A5f12c62d5",
      97: "0xbb61406891A6a330bb49a54856c378F53f2e66B0",
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.com/
    apiKey: ETHERSCAN_API_KEYS.get(chainId)
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
