import React from 'react';
import './App.css';
import WalletConnect from "@walletconnect/browser";
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";
import {  convertHexToUtf8,convertUtf8ToHex } from "@walletconnect/utils";

interface IAppState {
  walletConnector: WalletConnect | null;
  fetching: boolean;
  connected: boolean;
  chainId: number;
  showModal: boolean;
  pendingRequest: boolean;
  uri: string;
  accounts: string[];
  address: string;
  result: any | null;
  assets: string[];
  messages: string[];
}

const INITIAL_STATE = {
  walletConnector: null,
  fetching: false,
  connected: false,
  chainId: 1,
  showModal: false,
  pendingRequest: false,
  uri: "",
  accounts: [],
  address: "",
  result: null,
  assets: [],
  messages: []
};

export default class App extends React.Component<any>{

  public state: IAppState = {
    ...INITIAL_STATE
  };

  public walletConnectInit = async () => {
    // bridge url
    const bridge = "https://bridge.walletconnect.org";

    // create new walletConnector
    const walletConnector = new WalletConnect({ bridge });

    window.walletConnector = walletConnector;

    await this.setState({ walletConnector });

    // check if already connected
    if (!walletConnector.connected) {
      // create new session
      await walletConnector.createSession();

      // get uri for QR Code modal
      const uri = walletConnector.uri;

      // console log the uri for development
      console.log(uri); // tslint:disable-line

      // display QR Code modal
      WalletConnectQRCodeModal.open(uri, () => {
        console.log("QR Code Modal closed"); // tslint:disable-line
      });
    }
    // subscribe to events
    await this.subscribeToEvents();
  };

  public subscribeToEvents = () => {
    const { walletConnector } = this.state;

    if (!walletConnector) {
      return;
    }

    walletConnector.on("session_update", async (error, payload) => {
      console.log('walletConnector.on("session_update")'); // tslint:disable-line

      if (error) {
        throw error;
      }

     // const { chainId, accounts } = payload.params[0];
    });

    
    walletConnector.on("call_request", (error, payload) => {
      const obj = {
        label: "Address", 
        value: payload.params[1],
        label2: "Message",
        value2: convertHexToUtf8(payload.params[0])
    }
      const mess = this.state.messages;
      mess.push(obj.value2)
      this.setState({message: mess})
      console.log('walletConnector.on("call_request")',payload,obj,this.state.messages,'---->'); // tslint:disable-line
      if (error) {
        throw error;
      }

    });

    walletConnector.on("connect", (error, payload) => {
      console.log('walletConnector.on("connect")'); // tslint:disable-line

      if (error) {
        throw error;
      }

      this.onConnect(payload);
    });

    walletConnector.on("disconnect", (error, payload) => {
      console.log('walletConnector.on("disconnect")'); // tslint:disable-line

      if (error) {
        throw error;
      }

      this.onDisconnect();
    });

    if (walletConnector.connected) {
      const { chainId, accounts } = walletConnector;
      const address = accounts[0];
      this.setState({
        connected: true,
        chainId,
        accounts,
        address
      });
    }

    this.setState({ walletConnector });
  };
  
  public onConnect = async (payload: any) => {
    const { chainId, accounts } = payload.params[0];
    const address = accounts[0];
    await this.setState({
      connected: true,
      chainId,
      accounts,
      address
    });
    console.log(this.state);
    
    WalletConnectQRCodeModal.close();
  };

  public killSession = async () => {
    const { walletConnector } = this.state;
    if (walletConnector) {
      walletConnector.killSession();
    }
  };

  public onDisconnect = async () => {
    WalletConnectQRCodeModal.close();
  };

  
  public testSignPersonalMessage = async () => {
    const { walletConnector, address } = this.state;

    if (!walletConnector) {
      return;
    }

    // test message
    const message = "Hello wallet";

    // encode message (hex)
    const hexMsg = convertUtf8ToHex(message);

    // personal_sign params
    const msgParams = [hexMsg, address];

    try {
      // open modal

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send message
      const result = await walletConnector.signPersonalMessage(msgParams);
      console.log(result);
      
      // verify signature
      //const signer = recoverPersonalSignature(result, message);
      ///const verified = signer.toLowerCase() === address.toLowerCase();

      // format displayed result
      const formattedResult = {
        method: "personal_sign",
        address,
        //signer,
        //verified,
        result
      };

      // display result
      this.setState({
        walletConnector,
        pendingRequest: false,
        result: formattedResult || null
      });
    } catch (error) {
      console.error(error); // tslint:disable-line
      this.setState({ walletConnector, pendingRequest: false, result: null });
    }
  };

  render(){
    const {connected,messages} = this.state;
    return (
        <div className="App">
           <div className='header'>
             <div className="banner"></div>
             {
               connected &&  (<div className="disc" onClick={this.killSession}>Disconnect</div>)
             }
           </div>
        <header className="App-header">
          {
            !connected ?
                <button onClick={this.walletConnectInit} className="connBtn">Connect to WalletConnect</button>
            : <div>
              <h4>Action</h4>
              <button onClick={this.testSignPersonalMessage} className="connBtn">Send signed message</button>
              <p></p>
              <h4>Messages</h4>
                {
                  messages.length !== 0 &&
                  messages.map(element=>
                    <p>{element}</p>
                  )
                }
              </div>
          }
        </header>
      </div>
    );
  }
  
}
