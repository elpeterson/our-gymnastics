'use client';

import { gql, useQuery } from '@apollo/client';
import { useParams } from 'next/navigation';

const GET_CLUB_DETAILS = gql`
  query GetClubDetails($clubId: Int!) {
    club(clubId: $clubId) {
      name
      city
      state
    }
    gymnastsByClub(clubId: $clubId) {
      gymnastId
      firstName
      lastName
      gender
      level
    }
  }
`;

interface Gymnast {
  gymnastId: number;
  firstName: string;
  lastName: string;
  gender: string;
  level: string;
}

export default function ClubPage() {
  const params = useParams();
  const clubId = parseInt(params.clubId as string);

  const { loading, error, data } = useQuery(GET_CLUB_DETAILS, {
    variables: { clubId },
    skip: !clubId,
  });

  if (loading) return <p className="text-center p-8">Loading...</p>;
  if (error) return <p className="text-center p-8">Error: {error.message}</p>;
  if (!data) return null;

  const { club, gymnastsByClub } = data;

  // Group gymnasts by gender, then by level
  const groupedGymnasts = gymnastsByClub.reduce(
    (acc: any, gymnast: Gymnast) => {
      const { gender, level } = gymnast;
      if (!acc[gender]) {
        acc[gender] = {};
      }
      if (!acc[gender][level]) {
        acc[gender][level] = [];
      }
      acc[gender][level].push(gymnast);
      return acc;
    },
    {}
  );

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold">{club.name}</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400">{`${club.city}, ${club.state}`}</p>
      <hr className="my-6" />

      <h2 className="text-3xl font-bold mb-4">Roster</h2>
      {Object.keys(groupedGymnasts).map((gender) => (
        <div key={gender} className="mb-8">
          <h3 className="text-2xl font-semibold capitalize border-b pb-2 mb-4">
            {gender}
          </h3>
          {Object.keys(groupedGymnasts[gender])
            .sort()
            .map((level) => (
              <div key={level} className="mb-4">
                <h4 className="text-xl font-medium">Level: {level}</h4>
                <ul className="list-disc pl-5 mt-2">
                  {groupedGymnasts[gender][level].map((gymnast: Gymnast) => (
                    <li key={gymnast.gymnastId} className="text-base">
                      {gymnast.firstName} {gymnast.lastName}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
