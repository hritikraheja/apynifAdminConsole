var { initializeApp } = require("firebase/app");
var { ref, getDatabase, get, child } = require("firebase/database");
const { getContractConfigurations } = require("./contract-config.js");
const Web3 = require("web3");
var fetch = require("node-fetch");
require("dotenv").config();

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_CONFIG_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_CONFIG_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_CONFIG_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_CONFIG_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_CONFIG_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_CONFIG_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_CONFIG_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db);

var goerli = new Web3(
  new Web3.providers.HttpProvider(
    `https://goerli.infura.io/v3/${process.env.REACT_APP_GOERLI_NETWORK_KEY}`
  )
);
var matic = new Web3(
  new Web3.providers.HttpProvider(
    `https://rpc-mumbai.maticvigil.com/v1/${process.env.REACT_APP_MATIC_NETWORK_KEY}`
  )
);

var goerliConfigurations = getContractConfigurations("5");
var maticConfigurations = getContractConfigurations("80001");

var nftContractGoerli = new goerli.eth.Contract(
  goerliConfigurations.nftContractAbi,
  goerliConfigurations.nftContractAddress
);

var nftContractMatic = new matic.eth.Contract(
  maticConfigurations.nftContractAbi,
  maticConfigurations.nftContractAddress
);

var collectionsContractGoerli = new goerli.eth.Contract(
  goerliConfigurations.collectionsContractAbi,
  goerliConfigurations.collectionsContractAddress
);

var collectionsContractMatic = new matic.eth.Contract(
  maticConfigurations.collectionsContractAbi,
  maticConfigurations.collectionsContractAddress
);

var marketplaceContractGoerli = new goerli.eth.Contract(
  goerliConfigurations.marketplaceContractAbi,
  goerliConfigurations.marketplaceContractAddress
);

var marketplaceContractMatic = new matic.eth.Contract(
  maticConfigurations.marketplaceContractAbi,
  maticConfigurations.marketplaceContractAddress
);

async function fetchActiveUsersDetails() {
  var blockedUsers = await marketplaceContractGoerli.methods
    .getBlockedUsers()
    .call();
  let activeUsers = get(child(dbRef, `users`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        let keys = Object.keys(snapshot.val());
        let result = [];
        for (let i = 0; i < keys.length; i++) {
          if (!blockedUsers.includes(keys[i])) {
            result.push({ ...snapshot.val()[keys[i]], userAddress: keys[i] });
          }
        }
        return result;
      }
    })
    .catch((error) => {
      console.error(error);
      return [];
    });
  return activeUsers;
}

async function fetchBlockedUsersDetails() {
  var resultsGoerli = await marketplaceContractGoerli.methods
    .getBlockedUsers()
    .call();

  let blockedUsers = get(child(dbRef, `users`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        let result = [];
        for (let i = 0; i < resultsGoerli.length; i++) {
            result.push({...snapshot.val()[resultsGoerli[i]], userAddress : resultsGoerli[i]});
        }
        return result;
      }
    })
    .catch((error) => {
      console.error(error);
      return [];
    });

  return blockedUsers;
}

async function fetchUserDetailsByAddress(address) {
  return get(child(dbRef, `users/` + address))
    .then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.val();
      }
    })
    .catch((error) => {
      console.log(error);
      return {};
    });
}

async function getAllNftsByOwnerAddress(address) {
  result = [];
  try {
    let goerliResults = await nftContractGoerli.methods
      .getAllSingleNftsByOwnerAddress(address)
      .call();
    for (let i = 0; i < goerliResults.length; i++) {
      result = [...result, { nftId: parseInt(goerliResults[i]), networkId: 5 }];
    }
    let maticResults = await nftContractMatic.methods
      .getAllSingleNftsByOwnerAddress(address)
      .call();
    for (let i = 0; i < maticResults.length; i++) {
      result = [
        ...result,
        { nftId: parseInt(maticResults[i]), networkId: 80001 },
      ];
    }
  } catch (e) {
    console.log(e);
  }
  try {
    var collectionsResultsGoerli = await collectionsContractGoerli.methods
      .getAllCollections()
      .call();
    var collectionsResultsMatic = await collectionsContractMatic.methods
      .getAllCollections()
      .call();
    collectionsResultsGoerli = collectionsResultsGoerli.filter(
      (obj) => obj.collectionOwnerAddress == address
    );
    collectionsResultsMatic = collectionsResultsMatic.filter(
      (obj) => obj.collectionOwnerAddress == address
    );
    for (let i = 0; i < collectionsResultsGoerli.length; i++) {
      let nftIds = collectionsResultsGoerli[i].nftIds;
      for (let j = 0; j < nftIds.length; j++) {
        result = [
          ...result,
          {
            nftId: parseInt(nftIds[j]),
            networkId: 5,
            collectionName: collectionsResultsGoerli[i].collectionName,
            collectionId: collectionsResultsGoerli[i].collectionId,
          },
        ];
      }
    }

    for (let i = 0; i < collectionsResultsMatic.length; i++) {
      let nftIds = collectionsResultsGoerli[i].nftIds;
      for (let j = 0; j < nftIds.length; j++) {
        result = [
          ...result,
          {
            nftId: parseInt(nftIds[j]),
            networkId: 80001,
            collectionName: collectionsResultsMatic[i].collectionName,
            collectionId: collectionsResultsMatic[i].collectionId,
          },
        ];
      }
    }
  } catch (e) {
    console.log(e);
  }
  return result;
}

async function getNftDetails(nftId, netId) {
  let nftContract;
  let marketplaceContract;
  var netName;
  let currency;
  if (netId == "5") {
    nftContract = nftContractGoerli;
    marketplaceContract = marketplaceContractGoerli;
    netName = "Goerli Testnet";
    currency = "Goerli ETH";
  } else if (netId == "80001") {
    nftContract = nftContractMatic;
    marketplaceContract = marketplaceContractMatic;
    netName = "Mumbai Polygon Testnet";
    currency = "Matic";
  } else {
    return {};
  }
  let receivedNft = await nftContract.methods.getNftByTokenId(nftId).call();
  let receivedAuctionDetails = await marketplaceContract.methods
    .getNftAuctionDetails(nftId)
    .call();
  let timeLeftInAuctionCompletion = await marketplaceContract.methods
    .getTimeLeftInAuctionCompletion(nftId)
    .call();
  let nftName;
  let nftDescription;
  let nftUrl;
  let nftHash;
  if (receivedNft == undefined) {
    return {};
  }
  let price =
    goerli.utils.fromWei(receivedNft.details.price.toString(10), "ether") +
    " " +
    currency;
  try {
    await fetch(receivedNft.uri)
      .then((data) => data.json())
      .then((res) => {
        nftName = res.nftName;
        nftDescription = res.nftDescription;
        nftUrl = res.url;
        nftHash = res.hash;
      });
  } catch (e) {
    console.log(e);
    console.log(receivedNft.uri);
  }

  var nftDetails = {
    nftId: parseInt(receivedNft.details.nftId),
    nftName: nftName,
    nftDescription: nftDescription,
    nftUrl: nftUrl,
    nftHash: nftHash,
    price: price,
    seller: receivedNft.details.seller,
    isSold: receivedNft.details.isSold,
    isListed: receivedNft.details.isListed,
    category: receivedNft.details.category,
    uri: receivedNft.uri,
    coverImageUri: receivedNft.details.coverImageUri,
    networkId: netId,
    networkName: netName,
    highestBidder: receivedAuctionDetails.highestBidder,
    highestBid:
      goerli.utils.fromWei(
        receivedAuctionDetails.highestBid.toString(10),
        "ether"
      ) +
      " " +
      currency,
    bidEndTimestamp: parseInt(receivedAuctionDetails.bid_end_time),
    timeLeftInAuctionCompletion: timeLeftInAuctionCompletion,
  };
  return nftDetails;
}

module.exports = {
  fetchActiveUsersDetails,
  fetchBlockedUsersDetails,
  getAllNftsByOwnerAddress,
  fetchUserDetailsByAddress,
  getNftDetails,
};