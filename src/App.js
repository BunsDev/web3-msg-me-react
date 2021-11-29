import React, { useEffect, useState } from 'react';
import { ethers } from "ethers";
import './App.css';
import pfp from './pfp.jpg';
import abi from './utils/WavePortal.json';

function App() {
  // declare ethereum object, provider and signer
  const { ethereum } = window;
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();

  // state variable to store user's wallet address
  const [ currentAccount, setCurrentAccount ] = useState("");
  const [ currentBalance, setCurrentBalance ] = useState("");
  const [ ensName, setEnsName ] = useState("");
  const [ currentNetworkName, setCurrentNetworkName] = useState("");
  const [ allWaves, setAllWaves ] = useState([]);
  const [ message, setMessage ] = useState("");

  const contractAddress = "0x807042407E0B7d59Bcc9aBd173a1C53af67f8F78";
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    try {
      if (ethereum) {
        // declare contract
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        // declare output of contract function getAllWaves
        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          };
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object does not exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // listen for emitted event
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if(ethereum) {
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      // listen for emitted event
      wavePortalContract.on('NewWave', onNewWave);
    }

    // cleanup function
    return ( () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) {
        console.log("No wallet detected. Get MetaMask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
        // get
        const networkName = (await provider.getNetwork()).name;
        setCurrentNetworkName(networkName);
      }

      const accounts = await ethereum.request({ method: "eth_accounts"});

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        const ens = await provider.lookupAddress(account);
        console.log("👋",ens);
        const balance = parseFloat(ethers.utils.formatEther(await signer.getBalance())).toFixed(2);
        console.log(`You got ${balance}Ξ`);
        setEnsName(ens);
        setCurrentBalance(balance);
        getAllWaves();
      } else {
        console.log("No authorized account found.");
      }

    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      if(!ethereum) {
        console.log("Get MetaMask!");
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts"});
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

    } catch (error) {

    }
  }

  const wave = async () => {
    try {
      if (ethereum) {
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        // execute wave from contract
        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000});
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        console.log(allWaves);
      } else {
        console.log("Ethereum object does not exist");
      }
    } catch (error) {
      console.log(error);
    }
  }

useEffect(() => {
  checkIfWalletIsConnected();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <img className="avatar" src={pfp} alt="" />
        <h1 className="header">
        ☠️ Greetings!
        </h1>

        <div className="bio">
          <p>I'm DiFool, a web3 student and enthusiast.</p>
          <p>Connect your wallet and send me a message!</p>
        </div>

        {currentAccount && (
          <div className="account">
            <div className="accountDetail">
              <p>Network:</p>
              <span>
                {currentNetworkName !== "rinkeby" ? "Switch to Rinkeby 😙" : currentNetworkName}
              </span>
            </div>
            <div className="accountDetail">
              <p>Connected account:</p>
              <span>
                {ensName ? ensName : currentAccount}
              </span>
            </div>
            <div className="accountDetail">
              <p>Balance:</p>
              <span>
                {currentBalance}Ξ
              </span>
            </div>
          </div>
        )}

        <form onSubmit={e => {
          e.preventDefault();
          wave();
        }}>
          <input type="text" onChange={e => setMessage(e.target.value)} required/>
          <button className="waveButton">
            Send Message
          </button>
        </form>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        <div className="msgFeed">
          {allWaves.map((wave, index) => {
            return (
              <div key={index} className="msgContainer">
                <h2>{wave.message}</h2>
                <p>From: {wave.address}</p>
                <p>Date: {wave.timestamp.toLocaleString()}</p>
              </div>)
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
