import React, { useEffect, useState } from "react";
import "../css/UserDetails.css";
import { Link, useLocation } from "react-router-dom";
import defaultProfileImage from "../assets/defaultProfileImage.jpg";
import ReactLoading from "react-loading";
import Countdown from "react-countdown";
import {
  writeAdminTxnInDatabase,
  writeRemovedItemInDatabase,
} from "../components/InitializeFirebaseAuth";
import { getContractConfigurations } from "../backendServer/contract-config";
import { ethers } from "ethers";
import transactionProcessingAnimation from "../assets/transactionProcessing.gif";
import transactionSuccessAnimation from "../assets/transactionSuccess.gif";
import transactionTerminatedAnimation from "../assets/transactionTerminated.gif";

function UserDetails(props) {
  const [userDetails, setUserDetails] = useState(null);
  const [userDetailsFetched, setUserDetailsFetched] = useState(false);
  const [nfts, setNfts] = useState([]);
  const [nftsFetched, setNftsFetched] = useState(false);
  const [optionsSelected, setOptionSelected] = useState(0);
  const [numberOfItemsToBeDisplayed, setNumberOfItemsToBeDisplayed] =
    useState(6);
  const query = new URLSearchParams(useLocation().search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [txnStatusDialogOpen, setTxnStatusDialogOpen] = useState(false);
  const [txnState, setTxnState] = useState(0);
  const [userBlocked, setUserBlocked] = useState(false);
  const [txnHashes, setTxnHashes] = useState({
    Goerli: "0x537d5b3d465591d67D2E414B2146C00E8E4C5107",
    Matic: "0x537d5b3d465591d67D2E414B2146C00E8E4C5107",
  });
  const TRANSACTION_STATE_PROCESSING = 0;
  const TRANSACTION_STATE_TERMINATED = -1;
  const TRANSACTION_STATE_SUCCESS = 1;

  // useEffect(() => {
  //   fetch(`checkUserBlocked?user=${query.get('user')}`)
  //     .then((res) => res.json())
  //     .then((json) => {
  //       setUserBlocked(json.result);
  //     });
  // }, []);

  useEffect(() => {
    fetch("/getUserDetailsByAddress?user=" + query.get("user"))
      .then((res) => res.json())
      .then((json) => {
        setUserDetails(json.result);
        setUserDetailsFetched(true);
      });
  }, []);

  useEffect(() => {
    if (!userDetails) {
      return;
    }
    let temp = [];
    if (userDetails.nfts.length == 0) {
      if (!nftsFetched) {
        setNftsFetched(true);
      }
    }
    for (let i = 0; i < userDetails.nfts.length; i++) {
      fetch(
        "/getNftDetails?" +
          new URLSearchParams({
            nftId: userDetails.nfts[i].nftId,
            netId: userDetails.nfts[i].networkId,
          })
      )
        .then((res) => res.json())
        .then((json) => {
          let fetchedResult = json.result;
          if (userDetails.nfts[i].collectionName) {
            fetchedResult["collectionName"] =
              userDetails.nfts[i].collectionName;
          }
          if (userDetails.nfts[i].collectionId) {
            fetchedResult["collectionId"] = userDetails.nfts[i].collectionId;
          }
          temp = [...temp, fetchedResult];
          setNfts(temp);
          if (!nftsFetched) {
            setNftsFetched(true);
          }
        });
    }
  }, [userDetails]);

  function filteredNftResults() {
    if (optionsSelected == 0) {
      return nfts.filter((nft) => !nft.isSold);
    } else if (optionsSelected == 1) {
      return nfts.filter((nft) => nft.isSold);
    } else if (optionsSelected == 2) {
      return nfts.filter((nft) => !nft.isListed);
    } else if (optionsSelected == 3) {
      return nfts.filter((nft) => nft.bidEndTimestamp != "0");
    } else if (optionsSelected == 4) {
      return nfts.filter((nft) => nft.bidEndTimestamp == "0" && nft.isListed);
    }
  }

  const timerRenderer = ({ days, hours }) => {
    return (
      <p id="timeLeftInAuctionCompletion">
        {days} Days {hours} hrs <span>Left</span>
      </p>
    );
  };

  function getContracts() {
    var goerliWallet = new ethers.Wallet(
      process.env.REACT_APP_WALLET_ACCOUNT_PRIVATE_KEY,
      new ethers.providers.JsonRpcProvider(
        `https://goerli.infura.io/v3/${process.env.REACT_APP_GOERLI_NETWORK_KEY}`
      )
    );

    var maticWallet = new ethers.Wallet(
      process.env.REACT_APP_WALLET_ACCOUNT_PRIVATE_KEY,
      new ethers.providers.JsonRpcProvider(
        `https://rpc-mumbai.maticvigil.com/v1/${process.env.REACT_APP_MATIC_NETWORK_KEY}`
      )
    );

    var goerliConfigurations = getContractConfigurations("5");
    var maticConfigurations = getContractConfigurations("80001");

    var nftContractGoerli = new ethers.Contract(
      goerliConfigurations.nftContractAddress,
      goerliConfigurations.nftContractAbi,
      goerliWallet
    );
    var nftContractMatic = new ethers.Contract(
      maticConfigurations.nftContractAddress,
      maticConfigurations.nftContractAbi,
      maticWallet
    );
    var marketplaceContractGoerli = new ethers.Contract(
      goerliConfigurations.marketplaceContractAddress,
      goerliConfigurations.marketplaceContractAbi,
      goerliWallet
    );
    var marketplaceContractMatic = new ethers.Contract(
      maticConfigurations.marketplaceContractAddress,
      maticConfigurations.marketplaceContractAbi,
      maticWallet
    );

    return {
      nftContractGoerli: nftContractGoerli,
      nftContractMatic: nftContractMatic,
      marketplaceContractGoerli: marketplaceContractGoerli,
      marketplaceContractMatic: marketplaceContractMatic,
    };
  }

  const copyTextToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    props.createSuccessNotification("Copied to clipboard!");
  };

  const openTxnStateDialog = () => {
    setTxnState(TRANSACTION_STATE_PROCESSING);
    setTxnStatusDialogOpen(true);
  };

  const openDialog = (
    head,
    subhead,
    noButtonOnClickHandler,
    yesButtonOnClickHandler
  ) => {
    document.getElementById("dialogHead").innerHTML = head;
    document.getElementById("dialogSubhead").innerHTML = subhead;
    document.getElementById("noButton").onclick = noButtonOnClickHandler;
    document.getElementById("yesButton").onclick = yesButtonOnClickHandler;
    setDialogOpen(true);
  };

  const removeItem = async (nftId, netId, itemDetails) => {
    setDialogOpen(false);
    openTxnStateDialog();
    const contracts = getContracts();
    if (netId != "5" && netId != "80001") {
      setTxnState(TRANSACTION_STATE_TERMINATED);
      console.err("Network not supported");
      return;
    }
    try {
      let txn;
      var hashes;
      if (netId == "5") {
        txn = await contracts.marketplaceContractGoerli.removeNft(nftId);
        hashes = {
          goerli: txn.hash,
        };
        setTxnHashes({
          Goerli: txn.hash,
        });
      } else if (netId == "80001") {
        txn = await contracts.marketplaceContractMatic.removeNft(nftId);
        hashes = {
          matic: txn.hash,
        };
        setTxnHashes({
          Matic: txn.hash,
        });
      }
      setTxnState(TRANSACTION_STATE_SUCCESS);
    } catch (err) {
      setTxnState(TRANSACTION_STATE_TERMINATED);
      console.log(err);
      return;
    }
    try {
      await writeAdminTxnInDatabase(
        "Item Removed",
        `Item id : ${nftId} on ${netId == "5" ? "Goerli" : "Matic"}`,
        hashes,
        sessionStorage.getItem("loggedInUser")
      );
      await writeRemovedItemInDatabase(itemDetails);
      props.createSuccessNotification("Item removed successfully!");
    } catch (e) {
      console.log(e);
    }
  };

  const blockUser = async (userAddress) => {
    setDialogOpen(false);
    openTxnStateDialog();
    const contracts = getContracts();
    try {
      var goerliTxn = await contracts.marketplaceContractGoerli.blockUser(
        userAddress
      );
      var maticTxn = await contracts.marketplaceContractMatic.blockUser(
        userAddress
      );
      var hashes = {
        goerli: goerliTxn.hash,
        matic: maticTxn.hash,
      };
      setTxnHashes({
        Goerli: goerliTxn.hash,
        Matic: maticTxn.hash,
      });
      setTxnState(TRANSACTION_STATE_SUCCESS);
    } catch (err) {
      setTxnState(TRANSACTION_STATE_TERMINATED);
      console.log(err);
      return;
    }
    try {
      await writeAdminTxnInDatabase(
        "User blocked",
        userAddress,
        hashes,
        sessionStorage.getItem("loggedInUser")
      );
      props.createSuccessNotification("User blocked successfully!");
    } catch (e) {
      console.log(e);
    }
  };

  const unblockUser = async (userAddress) => {
    setDialogOpen(false);
    openTxnStateDialog();
    const contracts = getContracts();
    try {
      var goerliTxn = await contracts.marketplaceContractGoerli.unblockUser(
        userAddress
      );
      var maticTxn = await contracts.marketplaceContractMatic.unblockUser(
        userAddress
      );
      var hashes = {
        goerli: goerliTxn.hash,
        matic: maticTxn.hash,
      };
      setTxnHashes({
        Goerli: goerliTxn.hash,
        Matic: maticTxn.hash,
      });
      setTxnState(TRANSACTION_STATE_SUCCESS);
    } catch (err) {
      setTxnState(TRANSACTION_STATE_TERMINATED);
      console.log(err);
      return;
    }
    try {
      await writeAdminTxnInDatabase(
        "User unblock",
        userAddress,
        hashes,
        sessionStorage.getItem("loggedInUser")
      );
      props.createSuccessNotification("User unblocked successfully!");
    } catch (e) {
      console.log(e);
    }
  };

  const removeUser = async (userAddress) => {
    setDialogOpen(false);
    openTxnStateDialog();
    const contracts = getContracts();
    try {
      var goerliTxn = await contracts.marketplaceContractGoerli.removeUser(
        userAddress
      );
      var maticTxn = await contracts.marketplaceContractMatic.removeUser(
        userAddress
      );
      var hashes = {
        goerli: goerliTxn.hash,
        matic: maticTxn.hash,
      };
      setTxnHashes({
        Goerli: goerliTxn.hash,
        Matic: maticTxn.hash,
      });
      setTxnState(TRANSACTION_STATE_SUCCESS);
    } catch (err) {
      setTxnState(TRANSACTION_STATE_TERMINATED);
      console.log(err);
      return;
    }
    try {
      await writeAdminTxnInDatabase(
        "User removed",
        userAddress,
        hashes,
        sessionStorage.getItem("loggedInUser")
      );
      props.createSuccessNotification("User removed successfully!");
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      {!userDetailsFetched && (
        <ReactLoading
          className="loadingAnimation"
          type="spinningBubbles"
          color="red"
          width="75px"
          height="75px"
        ></ReactLoading>
      )}
      {userDetailsFetched && (
        <div id="userDetails">
          <h1>{userBlocked}</h1>
          <p id="head">User Details</p>
          <p id="subHead">
            <Link to="/">
              <span>Dashboard</span>
            </Link>
            {" > "}
            <Link to="/activeUsers">
              <span>Active Users</span>
            </Link>
            {" > "}User Details
          </p>
          <p id="userDetailsHead">PERSONAL DETAILS</p>
          <img
            id="profileImage"
            src={
              userDetails.profileImageSrc
                ? userDetails.profileImageSrc
                : defaultProfileImage
            }
          ></img>
          <div id="personalDetailsDiv">
            <p>
              Full Name :
              <span>
                {userDetails.firstName || userDetails.lastName
                  ? userDetails.firstName + " " + userDetails.lastName
                  : "------"}
              </span>
            </p>
            <p>
              Username :{" "}
              <span>
                {userDetails.userName ? userDetails.userName : "------"}
              </span>
            </p>
            <p>
              Wallet Address : <span>{query.get("user")}</span>
            </p>
          </div>
          {userDetails.userAbout && (
            <>
              <p id="userAboutLabel">About :</p>
              <p id="userAbout">{userDetails.userAbout}</p>
            </>
          )}
          {userDetails.links &&
            (userDetails.links.facebook ||
              userDetails.links.dribble ||
              userDetails.links.linkedin ||
              userDetails.links.twitter ||
              userDetails.links.pinterest ||
              userDetails.links.behance) && (
              <>
                <p id="userDetailsHead">SOCIAL LINKS</p>
                <div id="socialLinks">
                  {userDetails.links && userDetails.links.facebook && (
                    <p>
                      Facebook : <span>{userDetails.links.facebook}</span>
                    </p>
                  )}
                  {userDetails.links && userDetails.links.linkedin && (
                    <p>
                      LinkedIn : <span>{userDetails.links.linkedin}</span>
                    </p>
                  )}
                  {userDetails.links && userDetails.links.twitter && (
                    <p>
                      Twitter : <span>{userDetails.links.twitter}</span>
                    </p>
                  )}
                  {userDetails.links && userDetails.links.pinterest && (
                    <p>
                      Pinterest : <span>{userDetails.links.pinterest}</span>
                    </p>
                  )}
                  {userDetails.links && userDetails.links.behance && (
                    <p>
                      Behance : <span>{userDetails.links.behance}</span>
                    </p>
                  )}
                  {userDetails.links && userDetails.links.dribble && (
                    <p>
                      Dribble : <span>{userDetails.links.dribble}</span>
                    </p>
                  )}
                </div>
              </>
            )}
          <p id="userDetailsHead">NFT DETAILS</p>
          <select
            onChange={(e) => {
              setOptionSelected(e.target.value);
            }}
          >
            <option value={0} selected>
              Created Items
            </option>
            <option value={1}>Bought Items</option>
            <option value={2}>Unlisted Items</option>
            <option value={3}>On Auction</option>
            <option value={4}>Up For Sale</option>
          </select>
          {!nftsFetched && (
            <ReactLoading
              className="loadingAnimation"
              type="spinningBubbles"
              color="red"
              width="75px"
              height="75px"
            ></ReactLoading>
          )}
          {nftsFetched && filteredNftResults().length == 0 && (
            <p id="noNftsPrompt">Ooops..... there are no items to display</p>
          )}
          <div id="nftsDiv">
            {nftsFetched &&
              filteredNftResults().length > 0 &&
              filteredNftResults()
                .slice(0, numberOfItemsToBeDisplayed)
                .map((nft, key) => {
                  return (
                    <div id="nft" key={key}>
                      <div id="imageAndCategory">
                        <img id="coverImage" src={nft.coverImageUri}></img>
                        <p id="category">{nft.category}</p>
                        {nft.bidEndTimestamp != 0 && (
                          <Countdown
                            className="timer"
                            date={
                              Date.now() +
                              nft.timeLeftInAuctionCompletion * 1000
                            }
                            renderer={timerRenderer}
                          ></Countdown>
                        )}
                      </div>
                      <p id="name">{nft.nftName}</p>
                      <p id="seller">
                        Seller : <br></br>
                        <span>{nft.seller}</span>
                      </p>
                      <div id="priceDetails">
                        {nft.bidEndTimestamp != 0 ? (
                          nft.highestBidder ==
                          "0x0000000000000000000000000000000000000000" ? (
                            <p id="bid">
                              Base Price : <span>{nft.highestBid}</span>
                            </p>
                          ) : (
                            <div>
                              <p id="bidder">
                                Highest Bidder : <br></br>
                                <span>{nft.highestBidder}</span>
                              </p>
                              <p id="bid">
                                Highest Bid : <span>{nft.highestBid}</span>
                              </p>
                            </div>
                          )
                        ) : (
                          <p id="bid">
                            Price : <span>{nft.price}</span>
                          </p>
                        )}
                        <div id="likesDiv">
                          <i className="fa-solid fa-heart"></i>
                          <p>40</p>
                        </div>
                      </div>
                      <button
                        id="removeButton"
                        onClick={() => {
                          openDialog(
                            "Remove Item!",
                            "Are you sure, you want to remove this item?",
                            () => setDialogOpen(false),
                            () => removeItem(nft.nftId, nft.networkId, nft)
                          );
                        }}
                      >
                        Remove Item
                      </button>
                    </div>
                  );
                })}
          </div>
          {numberOfItemsToBeDisplayed < filteredNftResults().length && (
            <button
              id="viewMoreButton"
              onClick={() => {
                setNumberOfItemsToBeDisplayed(numberOfItemsToBeDisplayed + 6);
              }}
            >
              View More
            </button>
          )}
          <div id="userDetailsButtonsDiv">
            {!userBlocked && <button
              title="Remove User"
              onClick={() => {
                openDialog(
                  "Remove User!",
                  "Are you sure, you want to remove this user?",
                  () => setDialogOpen(false),
                  () => removeUser(query.get("user"))
                );
              }}
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>}
            {!userBlocked && <button
              title="Block User"
              onClick={() => {
                openDialog(
                  "Block User!",
                  "Are you sure, you want to block this user?",
                  () => setDialogOpen(false),
                  () => blockUser(query.get("user"))
                );
              }}
            >
              <i className="fa-solid fa-ban"></i>
            </button>}
            {userBlocked && <button
              id="unblockButton"
              onClick={() => {
                openDialog(
                  "Unblock User!",
                  "Are you sure, you want to unblock this user?",
                  () => setDialogOpen(false),
                  () => unblockUser(query.get('user'))
                );
              }}
            >
              <i class="fas fa-user-check"></i>
            </button>}
          </div>
        </div>
      )}
      <div
        id="dialogDiv"
        style={{
          display: dialogOpen || txnStatusDialogOpen ? "block" : "none",
        }}
      >
        <dialog open={dialogOpen} id="dialog">
          <p id="dialogHead">Block User!</p>
          <p id="dialogSubhead">Are you sure, you want to block this user?</p>
          <div id="dialogButtonsDiv">
            <button id="noButton">No</button>
            <button id="yesButton">Yes</button>
          </div>
        </dialog>
        <dialog id="txnStateDialog" open={txnStatusDialogOpen}>
          <img
            style={{
              width:
                txnState == TRANSACTION_STATE_PROCESSING ? "350px" : "250px",
              padding:
                txnState == TRANSACTION_STATE_PROCESSING ? "10px" : "20px 40px",
            }}
            src={
              txnState == TRANSACTION_STATE_PROCESSING
                ? transactionProcessingAnimation
                : txnState == TRANSACTION_STATE_SUCCESS
                ? transactionSuccessAnimation
                : transactionTerminatedAnimation
            }
          ></img>
          {txnState == TRANSACTION_STATE_SUCCESS && (
            <>
              <p id="txnStateHead">Transaction Hash Generated</p>
              <p id="txnStateSubhead">Wait for the transactions to complete.</p>
              {Object.keys(txnHashes).map((item) => {
                return (
                  <p id="txnStateHash">
                    {item} :{" "}
                    <span
                      onClick={() => {
                        copyTextToClipboard(txnHashes[item]);
                      }}
                    >
                      {txnHashes[item] &&
                        txnHashes[item].substring(0, 10) +
                          "...." +
                          txnHashes[item].substring(31)}
                    </span>
                  </p>
                );
              })}
            </>
          )}
          {txnState == TRANSACTION_STATE_TERMINATED && (
            <>
              <p id="txnStateHead">Oops.... transaction terminated</p>
              <p id="txnStateSubhead">Check console for logs</p>
            </>
          )}
          <button
            id="closeDialogButton"
            onClick={() => setTxnStatusDialogOpen(false)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </dialog>
      </div>
    </>
  );
}

export default UserDetails;
