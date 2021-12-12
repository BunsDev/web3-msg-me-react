import React, { useEffect, useState } from 'react';
import { ethers } from "ethers";
import './App.css';
import pfp from './pfp.jpg';
import abi from './utils/WavePortal.json';

function App() {
  const { ethereum } = window;

  // state variable to store user's wallet address
  const [ currentAccount, setCurrentAccount ] = useState("");
  const [ currentBalance, setCurrentBalance ] = useState("");
  const [ ensName, setEnsName ] = useState("");
  const [ networkName, setNetworkName] = useState("");
  const [ allWaves, setAllWaves ] = useState([]);
  const [ message, setMessage ] = useState("");

  // contract info
  const contractAddress = "0x4B99a1efd4E36720cc7184e49cBC44A25B785045";
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    const provider = new ethers.providers.Web3Provider(ethereum, "any");
    const signer = provider.getSigner();
    // refresh window on network change
    provider.on("network", (newNetwork, oldNetwork) => {
      if (oldNetwork) {
        window.location.reload();
      }
    });

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
    if(ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      // refresh window on network change
      provider.on("network", (newNetwork, oldNetwork) => {
        if (oldNetwork) {
          window.location.reload();
        }
      });

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

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      // listen for emitted event
      wavePortalContract.on('NewWave', onNewWave);
    }

    // cleanup function
    return ( () => {
      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, "any");
        const signer = provider.getSigner();
        // refresh window on network change
        provider.on("network", (newNetwork, oldNetwork) => {
          if (oldNetwork) {
            window.location.reload();
          }
        });
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
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

        if (wavePortalContract) {
          wavePortalContract.off('NewWave', onNewWave);
        }

      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkIfWalletIsConnected = async () => {
      try {
        if (ethereum) {
          console.log("We have the ethereum object", ethereum);
          const provider = new ethers.providers.Web3Provider(ethereum, "any");
          const signer = provider.getSigner();
          // refresh window on network change
          provider.on("network", (newNetwork, oldNetwork) => {
            if (oldNetwork) {
              window.location.reload();
            }
          });
          const network = await provider.getNetwork();
          if(network.name !== "rinkeby") {
            alert('Please switch to Rinkeby Test Network');
          }
          setNetworkName(network.name);
          const accounts = await ethereum.request({ method: "eth_accounts"});

          if (accounts.length !== 0) {
            const account = accounts[0];
            console.log("Found an authorized account:", account);
            setCurrentAccount(account);
            const ens = await provider.lookupAddress(account);
            ens ? console.log("👋🏼",ens) : console.log("👋🏼", account);
            const balance = parseFloat(ethers.utils.formatEther(await signer.getBalance())).toFixed(2);
            console.log(`You got ${balance}Ξ`);
            setEnsName(ens);
            setCurrentBalance(balance);
            getAllWaves();
          } else {
            console.log("No authorized account found.");
          }
        } else {
          console.log("No wallet detected. Get MetaMask!");
          return;
        }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      if(ethereum) {
        const accounts = await ethereum.request({ method: "eth_requestAccounts"});
        console.log("Connected", accounts[0]);
        setCurrentAccount(accounts[0]);
        window.location.reload();
      } else {
        console.log("Get MetaMask!");
        alert("Get MetaMask!");
        return;
      }
    } catch (error) {
      console.log(error);
    }
  }

  const wave = async () => {
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, "any");
        const signer = provider.getSigner();
        // refresh window on network change
        provider.on("network", (newNetwork, oldNetwork) => {
          if (oldNetwork) {
            window.location.reload();
          }
        });
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
        <img className="avatar" src={pfp} alt="difool" />
        <h1 className="header">
        ☠️ Greetings!
        </h1>

        <div className="bio">
          <p>I'm <a href="https://twitter.com/DiFool0x" target="_blank" rel="noreferrer">DiFool</a>, a web3 student and enthusiast.</p>
          <p>Connect your wallet and send me a message!</p>
          <p>You may win some test ETH 😈</p>
        </div>

        {currentAccount && (
          <div className="account">
            <div className="accountDetail">
              <p>Network:</p>
              <span>
                {networkName}
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
        {currentAccount && (
          <form onSubmit={e => {
            e.preventDefault();
            wave();
          }}>
            <input type="text" onChange={e => setMessage(e.target.value)} required/>
            <button className="waveButton">
              Send Message
            </button>
          </form>
        )}

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
