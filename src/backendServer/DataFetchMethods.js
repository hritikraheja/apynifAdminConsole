var { initializeApp } = require("firebase/app");
var { ref, getDatabase, get, child } = require("firebase/database");
const { getContractConfigurations } = require("./contract-config.js");
const Web3 = require("web3");
var fetch = require("node-fetch");
require("dotenv").config();

/**
 * The firebase project configuration.
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_CONFIG_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_CONFIG_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_CONFIG_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_CONFIG_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_CONFIG_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_CONFIG_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_CONFIG_APP_ID,
};

/**
 * This file contains controller methods for all the routes specified in the server.js
 */

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

/**
 * Contract instances of various deployed contracts on the specified networks.
 */
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

/**
 * This method provides the nftId and netId of all the nfts that are listed to the marketplace,
 * whether they are single items or collections.
 * @returns An array of items with their respective nftIds and networkIds.
 */
async function getAllNfts() {
  var results = [];
  try {
    var singleItemsGoerli = await nftContractGoerli.methods
      .getListedSingleNftIds()
      .call();
    singleItemsGoerli.forEach((id) => {
      results.push({ nftId: id, netId: 5 });
    });
  } catch (e) {
    console.log(e);
  }
  try {
    var singleItemsMatic = await nftContractMatic.methods
      .getListedSingleNftIds()
      .call();
    singleItemsMatic.forEach((id) => {
      results.push({ nftId: id, netId: 80001 });
    });
  } catch (e) {
    console.log(e);
  }
  try {
    let collectionGoerli = await collectionsContractGoerli.methods
      .getAllCollections()
      .call();
    collectionGoerli.forEach((col) => {
      col.nftIds.forEach((id) => {
        results.push({
          nftId: id,
          netId: 5,
          collectionId: col.collectionId,
          collectionName: col.collectionName,
        });
      });
    });
  } catch (err) {
    console.log(err);
  }

  try {
    let collectionMatic = await collectionsContractMatic.methods
      .getAllCollections()
      .call();
    collectionMatic.forEach((col) => {
      col.nftIds.forEach((id) => {
        results.push({
          nftId: id,
          netId: 80001,
          collectionId: col.collectionId,
          collectionName: col.collectionName,
        });
      });
    });
  } catch (err) {
    console.log(err);
  }
  return results;
}

/**
 * This method returns the details of all the active users.
 * @returns An array of details of all active users.
 */
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

/**
 * This method returns the details of all the blocked users.
 * @returns An array of details of all the blocked users.
 */
async function fetchBlockedUsersDetails() {
  var resultsGoerli = await marketplaceContractGoerli.methods
    .getBlockedUsers()
    .call();

  let blockedUsers = get(child(dbRef, `users`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        let result = [];
        for (let i = 0; i < resultsGoerli.length; i++) {
          result.push({
            ...snapshot.val()[resultsGoerli[i]],
            userAddress: resultsGoerli[i],
          });
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

/**
 * This method returns the details of the user by their respective wallet address.
 * @param address - The address of the user whose details are to be fetched.
 * @returns The details of the user.
 */
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

/**
 * This method returns the details of all the items that are removed from the marketplace.
 * @returns An array of details of all the items that are removed from the marketplace.
 */
async function getRemovedItems() {
  let result = [];
  await get(child(dbRef, "removedItems"))
    .then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((childSnap) => {
          result.push({ ...childSnap.val(), key: childSnap.key });
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
  return result;
}

/**
 * This method returns the details of nfts owned by a user by their respective address.
 * @param address - The address of the user whose nft details are to be fetched. 
 * @returns An array of details of all the items owned by the user with the provided wallet address.
 */
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
      let nftIds = collectionsResultsMatic[i].nftIds;
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

/**
 * This method returns the details of the provided nftId on the specified network.
 * @param nftId - The id of the nft whose details are to be fetched.
 * @param netId - The network on which the nft is created.
 * @returns The details of the item.
 */
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

/**
 * This method checks whether the provided address is blocked or not.
 * @param user - The user address to be checked.
 * @returns A boolean value representing whether the user is blocked.
 */
async function checkUserBlocked(user) {
  var result = await marketplaceContractGoerli.methods.getBlockedUsers().call();
  return result.includes(user);
}

/**
 * This method returns all the admin transactions to be displayed on the dashboard.
 * @returns An array of details of all the admin transactions.
 */
async function getAdminTransactions() {
  let adminTransactions = get(child(dbRef, `adminTransactions`)).then(
    (snapshot) => {
      if (snapshot.exists()) {
        let keys = Object.keys(snapshot.val());
        let result = [];
        for (let i = 0; i < keys.length; i++) {
          var txn = snapshot.val()[keys[i]]
          // let hashKeys = Object.keys(txn.txnHashes)
          // let hashes = []
          // for(let j = 0; j < hashKeys.length; j++){
          //   hashes.push(JSON.parse(`{"${hashKeys[j]}":"${txn.txnHashes[hashKeys[j]]}"}`))
          // }
          // txn.txnHashes = hashes;
          result.push({...snapshot.val()[keys[i]], key : keys[i]})
        }
        return result;
      }
    }
  ).catch((error) => {
    console.error(error);
    return [];
  });
  return adminTransactions;
}

async function getDashboardStats(){
  let usersCount = await get(child(dbRef, `users`))
  .then((snapshot)=> {
    if(snapshot.exists()){
      let keys = Object.keys(snapshot.val())
      return keys.length;
    } else {
      return 0;
    }
  }).catch((err) => {
    console.log(err)
    return 0;
  })

  let listedItems = await getAllNfts()
  return { usersCount : usersCount, itemsCount : listedItems.length }
}

module.exports = {
  fetchActiveUsersDetails,
  fetchBlockedUsersDetails,
  getAllNftsByOwnerAddress,
  fetchUserDetailsByAddress,
  getNftDetails,
  getAllNfts,
  getRemovedItems,
  checkUserBlocked,
  getAdminTransactions,
  getDashboardStats,
};
