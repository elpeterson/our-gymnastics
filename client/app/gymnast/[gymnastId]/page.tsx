'use client';

import { gql, useQuery } from '@apollo/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const GET_GYMNAST_DETAILS_AND_SANCTIONS = gql`
  query GetGymnastDetailsAndSanctions($gymnastId: Int!) {
    gymnast(gymnastId: $gymnastId) {
      firstName
      lastName
      gender
      club {
        name
      }
    }
    sanctionsByGymnast(gymnastId: $gymnastId) {
      sanctionId
      name
      startDate
    }
  }
`;

export default function GymnastPage() {
  const params = useParams();
  const gymnastId = parseInt(params.gymnastId as string);

  const { loading, error, data } = useQuery(GET_GYMNAST_DETAILS_AND_SANCTIONS, {
    variables: { gymnastId },
    skip: !gymnastId,
  });

  if (loading) return <p className="text-center p-8">Loading...</p>;
  if (error) return <p className="text-center p-8">Error: {error.message}</p>;
  if (!data) return null;

  const { gymnast, sanctionsByGymnast } = data;

  return (
    <div className="container mx-auto p-8">
      {/* --- Gymnast Details --- */}
      <h1 className="text-3xl font-bold">
        {gymnast.firstName} {gymnast.lastName}
      </h1>
      <div className="mt-4 text-lg">
        <p>
          <span className="font-bold">Discipline:</span> {gymnast.gender}
        </p>
        <p>
          <span className="font-bold">Club:</span> {gymnast.club.name}
        </p>
      </div>

      <hr className="my-8" />

      {/* --- Sanctions History --- */}
      <div className="mt-4">
        <h2 className="text-2xl font-bold mb-4">Competition History</h2>
        {sanctionsByGymnast && sanctionsByGymnast.length > 0 ? (
          <ul className="space-y-4">
            {sanctionsByGymnast.map((sanction: any) => (
              <Link
                key={sanction.sanctionId}
                href={`/sanction/${sanction.sanctionId}?filter_gymnast_id=${gymnastId}`}
                className="block p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              >
                <p className="font-semibold text-lg">{sanction.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Date:{' '}
                  {new Date(parseInt(sanction.startDate)).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </ul>
        ) : (
          <p>No competition history found.</p>
        )}
      </div>
    </div>
  );
}
