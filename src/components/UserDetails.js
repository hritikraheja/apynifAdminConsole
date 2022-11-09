import React, { useEffect, useState } from "react";
import "../css/UserDetails.css";
import { Link, useLocation } from "react-router-dom";
import defaultProfileImage from "../assets/defaultProfileImage.jpg";
import ReactLoading from "react-loading";
import Countdown from "react-countdown";
import Web3 from "web3";
// import HDWalletProvider from "@truffle/hdwallet-provider";
import { getContractConfigurations } from "../backendServer/contract-config";
import { ethers } from "ethers";

function UserDetails() {
  const [userDetails, setUserDetails] = useState(null);
  const [userDetailsFetched, setUserDetailsFetched] = useState(false);
  const [nfts, setNfts] = useState([]);
  const [nftsFetched, setNftsFetched] = useState(false);
  const [optionsSelected, setOptionSelected] = useState(0);
  const [numberOfItemsToBeDisplayed, setNumberOfItemsToBeDisplayed] =
    useState(6);
  const query = new URLSearchParams(useLocation().search);

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
      return nfts.filter((nft) => nft.bidEndTimestamp == "0");
    }
  }

  const timerRenderer = ({ days, hours }) => {
    return (
      <p id="timeLeftInAuctionCompletion">
        {days} Days {hours} hrs <span>Left</span>
      </p>
    );
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
                      <button id="removeButton">Remove Item</button>
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
        </div>
      )}
    </>
  );
}

export default UserDetails;
