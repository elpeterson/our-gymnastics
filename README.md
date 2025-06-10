# Our Gymnastics

Welcome to Our Gymnastics, a modern web application for searching and viewing information about competitive gymnasts and gymnastics clubs. This project provides a streamlined interface to quickly find data sourced from the USAG API.

## Features

-   **Unified Search**: A central, type-ahead search bar to find gymnasts and clubs quickly.
-   **Gymnast Profiles**: Detailed pages for each gymnast, including their basic information and a complete history of their sanctioned competition participation.
-   **Club Rosters**: Detailed pages for each club, including their location and a full roster of their gymnasts, conveniently grouped by discipline and level.
-   **Automated CI/CD**: The project is configured with GitHub Actions for automated testing, versioning with Semantic Release, and Docker image publishing to GitHub Container Registry.

## Tech Stack

-   **Frontend**: Next.js, React, TypeScript, Apollo Client, Tailwind CSS
-   **Backend**: Node.js, Apollo Server, GraphQL, TypeScript, PostgreSQL
-   **DevOps**: Docker, GitHub Actions, Semantic Release

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v20 or later)
-   [Docker](https://www.docker.com/) and Docker Compose
-   A running PostgreSQL instance

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/elpeterson/our-gymnastics.git](https://github.com/elpeterson/our-gymnastics.git)
    cd our-gymnastics
    ```

2.  **Install dependencies:** This is a monorepo, so you'll need to install dependencies in the root, client, and server directories.
    ```bash
    npm install
    npm install --prefix client
    npm install --prefix server
    ```

3.  **Configure Server Environment:** The server requires a connection to a PostgreSQL database. Create a `.env` file in the `server/` directory with your database credentials.
    ```
    # server/.env
    DB_USER=your_postgres_user
    DB_HOST=your_postgres_host
    DB_DATABASE=your_postgres_db
    DB_PASSWORD=your_postgres_password
    DB_PORT=5432
    ```

4.  **Run the application:**
    -   To start the backend GraphQL server:
        ```bash
        npm run dev --prefix server
        ```
    -   To start the frontend Next.js application:
        ```bash
        npm run dev --prefix client
        ```

    - The client will be available at `http://localhost:3000`.
    - The server's GraphQL playground will be at `http://localhost:4000`.

---

## GraphQL API Documentation

The backend exposes a GraphQL API for all data operations.

### Queries

| Query                               | Description                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `search(term: String!)`             | Performs a type-ahead search for gymnasts and clubs. Returns a `SearchResult` union. |
| `gymnast(gymnastId: Int!)`          | Fetches detailed information for a single gymnast.                          |
| `club(clubId: Int!)`                | Fetches detailed information for a single club.                             |
| `gymnastsByClub(clubId: Int!)`      | Retrieves a list of all gymnasts registered to a specific club.             |
| `sanctionsByGymnast(gymnastId: Int!)`| Retrieves a list of all competitions a specific gymnast has participated in.  |
| `scoresByGymnast(gymnastId: Int!)`  | Retrieves all scores for a specific gymnast across all competitions.        |
| `meets(status: String!)`            | Fetches a list of meets by their status (e.g., `Complete`, `InProgress`).   |
| `sanction(sanctionId: Int!)`        | Fetches detailed information for a single competition sanction.             |

### Mutations

These mutations are primarily for administrative use to sync data from the USAG API into the local database.

| Mutation                                    | Description                                                                                                    |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `syncSanctionAndParticipants(sanctionId: Int!)`| Fetches and stores all data for a specific sanction, including clubs, gymnasts, and session details.            |
| `syncScores(resultSetId: Int!)`             | Fetches and stores all scores for a given result set within a competition session.                             |
| `syncSterlingGymData`                       | A specialized mutation to find and sync all meets that a specific club (Sterling Gym) has participated in.       |

### Example Queries

**Search for a gymnast or club:**
```graphql
query SearchQuery($term: String!) {
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
```

**Get gymnast details and their competition history:**
```graphql
query GetGymnastDetails($gymnastId: Int!) {
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
