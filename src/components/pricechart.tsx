"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import io from "socket.io-client";
import { Card } from "./ui/card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

const PriceChart = () => {
  const [priceData, setPriceData] = useState({
    labels: [],
    datasets: [
      {
        label: "BTC/USD",
        data: [],
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
        fill: false,
      },
    ],
  });
  const [filter, setFilter] = useState("1d");
  const [crypto, setCrypto] = useState("bitcoin");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${crypto}/market_chart`,
          {
            params: {
              vs_currency: "usd",
              days: filter,
            },
          }
        );
        const data = response.data.prices.map((entry: any) => ({
          x: new Date(entry[0]).toLocaleString("en-US", {
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          }),
          y: entry[1],
        }));
        setPriceData({
          labels: data.map((point: any) => point.x),
          datasets: [
            {
              label: `${crypto.toUpperCase()}/USD`,
              data: data.map((point: any) => point.y),
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 2,
              fill: false,
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching price data:", error);
      }
    };

    fetchPriceData();
  }, [filter, crypto]);

  useEffect(() => {
    const newSocket = io("https://streamer.cryptocompare.com/");
    //@ts-ignore
    setSocket(newSocket);

    const subscription = `2~Coinbase~${crypto.toUpperCase()}~USD`;
    newSocket.emit("SubAdd", { subs: [subscription] });

    newSocket.on("m", (message) => {
      const messageType = message.split("~")[0];
      if (messageType === "2") {
        const price = parseFloat(message.split("~")[5]);
        const time = new Date(parseInt(message.split("~")[6]) * 1000);
        //@ts-ignore
        setPriceData((prevData: any) => {
          const newLabels = [
            ...prevData.labels,
            time.toLocaleString("en-US", {
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            }),
          ];
          const newData = [...prevData.datasets[0].data, price];

          // Limit data points to the last 100 entries
          if (newLabels.length > 100) {
            newLabels.shift();
            newData.shift();
          }

          return {
            labels: newLabels,
            datasets: [
              {
                ...prevData.datasets[0],
                data: newData,
              },
            ],
          };
        });
      }
    });

    // Cleanup on component unmount
    return () => {
      newSocket.emit("SubRemove", { subs: [subscription] });
      newSocket.close();
    };
  }, [crypto]);

  const handleCrypto = (val: any) => {
    setCrypto(val);
  };
  const handleFilter = (val: any) => {
    setFilter(val);
  };

  return (
    <div className="flex max-lg:flex-col max-lg:items-center gap-5 mt-12 max-lg:mx-4">
      <div className="m-4 flex flex-col gap-4 max-lg:w-full">
        <Select onValueChange={handleCrypto}>
          <SelectTrigger className="lg:w-[180px] max-lg:w-full">
            <SelectValue placeholder="Cryptocurrency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bitcoin">Bitcoin</SelectItem>
            <SelectItem value="ethereum">Ethereum</SelectItem>
            <SelectItem value="litecoin">Litecoin</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={handleFilter}>
          <SelectTrigger className="lg:w-[180px] max-lg:w-full">
            <SelectValue placeholder="Time Frame" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Day</SelectItem>
            <SelectItem value="7d">Week</SelectItem>
            <SelectItem value="30d">Month</SelectItem>
          </SelectContent>
        </Select>
        <w3m-button />
        <Link href="/swap" className=" hover:underline">
          SWAP
        </Link>
      </div>
      <Card className="lg:w-[1000px] max-lg:w-full">
        {priceData.labels.length > 0 ? (
          <Line className="w-full" data={priceData} />
        ) : (
          <p>Loading data...</p>
        )}
      </Card>
    </div>
  );
};

export default PriceChart;
