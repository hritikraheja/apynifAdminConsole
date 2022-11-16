import React, { useEffect, useState } from "react";
import "../css/ActiveUsers.css";
import { Link, useLocation } from "react-router-dom";
import defaultProfileImage from "../assets/defaultProfileImage.jpg";
import ReactLoading from "react-loading";
import { getContractConfigurations } from "../backendServer/contract-config";
import { ethers } from "ethers";
import UserDetails from "./UserDetails.js";
import { writeAdminTxnInDatabase } from "./InitializeFirebaseAuth.js";
import transactionProcessingAnimation from "../assets/transactionProcessing.gif";
import transactionSuccessAnimation from "../assets/transactionSuccess.gif";
import transactionTerminatedAnimation from "../assets/transactionTerminated.gif";

const ActiveUsers = (props) => {
  const [searchBoxQuery, setSearchBoxQuery] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [userDetailsFetched, setUserDetailsFetched] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const query = new URLSearchParams(useLocation().search);
  const [txnStatusDialogOpen, setTxnStatusDialogOpen] = useState(false);
  const [txnState, setTxnState] = useState(0);
  const [txnHashes, setTxnHashes] = useState({
    Goerli: "0x537d5b3d465591d67D2E414B2146C00E8E4C5107",
    Matic: "0x537d5b3d465591d67D2E414B2146C00E8E4C5107",
  });
  const TRANSACTION_STATE_PROCESSING = 0;
  const TRANSACTION_STATE_TERMINATED = -1;
  const TRANSACTION_STATE_SUCCESS = 1;

  /**
   * This hook fetches the details of all the active users.
   */
  useEffect(() => {
    fetch("/fetchActiveUsers")
      .then((res) => res.json())
      .then((json) => {
        setUserDetails(json.result);
        setUserDetailsFetched(true);
      });
      props.resetTimeCount()
  }, []);

  /**
   * This method filters the users based on the search query.
   * @returns An array of details of the filtered users.
   */
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
  
  /**
   * This method opens up the yes/no dialog for the task to be performed.
   * @param head - The head of the dialog to be displayed.
   * @param subhead - The subhead statement of the dialog to be displayed.
   * @param noButtonOnClickHandler - The method to be called when user clicks the NO button.
   * @param yesButtonOnClickHandler - The method to be called when user clicks the YES button.
   */
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

  /**
   * This methods opens up the transaction state dialog that denotes the state of the transaction.
   */
  const openTxnStateDialog = () => {
    setTxnState(TRANSACTION_STATE_PROCESSING);
    setTxnStatusDialogOpen(true);
  };

  /**
   * This method copies the provided text to the clipboard.
   * @param text - The text to be copied on the clipboard.
   */
  const copyTextToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    props.createSuccessNotification("Copied to clipboard!");
  };

  /**
   * This method provides the contract instances of all the contracts on all the supported networks.
   * @returns The instances of all contracts for method calls.
   */
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

  /**
   * This method blocks the user on the chains and writes admin transaction history on the database.
   * @param userAddress The address of the user to be blocked.
   */
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
        '------',
        hashes,
        sessionStorage.getItem("loggedInUser")
      );
      props.createSuccessNotification("User blocked successfully!");
    } catch (e) {
      console.log(e);
    }
  };

  /**
   * This method removes the user from the marketplace on the chains and writes admin transaction history on the database.
   * @param userAddress The address of the user to be removed.
   */
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
        '------',
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
      {!query.get("user") && (
        <div id="activeUsers">
          <p id="head">Active Users</p>
          <p id="subHead">
            <Link to="/">
              <span>{"Dashboard"}</span>
            </Link>
            {" > "}Active Users
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
          <div id="activeUsersContent">
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
                <p id="noBlogsPrompt">
                  Oops.... there are no users to display.
                </p>
              )}
            {userDetailsFetched && resultsAfterSearchQueryAndFilters().length > 0 && (
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
                                "/activeUsers?user=" + val.userAddress;
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
                          <button
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
                          </button>
                          <button
                            id="blockButton"
                            onClick={() => {
                              openDialog(
                                "Block User!",
                                "Are you sure, you want to block this user?",
                                () => setDialogOpen(false),
                                () => blockUser(val.userAddress)
                              );
                            }}
                          >
                            <i className="fa-solid fa-ban"></i>
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
      )}
      {query.get("user") && <UserDetails></UserDetails>}
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
};

export default ActiveUsers;
