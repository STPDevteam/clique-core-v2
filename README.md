# Clique V2 Smart Contracts

### Local Setup Steps
```shell
# Clone the repository
git clone https://github.com/STPDevteam/clique-core-v2.git

# Install dependencies
npm install

# Set up environment variables (keys)
# TODO: .env.example file still missing
cp .env.example .env # (linux)
copy .env.example .env # (windows)

# compile solidity, the below will automatically also run yarn typechain
npx harhat compile

# test deployment or deploy 
# TODO: we are working on unit test!!!
```

## 📜 Contract Addresses
- For [Goerli Testnet](./docs/deployments/goerli.md).
- For [Mumbai Testnet](./docs/deployments/mumbai.md).