// app/components.tsx
'use client';

import { gql, useQuery } from '@apollo/client';

// 1. Query and Component for Gymnast Details
const GET_GYMNAST_DETAILS = gql`
  query GetGymnastDetails {
    gymnast(gymnastId: 2234876) {
      gymnastId
      firstName
      lastName
      club {
        name
      }
    }
  }
`;

export function GymnastDetails() {
  const { loading, error, data } = useQuery(GET_GYMNAST_DETAILS);

  if (loading) return <p>Loading details...</p>;
  if (error) return <p>Error loading details: {error.message}</p>;

  const gymnast = data?.gymnast;

  return (
    <div className="text-center sm:text-left p-4 border rounded-lg">
      <h1 className="text-2xl font-bold">Gymnast Details</h1>
      {gymnast && (
        <>
          <p className="text-lg">ID: {gymnast.gymnastId}</p>
          <p className="text-lg">
            Name: {gymnast.firstName} {gymnast.lastName}
          </p>
          <p className="text-lg">Club: {gymnast.club?.name}</p>
        </>
      )}
    </div>
  );
}

// 2. Query and Component for Gymnast Scores
const GET_GYMNAST_ALLSCORES = gql`
  query GetGavinAllScores {
    scoresByGymnast(gymnastId: 2234876) {
      eventName
      finalScore
      rank
      sanction {
        name
        startDate
      }
    }
  }
`;

export function GymnastScores() {
  const { loading, error, data } = useQuery(GET_GYMNAST_ALLSCORES);

  if (loading) return <p>Loading scores...</p>;
  if (error) return <p>Error loading scores: {error.message}</p>;

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-center mb-4">All Scores</h1>
      {data?.scoresByGymnast.map((score: any, index: number) => (
        <div
          key={index}
          className="bg-black/[.05] dark:bg-white/[.06] p-4 rounded-lg mb-4"
        >
          <h2 className="text-xl font-semibold">{score.sanction.name}</h2>
          <p className="text-sm text-gray-500">
            Date:{' '}
            {new Date(parseInt(score.sanction.startDate)).toLocaleDateString()}
          </p>
          <div className="mt-2">
            <p>
              <span className="font-bold">Event:</span> {score.eventName}
            </p>
            <p>
              <span className="font-bold">Score:</span> {score.finalScore}
            </p>
            <p>
              <span className="font-bold">Rank:</span> {score.rank}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
