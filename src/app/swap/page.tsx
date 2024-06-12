"use client";
import { useState, useEffect } from "react";

import BigNumber from "bignumber.js";
import qs from "qs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers/react";
interface Token {
  address: string;
  symbol: string;
  decimals: number;
  logoURI: string;
}

interface Trade {
  from?: Token;
  to?: Token;
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrowserProvider, ethers } from "ethers";

export default function Home() {
  const { walletProvider } = useWeb3ModalProvider();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [currentTrade, setCurrentTrade] = useState<Trade>({});
  const [currentSelectSide, setCurrentSelectSide] = useState<string>("");
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [gasEstimate, setGasEstimate] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    listAvailableTokens();
  }, [isModalOpen]);

  async function listAvailableTokens() {
    const response = await fetch(
      "https://tokens.coingecko.com/uniswap/all.json"
    );
    const tokenListJSON = await response.json();

    setTokens(tokenListJSON.tokens);
  }

  function selectToken(token: Token) {
    setIsModalOpen(false);
    setCurrentTrade({ ...currentTrade, [currentSelectSide]: token });
  }

  const { address, isConnected } = useWeb3ModalAccount();

  function openModal(side: string) {
    setCurrentSelectSide(side);
    setIsModalOpen(true);
  }

  async function getPrice() {
    if (!currentTrade.from || !currentTrade.to) return;

    const amount = Number(fromAmount) * 10 ** currentTrade.from.decimals;
    const params = {
      sellToken: currentTrade.from.address,
      buyToken: currentTrade.to.address,
      sellAmount: amount,
      //   takerAddress: address,
    };

    const headers = { "0x-api-key": process.env.OX_API_KEY };
    const response = await fetch(
      `https://api.0x.org/swap/v1/price?${qs.stringify(params)}`,
      //@ts-ignore
      { headers }
    );
    const swapPriceJSON = await response.json();
    // console.log("Price: ", swapPriceJSON);
    setToAmount(
      (swapPriceJSON.buyAmount / 10 ** currentTrade.to.decimals).toString()
    );
    setGasEstimate(swapPriceJSON.estimatedGas);
  }

  async function getQuote() {
    if (!currentTrade.from || !currentTrade.to) return;
    const amount = Number(fromAmount) * 10 ** currentTrade.from.decimals;
    const params = {
      sellToken: currentTrade.from.address,
      buyToken: currentTrade.to.address,
      sellAmount: amount,
      takerAddress: address,
    };

    const headers = { "0x-api-key": process.env.OX_API_KEY };
    const response = await fetch(
      `https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`,
      //@ts-ignore
      { headers }
    );
    const swapQuoteJSON = await response.json();
    console.log("Quote: ", swapQuoteJSON);
    setToAmount(
      (swapQuoteJSON.buyAmount / 10 ** currentTrade.to.decimals).toString()
    );
    setGasEstimate(swapQuoteJSON.estimatedGas);
    return swapQuoteJSON;
  }

  async function trySwap() {
    const quote = await getQuote();
    const erc20abi = [
      {
        inputs: [
          { internalType: "string", name: "name", type: "string" },
          { internalType: "string", name: "symbol", type: "string" },
          { internalType: "uint256", name: "max_supply", type: "uint256" },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "spender",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
        ],
        name: "Approval",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
        ],
        name: "Transfer",
        type: "event",
      },
      {
        inputs: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "spender", type: "address" },
        ],
        name: "allowance",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "spender", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
        name: "burn",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "account", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "burnFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "decimals",
        outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "spender", type: "address" },
          { internalType: "uint256", name: "subtractedValue", type: "uint256" },
        ],
        name: "decreaseAllowance",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "spender", type: "address" },
          { internalType: "uint256", name: "addedValue", type: "uint256" },
        ],
        name: "increaseAllowance",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
        name: "mint",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "name",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "symbol",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "totalSupply",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "sender", type: "address" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "transferFrom",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
    ];

    const fromTokenAddress = currentTrade.from?.address;
    const toTokenAddress = currentTrade.to?.address;
    const amount = Number(fromAmount) * 10 ** currentTrade.from!.decimals;
    //@ts-ignore
    const fromTokenContract = new ethers.Contract(
      erc20abi as any,

      fromTokenAddress as any
    );

    const accountBalance = await fromTokenContract.balanceOf(address);

    const allowance = await fromTokenContract.allowance(
      address,
      toTokenAddress
    );

    //@ts-ignore
    if (new BigNumber(amount).isGreaterThan(accountBalance)) {
      console.error("Insufficient balance");
      return;
    }
    //@ts-ignore
    if (new BigNumber(amount).isGreaterThan(allowance)) {
      await fromTokenContract.transfer(toTokenAddress, amount);
      // .send({ from: address });
    }

    // const quote = await getQuote();
    //@ts-ignore
    // await web3!.eth.sendTransaction(swapQuote);
    const provider = new BrowserProvider(walletProvider);
    const signer = await provider.getSigner();
    await signer.sendTransaction({
      gasLimit: quote.gas,
      gasPrice: quote.gasPrice,
      to: quote.to,
      data: quote.data,
      value: quote.value,
      chainId: quote.chainId,
    });
  }

  return (
    <div className="container flex flex-col items-center gap-3 mt-4">
      <w3m-button />
      {isConnected && (
        <div className="container flex flex-col items-center gap-3">
          <div className=" flex gap-3">
            <Input
              placeholder="From Amount"
              id="from_amount"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
            />
            <Button variant="secondary" onClick={() => openModal("from")}>
              {currentTrade.from ? currentTrade.from.symbol : "Select Token"}
            </Button>
          </div>
          <div className=" flex gap-3">
            <Input
              placeholder="To Amount"
              id="to_amount"
              value={toAmount}
              onChange={(e) => setToAmount(e.target.value)}
            />
            <Button variant="secondary" onClick={() => openModal("to")}>
              {currentTrade.to ? currentTrade.to.symbol : "Select Token"}
            </Button>
          </div>
          <div className=" flex gap-3">
            <Button variant="outline" onClick={getPrice}>
              Get Price
            </Button>
            <Button
              id="swap_button"
              onClick={trySwap}
              disabled={
                !address ||
                !currentTrade.from ||
                !currentTrade.to ||
                !fromAmount
              }
            >
              Swap
            </Button>
          </div>
          <div>
            Gas Estimate: <span id="gas_estimate">{gasEstimate}</span>
          </div>

          {isModalOpen && (
            <div id="token_modal">
              <div className="modal-content">
                <span className="close" onClick={() => setIsModalOpen(false)}>
                  &times;
                </span>
                <div>
                  {/* {tokens.map((token, index) => (
              <div key={index} onClick={() => selectToken(token)}>
              <span>{token.symbol}</span>
              </div>
              ))} */}

                  <DropdownMenu>
                    <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                    <DropdownMenuContent className=" h-[200px]  overflow-scroll">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {tokens.map((token, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => selectToken(token)}
                        >
                          <span>{token.symbol}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
