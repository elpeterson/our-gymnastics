import { Search } from './components/Search';
import Image from 'next/image';
import OurGymnasticsLogo from '../public/OurGymnasticsLogo.png';

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <main className="w-full max-w-2xl px-4 flex flex-col items-center">
        <Image
          src={OurGymnasticsLogo}
          alt="Our Gymnastics Logo"
          width={150}
          height={150}
          className="mb-6 rounded-full"
          priority
        />
        <h1 className="text-4xl font-bold text-center mb-2">Our Gymnastics</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          Search for Gymnasts and Clubs
        </p>
        <div className="w-full">
          <Search />
        </div>
      </main>
    </div>
  );
}
