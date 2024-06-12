"use client";
import PriceChart from "@/components/pricechart";
import { useWalletInfo, useWeb3ModalAccount } from "@web3modal/ethers/react";

export default function Home() {
  const { address, chainId, isConnected } = useWeb3ModalAccount();
  const { walletInfo } = useWalletInfo();

  console.log(walletInfo);
  console.log(address, chainId, isConnected);

  return (
    <main>
      <PriceChart />
    </main>
  );
}
