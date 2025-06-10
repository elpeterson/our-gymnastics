// client/app/sanction/[sanctionId]/page.tsx
'use client';

import { gql, useQuery } from '@apollo/client';
import { useParams, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

const GET_SANCTION_DETAILS = gql`
  query GetSanctionDetails($sanctionId: Int!, $gymnastId: Int) {
    sanction(sanctionId: $sanctionId) {
      sanctionId
      name
      startDate
      siteName
      city
      state
      gymnasts {
        gymnastId
        firstName
        lastName
        historicalClub {
          clubId
          name
        }
      }
      scores(gymnastId: $gymnastId) {
        eventName
        finalScore
        rank
        gymnast {
          gymnastId
          firstName
          lastName
        }
      }
    }
  }
`;

// Define the type for a gymnast object
interface Gymnast {
  gymnastId: number;
  firstName: string;
  lastName: string;
  historicalClub: {
    clubId: number;
    name: string;
  };
}

// Define the type for a score object
interface Score {
  eventName: string;
  finalScore: number;
  rank: number;
  gymnast: {
    gymnastId: number;
    firstName: string;
    lastName: string;
  };
}

export default function SanctionPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const [showClubs, setShowClubs] = useState(true);
  const [showGymnasts, setShowGymnasts] = useState(true);

  const sanctionId = parseInt(params.sanctionId as string);
  const filterGymnastId = searchParams.get('filter_gymnast_id')
    ? parseInt(searchParams.get('filter_gymnast_id') as string)
    : undefined;

  const { loading, error, data } = useQuery(GET_SANCTION_DETAILS, {
    variables: { sanctionId, gymnastId: filterGymnastId },
    skip: !sanctionId,
  });

  const groupedByClub = useMemo(() => {
    if (!data?.sanction?.gymnasts) return {};
    return data.sanction.gymnasts.reduce(
      (acc: Record<string, Gymnast[]>, gymnast: Gymnast) => {
        const clubName = gymnast.historicalClub?.name || 'Independent';
        if (!acc[clubName]) {
          acc[clubName] = [];
        }
        acc[clubName].push(gymnast);
        return acc;
      },
      {}
    );
  }, [data?.sanction?.gymnasts]);

  if (loading)
    return <div className="text-center p-10">Loading sanction details...</div>;
  if (error)
    return (
      <div className="text-center p-10 text-red-500">
        Error: {error.message}
      </div>
    );
  if (!data?.sanction)
    return <div className="text-center p-10">Sanction not found.</div>;

  const { sanction } = data;
  const scores: Score[] = sanction.scores || [];

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Sanction Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">{sanction.name}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {new Date(parseInt(sanction.startDate)).toLocaleDateString()}
        </p>
        <p className="text-md text-gray-500 dark:text-gray-500">
          {sanction.siteName}, {sanction.city}, {sanction.state}
        </p>
      </div>

      {/* Filter Controls for general view */}
      {!filterGymnastId && (
        <div className="flex items-center space-x-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 mb-8">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showClubs}
              onChange={() => setShowClubs(!showClubs)}
              className="h-5 w-5 rounded"
            />
            <span className="ml-2">Show Clubs</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showGymnasts}
              onChange={() => setShowGymnasts(!showGymnasts)}
              className="h-5 w-5 rounded"
            />
            <span className="ml-2">Show Gymnasts</span>
          </label>
        </div>
      )}

      {/* Display Content */}
      {filterGymnastId && scores.length > 0 ? (
        // View for a specific gymnast's scores
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Scores for {scores[0].gymnast.firstName}{' '}
            {scores[0].gymnast.lastName}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-900 rounded-lg shadow">
              <thead>
                <tr className="w-full bg-gray-200 dark:bg-gray-700 text-left">
                  <th className="p-3">Event</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Rank</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score: Score, index: number) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    <td className="p-3">{score.eventName}</td>
                    <td className="p-3">{score.finalScore.toFixed(3)}</td>
                    <td className="p-3">{score.rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // General view with all participants
        <div>
          <h2 className="text-2xl font-bold mb-4">Participants</h2>
          {Object.keys(groupedByClub)
            .sort()
            .map((clubName) => (
              <div
                key={clubName}
                className={`mb-6 ${!showClubs && 'border-none'}`}
              >
                {showClubs && (
                  <h3 className="text-xl font-semibold p-3 bg-gray-100 dark:bg-gray-800 rounded-t-lg">
                    {clubName}
                  </h3>
                )}
                {showGymnasts && (
                  <ul
                    className={`pl-5 pr-2 py-2 list-disc list-inside ${
                      showClubs ? 'border border-t-0 rounded-b-lg' : ''
                    }`}
                  >
                    {groupedByClub[clubName].map((gymnast: Gymnast) => (
                      <li key={gymnast.gymnastId} className="my-1">
                        {gymnast.firstName} {gymnast.lastName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
