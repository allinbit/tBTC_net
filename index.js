const Web3 = require('web3');
const Twit = require('twit');
const dotenv = require('dotenv').config();

const tbtcABI = require('./tbtc-abi.json');
const tbtcAddress = '0x1bBE271d15Bb64dF0bc6CD28Df9Ff322F2eBD847';

const address0 = '0x0000000000000000000000000000000000000000';
const explorerURL = 'https://etherscan.io/tx/';
const providerURL = `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_ID}`;

const WSConfig = {
    reconnect: {
      auto: true,
      delay: 5000,
      maxAttempts: 5,
      onTimeout: false
    }
  };

const twitterConfig = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
}

const web3 = new Web3(new Web3.providers.WebsocketProvider(providerURL, WSConfig));
const T = new Twit(twitterConfig);

const tbtcContract = new web3.eth.Contract(tbtcABI, tbtcAddress);

const txQueue = [];

function init() {
    let intervalID = setInterval(processTxQueue, 1000);
    tbtcContract.events.Transfer()
        .on('connected', () => {
            console.log('Connected to Ethereum Blockchain!');
        })
        .on('data', (data) => {
            txQueue.push(data);
        })
        .on('error', (error) => {
            console.log(error);
        })
}

function processTxQueue() {
    if (!txQueue.length) return;
    let txData = txQueue.shift();
    let formatedTX;
    let txURL = `${explorerURL}${txData.transactionHash}`;
    let {from, to, value} = txData.returnValues;
    value = web3.utils.fromWei(value, 'ether');

    if (from === address0 && value.includes('99')) {
        value = Number(value).toFixed(value.length - 6);
        formatedTX = `🚨 ${value} #tBTC has been minted! 💎\n ${txURL}`;
    } else if (to === address0) {
        formatedTX = `🚨 ${value} #tBTC has been burned! 🔥\n ${txURL}`;
    } else {
        return;
    }

    T.post('statuses/update', { status: formatedTX }, function(err, data, response) {
        if (err) {console.log(err)}
    })

}

init();


