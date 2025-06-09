# Our Gymnastics Server

## 🚀 Project Overview

Welcome to **Our Gymnastics Server**! This project is a GraphQL server built with Node.js, TypeScript, and Apollo Server. Its primary purpose is to act as an intelligent, persistent cache and data aggregator for the MyUSAGym REST APIs.

By fetching data from the various MyUSAGym endpoints and storing it in a structured PostgreSQL database, this server provides a more efficient and powerful way to query gymnastics data, such as meet results, gymnast histories, and more.

---

## ⚙️ Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or later)
* [PostgreSQL](https://www.postgresql.org/)
* A code editor like [VS Code](https://code.visualstudio.com/)

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/elpeterson/our-gymnastics-server.git](https://github.com/elpeterson/our-gymnastics-server.git)
    cd our-gymnastics-server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up the database:**
    * Make sure your PostgreSQL server is running.
    * Connect to your database and execute the SQL script in `our-gymnastics-db-schema-v3.sql` to create all the necessary tables.

4.  **Configure Environment Variables:**
    * Create a file named `.env` in the root of the project.
    * Add your database connection string to it:
        ```
        DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:5432/YOUR_DATABASE"
        ```

5.  **Run the server:**
    ```bash
    npm start
    ```
    The server will be running at `http://localhost:4000`, where you can access the Apollo Sandbox to interact with the API.

---

## 🚢 Deployment

This server is configured for automated deployment using Docker and GitHub Actions.

1.  **Dockerfile**: A `Dockerfile` is included to package the application into a container.
2.  **GitHub Actions**: A workflow in `.github/workflows/docker-publish.yml` is set up to automatically:
    * Build a new Docker image on every push to the `main` branch.
    * Push the image to the GitHub Container Registry (GHCR).
3.  **Unraid**: The application can be deployed on an Unraid server by pointing its Docker configuration to the GHCR repository (`ghcr.io/elpeterson/our-gymnastics-server`). A tool like **Watchtower** can be used to automatically pull the latest image and restart the container whenever a new version is pushed.

---

## 📖 API Reference

This is a guide to all the available queries (for fetching data) and mutations (for changing or syncing data).

### Queries

#### 1. `gymnast`
Fetches the primary details for a single gymnast by their ID.

* **Arguments:**
    * `gymnastId` (Int!): The unique ID of the gymnast.

* **Example:**
    ```graphql
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
    ```

#### 2. `sanctionsByGymnast`
Fetches a list of all meets (sanctions) that a specific gymnast has participated in, based on the data you've synced.

* **Arguments:**
    * `gymnastId` (Int!): The unique ID of the gymnast.

* **Example:**
    ```graphql
    query GetGavinPetersonsMeets {
      sanctionsByGymnast(gymnastId: 2234876) {
        sanctionId
        name
        startDate
      }
    }
    ```

#### 3. `scoresByGymnast`
Fetches all scores for a single gymnast across all meets, sorted by date.

* **Arguments:**
    * `gymnastId` (Int!): The unique ID of the gymnast.

* **Example:**
    ```graphql
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
    ```

#### 4. `scoresByGymnastAndEvent`
Fetches all scores for a specific event (e.g., Vault) for a single gymnast across all meets.

* **Arguments:**
    * `gymnastId` (Int!): The gymnast's ID.
    * `eventId` (String!): The ID for the event (e.g., Men's Vault is `"4"`).

* **Example:**
    ```graphql
    query GetGavinVaultScores {
      scoresByGymnastAndEvent(gymnastId: 2234876, eventId: "4") {
        eventName
        finalScore
        rank
        sanction {
          name
          startDate
        }
      }
    }
    ```
<br>

### Mutations

#### 1. `syncSanctionAndParticipants`
Fetches the full details for a single sanction from the MyUSAGym API and saves all related data (clubs, gymnasts, sessions, etc.) to your local database.

* **Arguments:**
    * `sanctionId` (Int!): The ID of the sanction to sync.

* **Example:**
    ```graphql
    mutation SyncSingleMeet {
      syncSanctionAndParticipants(sanctionId: 90984) {
        sanctionId
        name
      }
    }
    ```

#### 2. `syncScores`
After syncing a meet, use this mutation to fetch all the scores for a specific competition group (result set) within that meet.

* **Arguments:**
    * `resultSetId` (Int!): The ID of the result set to sync scores for.

* **Example:**
    ```graphql
    mutation SyncMeetScores {
      syncScores(resultSetId: 267558) {
        scoreId
        finalScore
        eventName
        gymnast {
          firstName
          lastName
        }
      }
    }
    ```

#### 3. `syncSterlingGymData`
A powerful batch mutation that finds and syncs all past meets that Sterling Gym participated in since September 2022.

* **Arguments:** None.

* **Example:**
    ```graphql
    mutation SyncAllSterlingData {
      syncSterlingGymData {
        sanctionId
        name
        startDate
      }
    }
    ```

