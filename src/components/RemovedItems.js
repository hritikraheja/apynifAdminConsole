import "../css/RemovedItems.css";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import ReactLoading from "react-loading";
import { useEffect } from "react";
import defaultProfileImage from "../assets/defaultProfileImage.jpg";
import { writeAdminTxnInDatabase, deleteRemovedItemFromDatabase } from "./InitializeFirebaseAuth.js";
import { getContractConfigurations } from "../backendServer/contract-config";
import { ethers } from "ethers";
import transactionProcessingAnimation from "../assets/transactionProcessing.gif";
import transactionSuccessAnimation from "../assets/transactionSuccess.gif";
import transactionTerminatedAnimation from "../assets/transactionTerminated.gif";

const RemovedItems = (props) => {
  const [searchBoxQuery, setSearchBoxQuery] = useState("");
  const [items, setItems] = useState();
  const [itemsFetched, setItemsFetched] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [txnStatusDialogOpen, setTxnStatusDialogOpen] = useState(false);
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
    // items.map((val, key) => {
    //   if (
    //     !searchBoxQuery ||
    //     searchBoxQuery == "" ||
    //     (searchBoxQuery != "" &&
    //       ((val.userName &&
    //         val.userName
    //           .toLowerCase()
    //           .includes(searchBoxQuery.toLowerCase())) ||
    //         (val.firstName &&
    //           val.firstName
    //             .toLowerCase()
    //             .includes(searchBoxQuery.toLowerCase())) ||
    //         (val.lastName &&
    //           val.lastName
    //             .toLowerCase()
    //             .includes(searchBoxQuery.toLowerCase())) ||
    //         (val.userAddress &&
    //           val.userAddress
    //             .toLowerCase()
    //             .includes(searchBoxQuery.toLowerCase())))) ||
    //     (val.userAbout &&
    //       val.userAbout.toLowerCase().includes(searchBoxQuery.toLowerCase()))
    //   ) {
    //     result = [...result, val];
    //   }
    // });
    return items;
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
    )
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

  useEffect(() => {
    fetch("/getRemovedItems")
      .then((res) => res.json())
      .then((json) => {
        setItems(json.result)
        setItemsFetched(true)
      })
      props.resetTimeCount()
  }, []);

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

  const approveItem = async (nftId, netId, sender, key) => {
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
        txn = await contracts.nftContractGoerli.addNftToSingleNftsArray(sender, nftId);
        hashes = {
          goerli: txn.hash,
        };
        setTxnHashes({
            Goerli: txn.hash,
          });
      } else if (netId == "80001") {
        txn = await contracts.nftContractMatic.addNftToSingleNftsArray(sender, nftId);
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
        "Item Approved",
        sender,
        nftId,
        hashes,
        sessionStorage.getItem("loggedInUser")
      );
      await deleteRemovedItemFromDatabase(key)
      props.createSuccessNotification("Item approved successfully!");
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div>
      <div id="removedItems">
        <p id="head">Removed Items</p>
        <p id="subHead">
          <Link to="/">
            <span>{"Dashboard"}</span>
          </Link>
          {" > "}Removed Items
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
        <div id="removedItemsContent">
          {!itemsFetched && (
            <ReactLoading
              className="loadingAnimation"
              type="spinningBubbles"
              color="red"
              width="75px"
              height="75px"
            ></ReactLoading>
          )}
          {itemsFetched && resultsAfterSearchQueryAndFilters().length == 0 && (
            <p id="noBlogsPrompt">Oops.... there are no items to display.</p>
          )}
          {itemsFetched && resultsAfterSearchQueryAndFilters().length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Cover Image</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Seller</th>
                  <th>Chain</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {resultsAfterSearchQueryAndFilters().map((val, key) => {
                  return (
                    <tr id="item" key={key}>
                      <td id="itemCoverImageCol">
                        <img
                          src={
                            val.coverImageUri && val.coverImageUri != ""
                              ? val.coverImageUri
                              : defaultProfileImage
                          }
                        ></img>
                      </td>
                      <td>{val.nftName ? val.nftName : "------"}</td>
                      <td>{val.price ? val.price : "------"}</td>
                      <td>{val.seller}</td>
                      <td>{val.networkName}</td>
                      <td id="buttonsCol">
                        <button
                          id=".approveItemButton"
                          title="Approve Item"
                            onClick={() => {
                              openDialog(
                                "Approve Item!",
                                "Are you sure, you want to approve this item?",
                                () => setDialogOpen(false),
                                () => approveItem(val.nftId, val.networkId, val.seller, val.key)
                              );
                            }}
                        >
                          <i className="fa-solid fa-check"></i>
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
    </div>
  );
};

export default RemovedItems;
