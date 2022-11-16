import "../css/ApprovedItems.css";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import ReactLoading from "react-loading";
import { useEffect } from "react";
import defaultProfileImage from "../assets/defaultProfileImage.jpg";
import { writeAdminTxnInDatabase, writeRemovedItemInDatabase } from "./InitializeFirebaseAuth.js";
import { getContractConfigurations } from "../backendServer/contract-config";
import { ethers } from "ethers";
import transactionProcessingAnimation from "../assets/transactionProcessing.gif";
import transactionSuccessAnimation from "../assets/transactionSuccess.gif";
import transactionTerminatedAnimation from "../assets/transactionTerminated.gif";

const ApprovedItems = (props) => {
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

  /**
   * This method filters the users based on the search query.
   * @returns An array of details of the filtered users.
   */
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

  /**
   * This hook fetches the details of all the approved items.
   */
  useEffect(() => {
    fetch("/getAllListedItemIds")
      .then((res) => res.json())
      .then((json) => {
        let itemAndNetIds = json.result;
        let temp = [];
        itemAndNetIds.forEach(
          ({ nftId, netId, collectionId, collectionName }) => {
            fetch(
              "/getNftDetails?" +
                new URLSearchParams({
                  nftId: nftId,
                  netId: netId,
                })
            )
              .then((res) => res.json())
              .then((json) => {
                temp = [...temp, json.result];
                setItems(temp);
                if (!itemsFetched) {
                  setItemsFetched(true);
                }
              });
          }
        );
      });
      props.resetTimeCount()
  }, []);

   /**
   * This method copies the provided text to the clipboard.
   * @param text - The text to be copied on the clipboard.
   */
  const copyTextToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    props.createSuccessNotification("Copied to clipboard!");
  };

  /**
   * This methods opens up the transaction state dialog that denotes the state of the transaction.
   */
  const openTxnStateDialog = () => {
    setTxnState(TRANSACTION_STATE_PROCESSING);
    setTxnStatusDialogOpen(true);
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
   * This method removes the item from the marketplace and writes admin transaction history on the database.
   * @param nftId The id of the nft to be removed.
   * @param netId The id of the network on which the item is minted.
   * @param itemDetails The details of the item which is to be removed.
   */
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
        itemDetails.sender,
        nftId,
        hashes,
        sessionStorage.getItem("loggedInUser")
      );
      await writeRemovedItemInDatabase(itemDetails)
      props.createSuccessNotification("Item removed successfully!");
    } catch (e) {
      console.log(e);
    }
  };

  /**
   * This method unlists an nft from the marketplace and writes the admin transaction history on the database.
   * @param nftId The id of the nft.
   * @param netId The id of the network.
   * @param sender The seller of the Nft.
   */
  const unlistItem = async (nftId, netId, sender) => {
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
        txn = await contracts.nftContractGoerli.unlistNft(sender, nftId);
        hashes = {
          goerli: txn.hash,
        };
        setTxnHashes({
            Goerli: txn.hash,
          });
      } else if (netId == "80001") {
        txn = await contracts.nftContractMatic.unlistNft(sender, nftId);
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
        "Item Unlisted",
        sender,
        nftId,
        hashes,
        sessionStorage.getItem("loggedInUser")
      );
      props.createSuccessNotification("Item removed successfully!");
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div>
      <div id="approvedItems">
        <p id="head">Approved Items</p>
        <p id="subHead">
          <Link to="/">
            <span>{"Dashboard"}</span>
          </Link>
          {" > "}Approved Items
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
        <div id="approvedItemsContent">
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
                          id="unlistItemButton"
                          title="Unlist Item"
                            onClick={() => {
                              openDialog(
                                "Unlist Item!",
                                "Are you sure, you want to unlist this item?",
                                () => setDialogOpen(false),
                                () => unlistItem(val.nftId, val.networkId, val.seller)
                              );
                            }}
                        >
                          <i className="fa-solid fa-shop-slash"></i>
                        </button>
                        <button
                          id="removeItemButton"
                          title="Remove Item"
                            onClick={() => {
                              openDialog(
                                "Remove Item!",
                                "Are you sure, you want to remove this item?",
                                () => setDialogOpen(false),
                                () => removeItem(val.nftId, val.networkId, val)
                              );
                            }}
                        >
                          <i className="fa-solid fa-trash-can"></i>
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

export default ApprovedItems;
