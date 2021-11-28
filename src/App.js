import React, { useEffect, useState } from 'react';
import { ethers } from "ethers";
import './App.css';
import pfp from './pfp.jpg';
import abi from './utils/WavePortal.json';

function App() {

  // state variable to store user's wallet address
  const [ currentAccount, setCurrentAccount ] = useState("");
  const [ allWaves, setAllWaves ] = useState([]);
  const [ message, setMessage ] = useState("");

  const contractAddress = "0x807042407E0B7d59Bcc9aBd173a1C53af67f8F78";
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = await new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object does not exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("No wallet detected. Get MetaMask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts"});

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
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
      const { ethereum } = window;
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
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
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
        <div className="header">
        🤙 Aloha!
        </div>

        <div className="bio">
          <p>I'm DiFool, a web3 student and enthusiast.</p>
          <p>Connect your Ethereum wallet and wave at me!</p>
        </div>

        {currentAccount && (
          <>
          <p>Connected account:</p>
          <p>{currentAccount}</p>
          </>
        )}

        <form>
          <input type="text" onChange={e => setMessage(e.target.value)}/>
        </form>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}

export default App;
