var express = require('express')
var { ref, get, child } = require('firebase/database')
const dataFetchMethods = require('./DataFetchMethods.js')

const app = express()

app.get('/getUserDetailsByAddress', async function(req, res){
    let user = req.query.user;
    let details = await dataFetchMethods.fetchUserDetailsByAddress(user);
    let nfts = await dataFetchMethods.getAllNftsByOwnerAddress(user)
    res.json({result : {...details, nfts : nfts}})
})

app.get('/getNftDetails', async function(req, res){
    let nftId = req.query.nftId;
    let netId = req.query.netId;
    let result = await dataFetchMethods.getNftDetails(nftId, netId);
    res.json({result : result})
})

app.get('/fetchBlockedUsers', async function(req, res) {
    res.json({result : await dataFetchMethods.fetchBlockedUsersDetails()})
})

app.get('/fetchActiveUsers', async function(req, res) {
    res.json({result : await dataFetchMethods.fetchActiveUsersDetails()})
});

app.listen(process.env.PORT || 8080, function() {
    console.log("Backend proxy server running on port 8080!");
});