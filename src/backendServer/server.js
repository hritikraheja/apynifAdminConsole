var express = require('express')
var { ref, get, child } = require('firebase/database')
const dataFetchMethods = require('./DataFetchMethods.js')

const app = express()

/**
 * This route gives an array of all listed item id with their respective network id.
 */
app.get('/getAllListedItemIds', async(req, res) => {
    let items = await dataFetchMethods.getAllNfts()
    res.json({result : items})
})

/**
 * This route gives the details of the user by user address.
 */
app.get('/getUserDetailsByAddress', async function(req, res){
    let user = req.query.user;
    let details = await dataFetchMethods.fetchUserDetailsByAddress(user);
    let nfts = await dataFetchMethods.getAllNftsByOwnerAddress(user)
    res.json({result : {...details, nfts : nfts}})
})

/**
 * This route gives the details of the nft by nftId and networkId.
 */
app.get('/getNftDetails', async function(req, res){
    let nftId = req.query.nftId;
    let netId = req.query.netId;
    let result = await dataFetchMethods.getNftDetails(nftId, netId);
    res.json({result : result})
})

/**
 * This route gives an array of details of all the removed items.
 */
app.get('/getRemovedItems', async function(req, res){
    let result = await dataFetchMethods.getRemovedItems()
    res.json({result : result})
})

/**
 * This route gives an array of details of all the blocked users.
 */
app.get('/fetchBlockedUsers', async function(req, res) {
    res.json({result : await dataFetchMethods.fetchBlockedUsersDetails()})
})

/**
 * This route gives an array of details of all the active users.
 */
app.get('/fetchActiveUsers', async function(req, res) {
    res.json({result : await dataFetchMethods.fetchActiveUsersDetails()})
});

/**
 * This route gives a boolean result whether the provided address is blocked or not.
 */
app.get('/checkUserBlocked', async function(req, res) {
    let user = req.query.user
    res.json({result : await  dataFetchMethods.checkUserBlocked(user)})
})

/**
 * This route gives an array of details of all the admin transactions.
 */
app.get('/fetchAdminTransactions', async function(req, res) {
    var result = await dataFetchMethods.getAdminTransactions();
    res.json({result : result})
})

/**
 * This route gives the active user count and the item count to be shown as stats on the dashboard.
 */
app.get('/getDashboardStats', async function(req, res) {
    var result = await dataFetchMethods.getDashboardStats();
    res.json({result : result})
})

app.listen(process.env.PORT || 8080, function() {
    console.log("Backend proxy server running on port 8080!");
});