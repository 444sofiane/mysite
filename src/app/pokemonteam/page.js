import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import localFont from "next/font/local";


const pokemonFont = localFont({
    src: [
        {
            path: "../../../public/Pokemon_Solid.ttf",
        }
    ],
    variable: "--font-pokemon",
});


async function getPokemonData() {
    const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000', { next: { revalidate: 3600 } });
    return res.json();
  }

async function getPokemonDetails(url) {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    return res.json();
}

export default async function CustomPage() {

    const data = await getPokemonData();
    const pokemons = data.results;
    const desiredPokemonNames = ["goodra", "kabutops", "kingdra", "ludicolo", "scizor", "dragonite"];
    const filteredPokemons = pokemons.filter(pokemon => desiredPokemonNames.includes(pokemon.name));
    const detailedPokemons = await Promise.all(filteredPokemons.map(pokemon => getPokemonDetails(pokemon.url)));
    const pokemonData = detailedPokemons.map(pokemon => {
        return {
            name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
            types: pokemon.types.map(type => {
                 const typeName = type.type.name;
                return `https://duiker101.github.io/pokemon-type-svg-icons/icons/${typeName}.svg`;
            }),
            image: pokemon.sprites.front_default,
            backimage: pokemon.sprites.back_default,
            imageshiny: pokemon.sprites.front_shiny,
            backimageshiny: pokemon.sprites.back_shiny
        }
    });

    return (
        <div className="min-h-screen bg-gradient-to-t from-indigo-300 to-indigo-500">

            <nav className="flex flex-col py-4 items-start  bg-indigo-600 space-y-4">
                <div className="bg-white p-2 rounded-full inline-block ml-4">
                    <Image src={"/pokemon.png"} alt="Pokémon Logo" width={100} height={100}/>
                </div>
                <div className={`inline-block text-white text-xl ${styles.pokemonTitle} ml-4`}>
                    Pokemon Rain Team
                </div>
            </nav>
           
            <div className="flex space-x-24 mb-7 mt-7">
                <Link href="/">
                    <button className={`px-4 py-2 bg-indigo-600 text-white ${styles.pokemonName} rounded-md hover:bg-indigo-700 transition-colors`}>
                        Home
                    </button>
                </Link>
                <Link href="/tailwindcss">
                    <button className={`px-4 py-2 bg-indigo-600 text-white ${styles.pokemonName} rounded-md hover:bg-indigo-700 transition-colors`}>
                        Tailwind CSS Demo
                    </button>
                </Link>
            </div>

            <main className="max-w-6xl mx-auto">
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {pokemonData.map((pokemon, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                            <div className={`flex space-x-24`}>
                                <div className={`relative h-32 w-32 ${styles.pokemonImageContainer}`}>
                                    <Image src={pokemon.image} alt={pokemon.name} width={96} height={96} className={styles.pokemonImage} />
                                    <Image src={pokemon.imageshiny} alt={pokemon.name} width={96} height={96} className={styles.pokemonImageShiny} />
                                </div>
                                <div className={`relative h-32 w-32 ${styles.pokemonBackImageContainer}`}>
                                    <Image src={pokemon.backimage} alt={pokemon.name} width={96} height={96} className={styles.pokemonImageBack} />
                                    <Image src={pokemon.backimageshiny} alt={pokemon.name} width={96} height={96} className={styles.pokemonBackImageShiny} />
                                </div>
                            </div>
                            <div className="p-6 bg-indigo-800">
                                <h3 className={`text-xl ${styles.pokemonName} font-bold mb-5 text-gray-400`}>{pokemon.name}</h3>
                                <div className="flex space-x-2">
                                    {pokemon.types.map((typeUrl, typeIndex) => (
                                        <Image key={typeIndex} src={typeUrl} alt={typeUrl} width={40} height={40} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </section>
            </main>

        </div>
    );
}
