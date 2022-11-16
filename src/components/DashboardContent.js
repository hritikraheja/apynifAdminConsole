import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import {Link} from 'react-router-dom'
import "../css/DashboardContent.css";
import ReactLoading from 'react-loading';

function DashboardContent(props) {
  const [transactionsFetched, setTransactionsFetched] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [userCount, setUserCount] = useState(0)
  const [listedItemsCount, setListedItemsCount] = useState(0)
  const [dashboardStatsLoaded, setDashboardStatsLoaded] = useState(false)

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    props.createSuccessNotification('Copied to clipboard!')
  }

  useEffect(() => {
    fetch('/getDashboardStats')
    .then(res => res.json())
    .then((json) => {
        setListedItemsCount(json.result.itemsCount)
        setUserCount(json.result.usersCount)
        setDashboardStatsLoaded(true)
    })
  }, [])

  useEffect(() => {
    fetch("/fetchAdminTransactions")
      .then((res) => res.json())
      .then((json) => {
        setTransactions(json.result);
        if (!transactionsFetched) {
          setTransactionsFetched(true);
        }
      });
      props.resetTimeCount()
  }, []);

  function getMaskedAddressOrHash(text){
    return text.substring(0, 8) + '......' + text.substring(text.length - 8)
  }

  return (
    <div id="dashboardContent">
        {dashboardStatsLoaded &&<div id="stats">
            <Link to='activeUsers'>
            <div id="parent">
                <div id="child">
                    <p id='statHead'>Total Users</p>
                    <span>{userCount}</span>
                </div>
                <i className="fa-solid fa-address-book"></i>
            </div>
            </Link>
            <Link to='/approvedItems'>
            <div id="parent">
                <div id="child">
                    <p id="statHead">Total Listed Items</p>
                    <span>{listedItemsCount}</span>
                </div>
                <i className="fas fa-clipboard-list"></i>
            </div>
            </Link>
        </div>}
        {!dashboardStatsLoaded && <ReactLoading
              className="loadingAnimation"
              type="spinningBubbles"
              color="red"
              width="75px"
              height="75px"
            ></ReactLoading>}
      <p id="head">Admin Transactions</p>
      {!transactionsFetched && <ReactLoading
              className="loadingAnimation"
              type="spinningBubbles"
              color="red"
              width="75px"
              height="75px"
            ></ReactLoading>}
      {transactionsFetched && transactions.length == 0 && (
        <p id="noTransactionsPrompt">
            Oops.... there are no transactions to display.
        </p>
      )}
      {transactionsFetched && transactions.length > 0 &&  (
        <table>
            <thead>
                  <tr>
                    <th>Activity</th>
                    <th>User Address</th>
                    <th>Item ID</th>
                    <th>Hash</th>
                    <th>Admin</th>
                    <th>Timestamp</th>
                  </tr>
            </thead>
            <tbody>
                {
                    transactions.map((txn) => {
                        return (
                            <tr>
                                <td id='activity'>{txn.activity}</td>
                                <td id="address" onClick={
                                    () => {copyToClipboard(txn.address)}
                                }>{getMaskedAddressOrHash(txn.address)}</td>
                                <td>{txn.itemId}</td>
                                <td id='hashes'>{Object.keys(txn.txnHashes).map(key => {
                                    return(<p onClick={() => {
                                        copyToClipboard(txn.txnHashes[key])
                                    }}>{<span>{key + " : "}</span>}{getMaskedAddressOrHash(txn.txnHashes[key])}</p>)
                                })}</td>
                                <td>{txn.admin}</td>
                                <td>{txn.dateAndTime}</td>
                            </tr>
                        )
                    })
                }
            </tbody>
        </table>
      )}
    </div>
  );
}

export default DashboardContent;
