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
  const [txnState, setTxnState] = useState(1);
  const [txnHashes, setTxnHashes] = useState({
    Goerli: "0x537d5b3d465591d67D2E414B2146C00E8E4C5107",
    Matic: "0x537d5b3d465591d67D2E414B2146C00E8E4C5107",
  });
  const TRANSACTION_STATE_PROCESSING = 0;
  const TRANSACTION_STATE_TERMINATED = -1;
  const TRANSACTION_STATE_SUCCESS = 1;

  useEffect(() => {
    fetch("/fetchActiveUsers")
      .then((res) => res.json())
      .then((json) => {
        setUserDetails(json.result);
        setUserDetailsFetched(true);
      });
  }, []);

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
    setTxnState(TRANSACTION_STATE_PROCESSING)
    setTxnStatusDialogOpen(true);
  }

  const copyTextToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    props.createSuccessNotification("Copied to clipboard!");
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
    // marketplaceContractGoerli.getBlockedUsers().then((blockedUsers) => {
    //   console.log("Super Admin:Goerli " + blockedUsers)
    // });
    // marketplaceContractMatic.getBlockedUsers().then((blockedUsers) => {
    //   console.log("Super Admin:Matic " + blockedUsers)
    // });

    // console.log('Phase 1 : Method Beginning');
    // var goerliTxn = await marketplaceContractGoerli.blockUser('0x964E1a55F6348605b44a59bA81DF52CB49112abA');
    // console.log('Phase 2 : Transaction Begin On Goerli')
    // console.log('Goerli Txn Hash ' + goerliTxn.hash);
    // await goerliTxn.wait();
    // console.log('Transaction completed on Goerli');
    // var maticTxn = await marketplaceContractMatic.blockUser('0x964E1a55F6348605b44a59bA81DF52CB49112abA');
    // console.log('Phase 3 : Transaction Begins on Matic')
    // console.log('Matic txn hash ' + maticTxn.hash);
    // await maticTxn.wait();
    // console.log('Transaction completed on Matic');
  }

  async function consoleBlockedUser(){
    var blockedUsersGoerli = getContracts().marketplaceContractGoerli.getBlockedUsers();
    var blockedUsersMatic = getContracts().marketplaceContractMatic.getBlockedUsers();
    blockedUsersGoerli.then((res) => {
      console.log('Goerli : ' +res)
    })
    blockedUsersMatic.then((res) => {
      console.log('Matic :' + res)
    })
  }

  consoleBlockedUser()

  const blockUser = async (userAddress) => {
    setDialogOpen(false)
    openTxnStateDialog();
    const contracts = getContracts();
    try{
      var goerliTxn = await contracts.marketplaceContractGoerli.blockUser(userAddress);
      var maticTxn = await contracts.marketplaceContractMatic.blockUser(userAddress);
      console.log(goerliTxn);
      console.log(maticTxn)
      var hashes = {
        goerli : goerliTxn.hash,
        matic : maticTxn.hash
      }
      setTxnHashes({
        Goerli: maticTxn.hash,
        Matic: goerliTxn.hash
      })
      setTxnState(TRANSACTION_STATE_SUCCESS)
    } catch(err) {
      setTxnState(TRANSACTION_STATE_TERMINATED)
      console.log(err);
      return;
    }
    // goerliTxn.then(() => {
    //   props.createSuccessNotification('User blocked on Goerli')
    // })
    // maticTxn.then(() => {
    //   props.createSuccessNotification('User blocked on Matic')
    // })
    try{
      writeAdminTxnInDatabase("Block", userAddress, hashes, sessionStorage.getItem("loggedInUser"))
    } catch(e){
      console.log(e)
    }
  };

  const unblockUser = async (userAddress) => {
    setDialogOpen(false)
    openTxnStateDialog();
    const contracts = getContracts();
    try{
      var goerliTxn = contracts.marketplaceContractGoerli.unblockUser(userAddress);
      var maticTxn = contracts.marketplaceContractMatic.unblockUser(userAddress);
      console.log(goerliTxn);
      console.log(maticTxn)
      var hashes = {
        goerli : goerliTxn.hash,
        matic : maticTxn.hash
      }
      setTxnHashes({
        Goerli: maticTxn.hash,
        Matic: goerliTxn.hash
      })
      setTxnState(TRANSACTION_STATE_SUCCESS)
    } catch(err) {
      setTxnState(TRANSACTION_STATE_TERMINATED)
      console.log(err);
      return;
    }
    // goerliTxn.then(() => {
    //   props.createSuccessNotification('User unblocked on Goerli')
    // })
    // maticTxn.then(() => {
    //   props.createSuccessNotification('User unblocked on Matic')
    // })
    try{
      writeAdminTxnInDatabase("Unblock", userAddress, hashes, sessionStorage.getItem("loggedInUser"))
    } catch(e){
      console.log(e)
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
                  Oops.... there are no blogs till now.<br></br>Add a blog
                  first.
                </p>
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
                                () => unblockUser(val.userAddress)
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
                                () =>
                                  blockUser(val.userAddress)
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
              width: txnState == 0 ? "350px" : "250px",
              padding: txnState == 0 ? "10px" : "20px 40px",
            }}
            src={
              txnState == 0
                ? transactionProcessingAnimation
                : txnState == 1
                ? transactionSuccessAnimation
                : transactionTerminatedAnimation
            }
          ></img>
          {txnState == 1 && (
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
                      {txnHashes[item].substring(0, 10) +
                        "...." +
                        txnHashes[item].substring(31)}
                    </span>
                  </p>
                );
              })}
            </>
          )}
          {txnState == -1 && (
            <>
              <p id="txnStateHead">Oops.... transaction terminated</p>
              <p id="txnStateSubhead">Check console for logs</p>
            </>
          )}
          <button id="closeDialogButton" onClick={() => setTxnStatusDialogOpen(false)}><i className="fa-solid fa-xmark"></i></button>
        </dialog>
      </div>
    </>
  );
};

export default ActiveUsers;
