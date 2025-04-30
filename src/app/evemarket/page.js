'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function CustomPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [marketData, setMarketData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState({
        id: 10000002,
        name: "The Forge (Jita)"
    });

    // Cache for station names
    const [stationCache, setStationCache] = useState({});

    // List of major trade hubs
    const regions = [
        { id: 10000002, name: "The Forge (Jita)" },
        { id: 10000043, name: "Domain (Amarr)" },
        { id: 10000032, name: "Sinq Laison (Dodixie)" },
        { id: 10000030, name: "Heimatar (Rens)" },
        { id: 10000042, name: "Metropolis (Hek)" }
    ];

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Search for items
    const searchItems = async () => {
        if (!searchTerm.trim()) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Using the ESI search endpoint
            const response = await fetch('https://esi.evetech.net/latest/universe/ids/?datasource=tranquility&language=en', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify([searchTerm]), // Send as an array of names to search
              });
            
              console.log("Response:", response);

            if (!response.ok) {
                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After') || 1;
                    throw new Error(`Rate limited. Please try again in ${retryAfter} seconds.`);
                }
                throw new Error(`Search request failed with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.inventory_types || data.inventory_types.length === 0) {
                setSearchResults([]);
                return;
            }
            
            // Now we need to get details for each type ID (limit to first 15 results to avoid too many requests)
            const typeIds = data.inventory_types.map(item => item.id).slice(0, 15)
            const itemDetails = await Promise.all(
                typeIds.map(async (typeId) => {
                    try {
                        const typeResponse = await fetch(
                            `https://esi.evetech.net/latest/universe/types/${typeId}/?datasource=tranquility&language=en`
                        );
                        
                        if (!typeResponse.ok) {
                            if (typeResponse.status === 429) {
                                // Skip this item on rate limit
                                return null;
                            }
                            return null;
                        }
                        
                        const typeData = await typeResponse.json();
                        return {
                            id: typeId,
                            name: typeData.name,
                            description: typeData.description ? typeData.description.replace(/<[^>]*>/g, '') : 'No description available'
                        };
                    } catch (err) {
                        console.error(`Error fetching details for type ID ${typeId}:`, err);
                        return null;
                    }
                })
            );
            
            const validResults = itemDetails.filter(item => item !== null);
            setSearchResults(validResults);
        } catch (err) {
            setError(err.message || "Failed to search for items. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Get station name from location ID
    const getStationName = async (locationId) => {
        // Check cache first
        if (stationCache[locationId]) return stationCache[locationId];
        
        try {
            // Try structure endpoint first (for citadels, etc.)
            try {
                const structureResponse = await fetch(
                    `https://esi.evetech.net/latest/universe/structures/${locationId}/?datasource=tranquility`
                );
                
                if (structureResponse.ok) {
                    const structureData = await structureResponse.json();
                    // Update cache
                    setStationCache(prev => ({
                        ...prev,
                        [locationId]: structureData.name
                    }));
                    return structureData.name;
                }
            } catch (e) {
                // Structure endpoint failed, continue to stations
            }
            
            // Try station endpoint next (for NPC stations)
            const stationResponse = await fetch(
                `https://esi.evetech.net/latest/universe/stations/${locationId}/?datasource=tranquility`
            );
            
            if (stationResponse.ok) {
                const stationData = await stationResponse.json();
                // Update cache
                setStationCache(prev => ({
                    ...prev,
                    [locationId]: stationData.name
                }));
                return stationData.name;
            }
            
            // If all else fails, return the ID
            return `Location #${locationId}`;
        } catch (err) {
            console.error(`Error fetching location ${locationId}:`, err);
            return `Location #${locationId}`;
        }
    };

    // Common station mappings for performance
    const commonStations = {
        60003760: "Jita IV - Moon 4 - Caldari Navy Assembly Plant",
        60008494: "Amarr VIII (Oris) - Emperor Family Academy",
        60011866: "Dodixie IX - Moon 20 - Federation Navy Assembly Plant",
        60004588: "Rens VI - Moon 8 - Brutor Tribe Treasury",
        60005686: "Hek VIII - Moon 12 - Boundless Creation Factory"
    };

    // Fetch market data for a selected item
    const fetchMarketData = async (itemId) => {
        setLoading(true);
        setError(null);
        
        try {
            // Fetch buy orders
            const buyOrdersResponse = await fetch(
                `https://esi.evetech.net/latest/markets/${selectedRegion.id}/orders/?datasource=tranquility&order_type=buy&type_id=${itemId}`
            );
            
            if (!buyOrdersResponse.ok) {
                if (buyOrdersResponse.status === 429) {
                    const retryAfter = buyOrdersResponse.headers.get('Retry-After') || 1;
                    throw new Error(`Rate limited. Please try again in ${retryAfter} seconds.`);
                }
                throw new Error(`Buy orders request failed with status: ${buyOrdersResponse.status}`);
            }
            
            const buyOrdersData = await buyOrdersResponse.json();
            
            // Fetch sell orders
            const sellOrdersResponse = await fetch(
                `https://esi.evetech.net/latest/markets/${selectedRegion.id}/orders/?datasource=tranquility&order_type=sell&type_id=${itemId}`
            );
            
            if (!sellOrdersResponse.ok) {
                if (sellOrdersResponse.status === 429) {
                    const retryAfter = sellOrdersResponse.headers.get('Retry-After') || 1;
                    throw new Error(`Rate limited. Please try again in ${retryAfter} seconds.`);
                }
                throw new Error(`Sell orders request failed with status: ${sellOrdersResponse.status}`);
            }
            
            const sellOrdersData = await sellOrdersResponse.json();
            
            // Process the buy orders (highest price first)
            const buyOrders = buyOrdersData
                .sort((a, b) => b.price - a.price)
                .slice(0, 10);
                
            // Process the sell orders (lowest price first)
            const sellOrders = sellOrdersData
                .sort((a, b) => a.price - b.price)
                .slice(0, 10);
                
            // Get station names for all unique location IDs
            const locationIds = [...new Set([
                ...buyOrders.map(order => order.location_id),
                ...sellOrders.map(order => order.location_id)
            ])];
            
            const locationPromises = locationIds.map(async locationId => {
                // Check common stations first for performance
                if (commonStations[locationId]) {
                    return [locationId, commonStations[locationId]];
                }
                
                const name = await getStationName(locationId);
                return [locationId, name];
            });
            
            const locationResults = await Promise.all(locationPromises);
            const locationMap = Object.fromEntries(locationResults);
            
            // Format buy orders with location names
            const formattedBuyOrders = buyOrders.map(order => ({
                price: order.price,
                volume: order.volume_remain,
                location: locationMap[order.location_id] || `Location #${order.location_id}`,
                locationId: order.location_id,
                updated: new Date(order.issued).toISOString(),
                range: order.range,
                minVolume: order.min_volume
            }));
            
            // Format sell orders with location names
            const formattedSellOrders = sellOrders.map(order => ({
                price: order.price,
                volume: order.volume_remain,
                location: locationMap[order.location_id] || `Location #${order.location_id}`,
                locationId: order.location_id,
                updated: new Date(order.issued).toISOString(),
                range: order.range,
                minVolume: order.min_volume
            }));
            
            // Try to fetch history data if available
            let historyData = [];
            try {
                const historyResponse = await fetch(
                    `https://esi.evetech.net/latest/markets/${selectedRegion.id}/history/?datasource=tranquility&type_id=${itemId}`
                );
                
                if (historyResponse.ok) {
                    historyData = await historyResponse.json();
                    // Sort by date
                    historyData = historyData.sort((a, b) => new Date(a.date) - new Date(b.date));
                }
            } catch (histErr) {
                console.error("Error fetching history data:", histErr);
                // Continue without history data
            }
            
            // Set the market data
            setMarketData({
                region: selectedRegion.name,
                buy_orders: formattedBuyOrders,
                sell_orders: formattedSellOrders,
                history: historyData.slice(-30) // Last 30 days
            });
        } catch (err) {
            setError(err.message || "Failed to fetch market data. Please try again.");
            console.error("Error fetching market data:", err);
        } finally {
            setLoading(false);
        }
    };

    // Handle item selection
    const handleSelectItem = (item) => {
        setSelectedItem(item);
        fetchMarketData(item.id);
    };

    // Handle region change
    const handleRegionChange = (e) => {
        const regionId = parseInt(e.target.value);
        const region = regions.find(r => r.id === regionId);
        setSelectedRegion(region);
        
        // If there's a selected item, refetch market data for new region
        if (selectedItem) {
            fetchMarketData(selectedItem.id);
        }
    };

    // Handle search button click
    const handleSearchClick = () => {
        searchItems();
    };

    // Handle Enter key press in search input
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            searchItems();
        }
    };

    // Format ISK with commas and 2 decimal places
    const formatISK = (amount) => {
        return amount.toLocaleString('en-US', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <div className="min-h-screen bg-gray-800 text-white">
            {/* Navigation bar */}
            <nav className="flex flex-col py-4 items-start bg-gray-700 border-b border-gray-600 space-y-4">
                <div className="bg-white p-2 inline-block ml-4 px-2 rounded">
                    <Image src={"/evemarket.png"} alt="EVE Online Logo" width={100} height={100} />  
                </div>
                <div className="inline-block text-white text-xl ml-4 font-bold">
                    EVE Online Market Tracker
                </div>
            </nav>
            
            {/* Navigation links */}
            <div className="flex space-x-4 mb-4 mt-4 px-4">
                <Link href="/">
                    <button className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors">
                        Home
                    </button>
                </Link>
            </div>
            
            {/* Main content */}
            <div className="container mx-auto px-4 py-6">
                <h1 className="text-3xl font-bold mb-8 text-center">
                    EVE Online Market Finder
                </h1>
                
                {/* Region selector */}
                <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium">Select Trade Hub:</label>
                    <select
                        value={selectedRegion.id}
                        onChange={handleRegionChange}
                        className="bg-gray-700 border border-gray-600 text-white rounded-md px-4 py-2 w-full max-w-md"
                    >
                        {regions.map((region) => (
                            <option key={region.id} value={region.id}>
                                {region.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* Search bar */}
                <div className="flex items-center justify-center mb-8">
                    <div className="relative w-full max-w-2xl">
                        <input
                            type="text"
                            placeholder="Search for items (e.g., Tritanium, PLEX, Skill Injector)..."
                            className="w-full px-4 py-2 rounded-l-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyPress={handleKeyPress}
                        />
                        <button
                            className="absolute right-0 top-0 h-full px-4 bg-blue-600 rounded-r-md hover:bg-blue-700 transition-colors"
                            onClick={handleSearchClick}
                        >
                            Search
                        </button>
                    </div>
                </div>
                
                {/* Error message */}
                {error && (
                    <div className="bg-red-500 text-white p-4 rounded-md mb-6">
                        {error}
                    </div>
                )}
                
                {/* Loading indicator */}
                {loading && (
                    <div className="flex justify-center items-center my-8">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                
                {/* Search results */}
                {!loading && searchResults.length > 0 && !selectedItem && (
                    <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-600">
                            <h2 className="text-xl font-bold">Search Results</h2>
                        </div>
                        <ul>
                            {searchResults.map((item) => (
                                <li
                                    key={item.id}
                                    className="px-6 py-4 border-b border-gray-600 hover:bg-gray-600 cursor-pointer transition-colors"
                                    onClick={() => handleSelectItem(item)}
                                >
                                    <div className="font-semibold">{item.name}</div>
                                    <div className="text-gray-400 text-sm">{item.description}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {/* Selected item market data */}
                {selectedItem && marketData && (
                    <div className="space-y-6">
                        {/* Item details */}
                        <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                            <div className="px-6 py-4 border-b border-gray-600">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold">{selectedItem.name}</h2>
                                    <button
                                        className="px-3 py-1 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors text-sm"
                                        onClick={() => setSelectedItem(null)}
                                    >
                                        Back to Search
                                    </button>
                                </div>
                                <p className="text-gray-400 mt-2">{selectedItem.description}</p>
                            </div>
                            <div className="px-6 py-4">
                                <p>Market Region: {marketData.region}</p>
                                <p className="text-sm text-gray-400">Type ID: {selectedItem.id}</p>
                            </div>
                        </div>
                        
                        {/* Market summary at a glance */}
                        <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                            <div className="px-6 py-4 border-b border-gray-600">
                                <h3 className="text-lg font-bold">Market Summary</h3>
                            </div>
                            <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-800 p-4 rounded-md">
                                    <div className="text-sm text-gray-400">Highest Buy</div>
                                    <div className="text-xl text-green-400">
                                        {marketData.buy_orders.length > 0 
                                            ? formatISK(marketData.buy_orders[0].price) + " ISK"
                                            : "No buy orders"}
                                    </div>
                                </div>
                                <div className="bg-gray-800 p-4 rounded-md">
                                    <div className="text-sm text-gray-400">Lowest Sell</div>
                                    <div className="text-xl text-red-400">
                                        {marketData.sell_orders.length > 0 
                                            ? formatISK(marketData.sell_orders[0].price) + " ISK"
                                            : "No sell orders"}
                                    </div>
                                </div>
                                <div className="bg-gray-800 p-4 rounded-md">
                                    <div className="text-sm text-gray-400">Margin</div>
                                    <div className="text-xl text-blue-400">
                                        {marketData.sell_orders.length > 0 && marketData.buy_orders.length > 0
                                            ? formatISK(marketData.sell_orders[0].price - marketData.buy_orders[0].price) + " ISK"
                                            : "N/A"}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Buy orders */}
                        <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                            <div className="px-6 py-4 border-b border-gray-600">
                                <h3 className="text-lg font-bold text-green-400">Buy Orders (Sell To)</h3>
                            </div>
                            {marketData.buy_orders.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-800">
                                                <th className="px-6 py-3 text-left">Price (ISK)</th>
                                                <th className="px-6 py-3 text-left">Volume</th>
                                                <th className="px-6 py-3 text-left">Location</th>
                                                <th className="px-6 py-3 text-left">Range</th>
                                                <th className="px-6 py-3 text-left">Min Volume</th>
                                                <th className="px-6 py-3 text-left">Updated</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {marketData.buy_orders.map((order, index) => (
                                                <tr key={index} className="border-b border-gray-600 hover:bg-gray-600">
                                                    <td className="px-6 py-4 font-medium text-green-400">{formatISK(order.price)}</td>
                                                    <td className="px-6 py-4">{order.volume.toLocaleString()}</td>
                                                    <td className="px-6 py-4">{order.location}</td>
                                                    <td className="px-6 py-4">{order.range}</td>
                                                    <td className="px-6 py-4">{order.minVolume}</td>
                                                    <td className="px-6 py-4">{new Date(order.updated).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="px-6 py-4 text-center">
                                    No buy orders found for this item in {marketData.region}.
                                </div>
                            )}
                        </div>
                        
                        {/* Sell orders */}
                        <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                            <div className="px-6 py-4 border-b border-gray-600">
                                <h3 className="text-lg font-bold text-red-400">Sell Orders (Buy From)</h3>
                            </div>
                            {marketData.sell_orders.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-800">
                                                <th className="px-6 py-3 text-left">Price (ISK)</th>
                                                <th className="px-6 py-3 text-left">Volume</th>
                                                <th className="px-6 py-3 text-left">Location</th>
                                                <th className="px-6 py-3 text-left">Min Volume</th>
                                                <th className="px-6 py-3 text-left">Updated</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {marketData.sell_orders.map((order, index) => (
                                                <tr key={index} className="border-b border-gray-600 hover:bg-gray-600">
                                                    <td className="px-6 py-4 font-medium text-red-400">{formatISK(order.price)}</td>
                                                    <td className="px-6 py-4">{order.volume.toLocaleString()}</td>
                                                    <td className="px-6 py-4">{order.location}</td>
                                                    <td className="px-6 py-4">{order.minVolume}</td>
                                                    <td className="px-6 py-4">{new Date(order.updated).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="px-6 py-4 text-center">
                                    No sell orders found for this item in {marketData.region}.
                                </div>
                            )}
                        </div>
                        
                        {/* Price history - if we have history data */}
                        {marketData.history && marketData.history.length > 0 && (
                            <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                                <div className="px-6 py-4 border-b border-gray-600">
                                    <h3 className="text-lg font-bold">Price History (Last 30 Days)</h3>
                                </div>
                                <div className="px-6 py-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-800">
                                                    <th className="px-6 py-3 text-left">Date</th>
                                                    <th className="px-6 py-3 text-left">Average Price</th>
                                                    <th className="px-6 py-3 text-left">Lowest Price</th>
                                                    <th className="px-6 py-3 text-left">Highest Price</th>
                                                    <th className="px-6 py-3 text-left">Volume</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {marketData.history.slice(-7).map((day, index) => (
                                                    <tr key={index} className="border-b border-gray-600 hover:bg-gray-600">
                                                        <td className="px-6 py-4">{day.date}</td>
                                                        <td className="px-6 py-4">{formatISK(day.average)}</td>
                                                        <td className="px-6 py-4">{formatISK(day.lowest)}</td>
                                                        <td className="px-6 py-4">{formatISK(day.highest)}</td>
                                                        <td className="px-6 py-4">{day.volume.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-4 text-sm text-gray-400 text-center">
                                        Showing the last 7 days of price history. Full history contains {marketData.history.length} days.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* No results message */}
                {!loading && searchResults.length === 0 && searchTerm && (
                    <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg p-6 text-center">
                        <p>No items found matching "{searchTerm}".</p>
                    </div>
                )}
                
                {/* Welcome message (initial state) */}
                {!loading && !searchTerm && searchResults.length === 0 && !selectedItem && (
                    <div className="text-center space-y-4 mt-12">
                        <h2 className="text-2xl font-bold">Find Market Data for EVE Online Items</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Search for items to view current market prices, buy and sell orders, and market trends.
                            Get the most up-to-date market information to maximize your profits in New Eden.
                        </p>
                        <div className="flex flex-col space-y-2 items-center mt-8">
                            <div className="text-gray-400">Popular searches:</div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {["Tritanium", "PLEX", "Skill Injector", "Mexallon", "Pyerite"].map((term) => (
                                    <button
                                        key={term}
                                        className="px-3 py-1 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors text-sm"
                                        onClick={() => {
                                            setSearchTerm(term);
                                            setTimeout(() => searchItems(), 100);
                                        }}
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-6 mt-12">
                <div className="container mx-auto px-4 text-center">
                    <p>All EVE Online related materials are property of CCP Games.</p>
                    <p className="text-sm mt-2">This is a fan-made tool using the ESI API and is not affiliated with CCP Games.</p>
                    <p className="text-sm mt-2">
                        <a 
                            href="https://esi.evetech.net/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                        >
                            EVE ESI API Documentation
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}