import React from "react";
import "../css/BlockedUsers.css";
import { Link, useLocation } from "react-router-dom";
import ReactLoading from "react-loading";
import { useState } from "react";
import defaultProfileImage from "../assets/defaultProfileImage.jpg";
import { useEffect } from "react";
import { getContractConfigurations } from "../backendServer/contract-config";
import { ethers } from "ethers";
import UserDetails from "./UserDetails.js";
import { writeAdminTxnInDatabase } from "./InitializeFirebaseAuth.js";
import transactionProcessingAnimation from "../assets/transactionProcessing.gif";
import transactionSuccessAnimation from "../assets/transactionSuccess.gif";
import transactionTerminatedAnimation from "../assets/transactionTerminated.gif";

function BlockedUsers(props) {
  const [searchBoxQuery, setSearchBoxQuery] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [userDetailsFetched, setUserDetailsFetched] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [txnStatusDialogOpen, setTxnStatusDialogOpen] = useState(false);
  const query = new URLSearchParams(useLocation().search)
  const [txnState, setTxnState] = useState(0);
  const [txnHashes, setTxnHashes] = useState({
    Goerli: "0x537d5b3d465591d67D2E414B2146C00E8E4C5107",
    Matic: "0x537d5b3d465591d67D2E414B2146C00E8E4C5107",
  });
  const TRANSACTION_STATE_PROCESSING = 0;
  const TRANSACTION_STATE_TERMINATED = -1;
  const TRANSACTION_STATE_SUCCESS = 1;

  const resultsAfterSearchQueryAndFilters = () => {
    let result = [];
    userDetails.map((val, key) => {
      if (
        !searchBoxQuery ||
        searchBoxQuery == "" ||
        (searchBoxQuery != "" &&
          ((val.userName &&
            val.userName
              .toLowerCase()
              .includes(searchBoxQuery.toLowerCase())) ||
            (val.firstName &&
              val.firstName
                .toLowerCase()
                .includes(searchBoxQuery.toLowerCase())) ||
            (val.lastName &&
              val.lastName
                .toLowerCase()
                .includes(searchBoxQuery.toLowerCase())) ||
            (val.userAddress &&
              val.userAddress
                .toLowerCase()
                .includes(searchBoxQuery.toLowerCase())))) ||
        (val.userAbout &&
          val.userAbout.toLowerCase().includes(searchBoxQuery.toLowerCase()))
      ) {
        result = [...result, val];
      }
    });
    return result;
  };

  const copyTextToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    props.createSuccessNotification("Copied to clipboard!");
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

  const openTxnStateDialog = () => {
    setTxnState(TRANSACTION_STATE_PROCESSING);
    setTxnStatusDialogOpen(true);
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
      marketplaceContractGoerli: marketplaceContractGoerli,
      marketplaceContractMatic: marketplaceContractMatic,
    };
  }

  const unblockUser = async (userAddress) => {
    setDialogOpen(false);
    openTxnStateDialog();
    const contracts = getContracts();
    try {
      var goerliTxn =
        await contracts.marketplaceContractGoerli.unblockUser(userAddress);
      var maticTxn =
        await contracts.marketplaceContractMatic.unblockUser(userAddress);
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

  useEffect(() => {
    fetch("/fetchBlockedUsers")
      .then((obj) => obj.json())
      .then((json) => {
        setUserDetails(json.result);
        setUserDetailsFetched(true);
      })
  }, []);

  return (
    <div>
      <div id="blockedUsers">
        <p id="head">Blocked Users</p>
        <p id="subHead">
          <Link to="/">
            <span>{"Dashboard"}</span>
          </Link>
          {" > "}Blocked Users
        </p>
        <div id="header">
          <div id="searchBox">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              defaultValue={searchBoxQuery}
              placeholder="Search"
              onChange={(e) => setSearchBoxQuery(e.target.value)}
            ></input>
          </div>
          <p id="filters">
            <i class="fa-solid fa-sliders"></i>
          </p>
        </div>
        <div id="blockedUsersContent">
          {!userDetailsFetched && (
            <ReactLoading
              className="loadingAnimation"
              type="spinningBubbles"
              color="red"
              width="75px"
              height="75px"
            ></ReactLoading>
          )}
          {userDetailsFetched &&
            resultsAfterSearchQueryAndFilters().length == 0 && (
              <p id="noBlogsPrompt">Oops.... there are no users to display.</p>
            )}
          {userDetails && resultsAfterSearchQueryAndFilters().length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Profile Picture</th>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Wallet Address</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {resultsAfterSearchQueryAndFilters().map((val, key) => {
                  return (
                    <tr id="user" key={key}>
                      <td id="profilePictureCol">
                        <img
                          onClick={() => {
                            window.location =
                              "/blockedUsers?user=" + val.userAddress;
                          }}
                          src={
                            val.profileImageSrc && val.profileImageSrc != ""
                              ? val.profileImageSrc
                              : defaultProfileImage
                          }
                        ></img>
                      </td>
                      <td>
                        {val.firstName || val.lastName
                          ? val.firstName + " " + val.lastName
                          : "------"}
                      </td>
                      <td>{val.userName ? val.userName : "------"}</td>
                      <td>{val.userAddress}</td>
                      <td id="buttonsCol">
                        {/* <button
                          id="removeButton"
                            onClick={() => {
                              openDialog(
                                "Remove User!",
                                "Are you sure, you want to remove this user?",
                                () => setDialogOpen(false),
                                () => removeUser(val.userAddress)
                              );
                            }}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button> */}
                        <button
                          id="unblockButton"
                            onClick={() => {
                              openDialog(
                                "Unblock User!",
                                "Are you sure, you want to unblock this user?",
                                () => setDialogOpen(false),
                                () => unblockUser(val.userAddress)
                              );
                            }}
                        >
                          <i class="fas fa-user-check"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div
        id="dialogDiv"
        style={{
          display: dialogOpen || txnStatusDialogOpen ? "block" : "none",
        }}
      >
        <dialog open={dialogOpen} id="dialog">
          <p id="dialogHead">Block User!</p>
          <p id="dialogSubhead">Are you sure, you want to unblock this user?</p>
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
    </div>
  );
}

export default BlockedUsers;
