// app/page.js or pages/index.js (depending on your Next.js version)

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from "next/image";
import styles from './page.module.css';

async function GetTime() {
  const res = await fetch('https://timeapi.io/api/time/current/zone?timeZone=Europe%2FParis');
  const data = await res.json();
  return data;
}


export default function Home() {

  const [timeData, setTimeData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const data = await GetTime();
      setTimeData(data);
  }

  fetchData();

  const interval = setInterval(() => {
    fetchData();
  }, 60000);

  return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-t from-white to-gray-700">
    
      <nav className="flex py-4 bg-gray-800 space-x-4">

        <div className="bg-white rounded-xl p-2 ml-4 overflow-hidden relative w-20 h-20 hover:shadow-xl  shadow-green-500 transition-shadow items-center">
          <Link href="https://github.com/444sofiane">
            <button className="bg-white rounded-full p-2 justify-center items-center">
              <Image src={"https://avatars.githubusercontent.com/u/91785730?v=4"} alt="Sofiane SAOU" layout="fill" objectFit="cover"/>
            </button>
          </Link>
        </div>

        <div className="flex-grow flex justify-start items-center">
          <h1 className="text-white text-2xl font-bold">Sofiane SAOU</h1>
        </div>

        <div className="flex-col inline-block space-y-4 justify-end items-center p-4">
          <p className="text-white text-sm">{timeData.day}/{timeData.month}/{timeData.year}</p>
          <p className="text-white text-sm">{timeData.hour}:{timeData.minute}</p>
        </div>

      </nav>
      
      <main className="max-w-6xl mx-auto flex justify-center items-center space-x-24">

        <section className="bg-white flex-col rounded-xl items-center justify-center space-y-4 mt-24 inline-block p-4">
          <h1 className=" text-gray-800 text-3xl font-bold">Welcome to my Next.js site ❗❗</h1>
          <p className="text-lg text-gray-800">This is a simple Next.js site using Tailwind CSS 😀</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <Link href="/pokemonteam">
              <button className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors">
                Pokémon Team
              </button>
            </Link>
            <button className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors">
              In Work
            </button>
            <button className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors">
              In Work
            </button>
            <button className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors">
              In Work
            </button>
          </div>
        </section>

        <section className="flex-col rounded-xl items-center inline-block justify-center space-y-4 mt-24 p-4">
          <div className={`${styles.heart}`}> 
            <Image src="/mon_bb.png" alt="My gf" width={100} height={100} objectFit="cover"/>
          </div>
        </section>  

      </main>
    
    </div>
  );
}