# Our Gymnastics

Welcome to Our Gymnastics, a full-stack application designed to fetch, cache, and display gymnastics meet data from the MyUSAGym API. This project is architected as a monorepo, containing a GraphQL server that acts as an intelligent, persistent cache, and a Next.js client for data visualization.

## Tech Stack

* **Monorepo:** npm Workspaces
* **Backend:**
    * Node.js, TypeScript
    * Apollo Server (GraphQL)
    * PostgreSQL
    * Docker
* **Frontend:**
    * Next.js, React, TypeScript
    * Tailwind CSS
    * Apollo Client
    * Docker
* **CI/CD & Automation:**
    * GitHub Actions
    * `semantic-release` for automated versioning and releases
    * Conventional Commits specification

## Monorepo Structure

This repository uses npm workspaces to manage the client and server packages.

```
/
├── client/         # Next.js frontend application
├── server/         # Apollo GraphQL server
└── package.json    # Root package for managing workspaces
```

## Getting Started

### Prerequisites

* Node.js (v20 or later)
* npm (v8 or later)
* Docker
* A running PostgreSQL database

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd our-gymnastics
    ```

2.  **Install dependencies:**
    From the root directory, run `npm install`. This will install all dependencies for both the `client` and `server` workspaces.
    ```bash
    npm install
    ```

3.  **Set up the database:**
    Ensure your PostgreSQL server is running and you have created a database for this project. You will need to execute a database schema to create the necessary tables.

4.  **Configure Environment Variables:**
    The server requires database connection details. Create a `.env` file in the `server/` directory and add your connection variables.

5.  **Run the development servers:**
    You can run both the client and server concurrently from the root directory.
    * **Start the server:**
        ```bash
        npm run dev:server
        ```
    * **Start the client:**
        ```bash
        npm run dev:client
        ```

## GraphQL API Reference

The server provides a GraphQL API with the following queries and mutations to interact with the gymnastics data.

### Queries

| Query                                             | Description                                                                              |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `meets(status: String!): [Sanction]`              | Fetches a list of meets based on their status (e.g., "Complete", "Future").              |
| `sanction(sanctionId: Int!): Sanction`             | Fetches the details of a single meet by its sanction ID.                                 |
| `gymnast(gymnastId: Int!): Gymnast`                | Fetches the primary details for a single gymnast by their ID.                            |
| `gymnastsByClub(clubId: Int!): [Gymnast]`          | Fetches a list of all gymnasts belonging to a specific club.                             |
| `sanctionsByGymnast(gymnastId: Int!): [Sanction]`  | Fetches a list of all meets a specific gymnast has participated in.                        |
| `scoresByGymnast(gymnastId: Int!): [Score]`        | Fetches all scores for a single gymnast across all meets.                                |
| `scoresByGymnastAndEvent(gymnastId: Int!, eventId: String!): [Score]` | Fetches all scores for a specific event (e.g., Vault) for a single gymnast. |

### Mutations

| Mutation                                          | Description                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `syncSanctionAndParticipants(sanctionId: Int!): Sanction` | Fetches full meet details from the MyUSAGym API and saves all related data to the database. |
| `syncScores(resultSetId: Int!): [Score]`          | Fetches all scores for a specific competition group within a meet.                          |
| `syncSterlingGymData: [Sanction]`                 | Finds and syncs all past meets that Sterling Gym participated in since September 2022.      |

## Deployment

This repository is configured for fully automated versioning and deployment using `semantic-release` and GitHub Actions.

1.  **Commits**: All commits to the `main` branch should follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
2.  **Automated Release**: When commits with `feat` or `fix` types are pushed to `main`, a GitHub Actions workflow automatically:
    * Determines the next version number for the affected package (`client` or `server`).
    * Generates release notes based on the commit messages.
    * Creates a new GitHub Release with a corresponding Git tag (e.g., `client@1.2.0` or `server@1.1.0`).
3.  **Automated Docker Builds**: The creation of a new release triggers a separate workflow that:
    * Builds a production-ready Docker image for the released package.
    * Pushes the image to the GitHub Container Registry, tagged with the new version.
4.  **Hosting**: The resulting Docker images can then be deployed to any container hosting environment, such as a local Unraid server.
