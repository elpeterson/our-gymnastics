import { Search } from './components/Search';

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <main className="w-full max-w-2xl px-4">
        <h1 className="text-4xl font-bold text-center mb-2">Our Gymnastics</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          Search for Gymnasts and Clubs
        </p>
        <Search />
      </main>
    </div>
  );
}
