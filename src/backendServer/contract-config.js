const Nft = require("../abis/NFT.json");
const Collections = require("../abis/Collections.json");
const Businesses = require("../abis/Businesses.json");
const Marketplace = require("../abis/Marketplace.json");

/**
 * This method returns the ABI and addresses of all deployed contracts.
 * It fetches the above details from the json files in the abis(Application Binary Interfaces) folder.
 *
 * @param networkId - The id of the network at which the deployment address is to be fetched.
 * @returns An object containing all contract ABIs and deployment addresses on all supported chains.
 */
function getContractConfigurations(networkId) {
  const NFT_CONTRACT_ABI = Nft.abi;
  const COLLECTIONS_CONTRACT_ABI = Collections.abi;
  const BUSINESSES_CONTRACT_ABI = Businesses.abi;
  const MARKETPLACE_CONTRACT_ABI = Marketplace.abi;

  var nftContractData = Nft.networks[networkId];
  var collectionsContractData = Collections.networks[networkId];
  var businessesContractData = Businesses.networks[networkId];
  var marketplaceContractData = Marketplace.networks[networkId];

  var NFT_CONTRACT_ADDRESS;
  var COLLECTIONS_CONTRACT_ADDRESS;
  var BUSINESSES_CONTRACT_ADDRESS;
  var MARKETPLACE_CONTRACT_ADDRESS;

  if (nftContractData) {
    NFT_CONTRACT_ADDRESS = nftContractData.address;
  } else {
    NFT_CONTRACT_ADDRESS = undefined;
    console.log("NFT contract is not deployed on this network.");
  }

  if (collectionsContractData) {
    COLLECTIONS_CONTRACT_ADDRESS = collectionsContractData.address;
  } else {
    COLLECTIONS_CONTRACT_ADDRESS = undefined;
    console.log("Collections contract is not deployed on this network.");
  }

  if (businessesContractData) {
    BUSINESSES_CONTRACT_ADDRESS = businessesContractData.address;
  } else {
    BUSINESSES_CONTRACT_ADDRESS = undefined;
    console.log("Businesses contract is not deployed on this network.");
  }

  if (marketplaceContractData) {
    MARKETPLACE_CONTRACT_ADDRESS = marketplaceContractData.address;
  } else {
    MARKETPLACE_CONTRACT_ADDRESS = undefined;
    console.log("Marketplace contract is not deployed on this network.");
  }

  return {
    nftContractAbi: NFT_CONTRACT_ABI,
    nftContractAddress: NFT_CONTRACT_ADDRESS,
    collectionsContractAbi: COLLECTIONS_CONTRACT_ABI,
    collectionsContractAddress: COLLECTIONS_CONTRACT_ADDRESS,
    businessesContractAbi: BUSINESSES_CONTRACT_ABI,
    businessContractAddress: BUSINESSES_CONTRACT_ADDRESS,
    marketplaceContractAbi: MARKETPLACE_CONTRACT_ABI,
    marketplaceContractAddress: MARKETPLACE_CONTRACT_ADDRESS,
  };
}

module.exports = {
  getContractConfigurations,
};
