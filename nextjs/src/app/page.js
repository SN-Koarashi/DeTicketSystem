'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import EventCard from '@/components/EventCard';
import { Search, Filter } from 'lucide-react';
import { categories } from '@/lib/utils';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [ethPrice, setEthPrice] = useState(null);
  const [ethPriceLoading, setEthPriceLoading] = useState(true);


  // 過濾活動
  const filteredEvents = events.filter(event => {
    const data = JSON.parse(event.summary);
    const matchesSearch = data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || data.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    async function fetchEvents() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/v1/events');
        const data = await response.json();

        setEvents(data?.data);

        console.log('Fetched events from API:', data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // 獲取 ETH 價格
  useEffect(() => {
    async function fetchETHPrice() {
      try {
        setEthPriceLoading(true);
        const { JsonRpcProvider, Contract } = await import('ethers');

        // Chainlink Price Feed 合約地址 (Sepolia ETH/USD)
        const priceFeedAddress = '0x694AA1769357215DE4FAC081bf1f309aDC325306';

        // Chainlink AggregatorV3Interface ABI
        const aggregatorV3InterfaceABI = [
          {
            inputs: [],
            name: "latestRoundData",
            outputs: [
              { name: "roundId", type: "uint80" },
              { name: "answer", type: "int256" },
              { name: "startedAt", type: "uint256" },
              { name: "updatedAt", type: "uint256" },
              { name: "answeredInRound", type: "uint80" }
            ],
            stateMutability: "view",
            type: "function"
          }
        ];

        // 使用公開的 Sepolia RPC，不需要錢包
        const provider = new JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');

        // 創建 Price Feed 合約實例
        const priceFeed = new Contract(priceFeedAddress, aggregatorV3InterfaceABI, provider);

        // 獲取最新價格
        const roundData = await priceFeed.latestRoundData();
        const price = Number(roundData.answer) / 1e8; // Chainlink 使用 8 位小數

        setEthPrice(price);
        console.log('當前 ETH/USD 價格:', price);
      } catch (error) {
        console.error('Error fetching ETH price:', error);
        setEthPrice(null);
      } finally {
        setEthPriceLoading(false);
      }
    }

    fetchETHPrice();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-black py-20 px-4 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-0">
          <video
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
            src="/background.mp4"
            autoPlay
            loop
            muted
          />
        </div>
        <div className="container mx-auto text-center z-10 relative">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            去中心化售票平台
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            基於區塊鏈的透明、安全、不可轉售的活動票券系統
          </p>

          {/* 搜尋欄 */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
              <input
                type="text"
                placeholder="搜尋活動名稱或關鍵字..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="max-w-2xl mx-auto mt-3 text-sm text-gray-500">
            <div className="relative flex items-center justify-center gap-2">
              {ethPriceLoading ? (
                <span className="text-gray-400">載入中...</span>
              ) : ethPrice ? (
                <>
                  <span className="text-gray-400">ETH 現價:</span>
                  <span className="text-blue-400 font-semibold">${ethPrice.toFixed(2)} USD</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* 分類篩選 */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          <Filter size={20} className="text-gray-400 flex-shrink-0" />
          {Object.entries(categories).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 cursor-pointer ${selectedCategory === key
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* 活動列表 */}
      <section className="container mx-auto px-4 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-white/10"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-white/10 rounded w-3/4"></div>
                  <div className="h-4 bg-white/10 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded w-full"></div>
                    <div className="h-3 bg-white/10 rounded w-5/6"></div>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <div className="h-8 bg-white/10 rounded w-20"></div>
                    <div className="h-8 bg-white/10 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl">找不到符合條件的活動</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center mt-4 mb-4">
        <p className="text-center text-sm text-gray-500">
          © 2026 DeTicket. All rights reserved.
          <br />
          Smart Contract Address: <a className='underline' href={`https://sepolia.etherscan.io/address/${process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer">{process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS}</a>
          <br />
          <a className='underline' href={process.env.NEXT_PUBLIC_GITHUB_REPO} target="_blank" rel="noopener noreferrer">
            GitHub Repository
          </a>
        </p>
      </footer>
    </div >
  );
}
