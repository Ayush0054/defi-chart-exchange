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

const PriceChart = () => {
  const [priceData, setPriceData] = useState<any>({
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
  const [filter, setFilter] = useState<string>("1d");
  const [crypto, setCrypto] = useState<string>("bitcoin");
  const [socket, setSocket] = useState<any>(null);

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
    // Initialize WebSocket connection
    const newSocket = io("https://streamer.cryptocompare.com/");
    setSocket(newSocket);

    // Subscribe to real-time price updates
    const subscription = `2~Coinbase~${crypto.toUpperCase()}~USD`;
    newSocket.emit("SubAdd", { subs: [subscription] });

    newSocket.on("m", (message: any) => {
      const messageType = message.split("~")[0];
      if (messageType === "2") {
        const price = parseFloat(message.split("~")[5]);
        const time = new Date(parseInt(message.split("~")[6]) * 1000);
        setPriceData((prevData: any) => {
          const newData = {
            ...prevData,
            labels: [
              ...prevData.labels,
              time.toLocaleString("en-US", {
                month: "numeric",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
              }),
            ],
            datasets: [
              {
                ...prevData.datasets[0],
                data: [...prevData.datasets[0].data, price],
              },
            ],
          };
          return newData;
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
    <div className=" flex max-lg:flex-col max-lg:items-center gap-5 mt-12 max-lg:mx-4">
      <div className=" m-4 flex flex-col gap-4 max-lg:w-full">
        <Select
          onValueChange={handleCrypto}
          // value={crypto}
        >
          <SelectTrigger className="lg:w-[180px] max-lg:w-full">
            <SelectValue placeholder="Cryptocurrency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bitcoin">Bitcoin</SelectItem>
            <SelectItem value="ethereum">Ethereum</SelectItem>
            <SelectItem value="litecoin">Litecoin</SelectItem>
          </SelectContent>
        </Select>

        <Select
          onValueChange={handleFilter}
          // value={crypto}
        >
          <SelectTrigger className="lg:w-[180px] max-lg:w-full">
            <SelectValue placeholder="Time Frame" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Day</SelectItem>
            <SelectItem value="7d">Week</SelectItem>
            <SelectItem value="30d">Month</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card className="  lg:w-[1000px] max-lg:w-full  ">
        {priceData.labels.length > 0 ? (
          <Line className=" " data={priceData} />
        ) : (
          <p>Loading data...</p>
        )}
      </Card>
    </div>
  );
};

export default PriceChart;
