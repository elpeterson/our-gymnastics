'use client';

import { useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';

const SEARCH_QUERY = gql`
  query Search($term: String!) {
    search(term: $term) {
      ... on Gymnast {
        __typename
        gymnastId
        firstName
        lastName
      }
      ... on Club {
        __typename
        clubId
        name
        state
      }
    }
  }
`;

export function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const [executeSearch, { loading, data }] = useLazyQuery(SEARCH_QUERY, {
    variables: { term: debouncedSearchTerm },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.trim() !== '') {
      executeSearch();
    }
  };

  const handleSelect = (item: any) => {
    if (item.__typename === 'Gymnast') {
      router.push(`/gymnast/${item.gymnastId}`);
    } else if (item.__typename === 'Club') {
      router.push(`/club/${item.clubId}`);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder="Search for a gymnast or club..."
        className="w-full px-4 py-3 border border-gray-300 rounded-full dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
      {debouncedSearchTerm && (
        <div className="absolute mt-1 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-10">
          {loading && <p className="p-4">Loading...</p>}
          {data?.search.map((item: any) => (
            <div
              key={item.gymnastId || item.clubId}
              onClick={() => handleSelect(item)}
              className="p-4 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-200 dark:border-gray-700"
            >
              <p className="font-bold">
                {item.firstName
                  ? `${item.firstName} ${item.lastName}`
                  : item.name}
              </p>
              <p className="text-sm text-gray-500">
                {item.__typename === 'Gymnast'
                  ? 'Gymnast'
                  : `Club - ${item.state}`}
              </p>
            </div>
          ))}
          {!loading && data?.search.length === 0 && (
            <p className="p-4">No results found.</p>
          )}
        </div>
      )}
    </div>
  );
}
