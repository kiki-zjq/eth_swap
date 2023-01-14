import React, { Component } from 'react'
import Web3 from 'web3'
import Token from '../abis/Token.json'
import EthSwap from '../abis/EthSwap.json'
import Navbar from './Navbar'
import Main from './Main'
import './App.css'

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3() // 加载钱包 例如 metamask
    await this.loadBlockchainData() // 加载当前账号
    this.subscribeFn() // 监听函数
  }

  subscribeFn() {
    this.state.ethSwap.events.TokenPurchased({
      filter:{},
      fromBlock: 0
    }, function(err, event) {console.log('this is event', event)})
    .on('connected', (data) => {
      console.log('connected EthSwap:', data)
    })
    .on('data', (data) => {
      console.log('data EthSwap:', data)
    })
    .on('changed', (data) => {
      console.log('changed EthSwap:', data)
    })
    .on('error', (data) => {
      console.log('error EthSwap:', data)
    })


    this.state.ethSwap.events.TokenSold({
      filter:{},
      fromBlock: 0
    }, function(err, event) {console.log('this is event', event)})
    .on('connected', (data) => {
      console.log('connected EthSwap Sold:', data)
    })
    .on('data', (data) => {
      console.log('data EthSwap Sold:', data)
    })
    .on('changed', (data) => {
      console.log('changed EthSwap Sold:', data)
    })
    .on('error', (data) => {
      console.log('error EthSwap Sold:', data)
    })
      
  }

  async loadBlockchainData() {
    // const web3 = window.web3

    // 基于 http 连接的方式不支持事件的监听 此处修改为基于 web-socket 的连接
    const Eth = require('web3-eth')
    const eth =  new Eth(Eth.givenProvider || 'ws://some.local-or-remote.node:7545');
    const accounts = await eth.getAccounts()
    // const web3 = new Web3(Web3.givenProvider || 'ws://localhost: 7545');
    // const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })

    // const ethBalance = await web3.eth.getBalance(this.state.account)
    const ethBalance = await eth.getBalance(this.state.account)
    this.setState({ ethBalance })

    // Load Token
    const networkId =  await eth.net.getId()
    const tokenData = Token.networks[networkId]
    if(tokenData) {
      const token = new eth.Contract(Token.abi, tokenData.address)
      this.setState({ token })
      let tokenBalance = await token.methods.balanceOf(this.state.account).call()
      this.setState({ tokenBalance: tokenBalance.toString() })
    } else {
      window.alert('Token contract not deployed to detected network.')
    }

    // Load EthSwap
    const ethSwapData = EthSwap.networks[networkId]
    if(ethSwapData) {
      const ethSwap = new eth.Contract(EthSwap.abi, ethSwapData.address)
      this.setState({ ethSwap })
    } else {
      window.alert('EthSwap contract not deployed to detected network.')
    }

    this.setState({ loading: false })
    // debugger;
    // 看起来 subscribe 主要是针对系统给定的几个特别的事件进行监听
    eth.subscribe('logs', {}, function(error, result) {
      if (!error) console.log(`This is subscribe logs result: ${JSON.stringify(result)}. -------------`)
      else
        console.log(`This is subscribe logs error: ${JSON.stringify(error)}. -------------`)
    })
    // console.log(web3.eth)
  }

  async loadWeb3() {
    console.log(window.ethereum, window.web3)
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  buyTokens = (etherAmount) => {
    this.setState({ loading: true })
    this.state.ethSwap.methods.buyTokens().send({ value: etherAmount, from: this.state.account }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
    })
  }

  sellTokens = (tokenAmount) => {
    this.setState({ loading: true })
    this.state.token.methods.approve(this.state.ethSwap.address, tokenAmount).send({ from: this.state.account }).on('transactionHash', (hash) => {
      this.state.ethSwap.methods.sellTokens(tokenAmount).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      token: {},
      ethSwap: {},
      ethBalance: '0',
      tokenBalance: '0',
      loading: true
    }
  }

  render() {
    let content
    if(this.state.loading) {
      content = <p id="loader" className="text-center">Loading...</p>
    } else {
      content = <Main
        ethBalance={this.state.ethBalance}
        tokenBalance={this.state.tokenBalance}
        buyTokens={this.buyTokens}
        sellTokens={this.sellTokens}
      />
    }
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '600px' }}>
              <div className="content mr-auto ml-auto">
                <a
                  href="http://www.dappuniversity.com/bootcamp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                </a>

                {content}

              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;