'use client';

import { gql, useQuery } from '@apollo/client';
import { useParams } from 'next/navigation';

const GET_GYMNAST_DETAILS = gql`
  query GetGymnastDetails($gymnastId: Int!) {
    gymnast(gymnastId: $gymnastId) {
      firstName
      lastName
      gender
      club {
        name
      }
    }
  }
`;

export default function GymnastPage() {
  const params = useParams();
  const gymnastId = parseInt(params.gymnastId as string);

  const { loading, error, data } = useQuery(GET_GYMNAST_DETAILS, {
    variables: { gymnastId },
    skip: !gymnastId,
  });

  if (loading) return <p className="text-center p-8">Loading...</p>;
  if (error) return <p className="text-center p-8">Error: {error.message}</p>;
  if (!data) return null;

  const { gymnast } = data;

  return (
    <div className="container mx-auto p-8">
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
    </div>
  );
}
