// app/page.tsx
'use client';

import { GymnastDetails, GymnastScores } from './components';

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-4xl">
        <GymnastDetails />
        <hr className="w-full border-t border-gray-300 dark:border-gray-700" />
        <GymnastScores />
      </main>
    </div>
  );
}
