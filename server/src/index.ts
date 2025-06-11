import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import pg from 'pg';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

// --- DATABASE SETUP ---
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

pool.on('connect', () => console.log('🎉 Database connected'));
pool.on('error', (err) =>
  console.error('🔥 Database connection error', err.stack)
);

// --- API DATA TYPE INTERFACES ---
interface ApiMeet {
  sanctionId: number;
  name: string;
  startDate: string;
  siteName: string;
}

interface ApiClub {
  clubId: number;
  name: string;
  shortName?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  emailAddress?: string;
  phone?: number;
}

interface ApiPerson {
  personId: number;
  clubId: number;
  firstName: string;
  lastName: string;
  gender: string;
}

interface ApiSession {
  sessionId: string;
  sanctionId: number;
  name: string;
  date: string;
  program: string;
}

interface ApiResultSet {
  resultSetId: number;
  sessionId: string;
  sanctionId: number;
  level: string;
  division: string;
  official: number;
}

interface ApiSanctionPerson {
  sanctionId: number;
  personId: number;
  clubId: number; // The club they competed for in THIS sanction
  sessionId: string;
  level: string;
  division: string;
  squad: string;
}

interface ApiSanctionData {
  sanction: {
    sanctionId: number;
    name: string;
    startDate: string;
    endDate: string;
    city: string;
    state: string;
    siteName: string;
    website: string;
    program: number;
    meetStatus: 'Open' | 'Closed' | 'Complete' | 'In progress' | 'Future';
    hasResults: boolean;
    address1: string;
    zip: string;
    logoUrl: string;
  };
  clubs: { [key: string]: ApiClub };
  people: { [key: string]: ApiPerson };
  sessions: ApiSession[];
  sessionResultSets: ApiResultSet[];
  sanctionPeople: { [key: string]: ApiSanctionPerson };
}

interface ApiScoresData {
  scores: {
    scoreId: number;
    resultSetId: number;
    personId: number;
    eventId: string;
    finalScore: string;
    rank: number;
    tie: number;
  }[];
}

// --- TYPE DEFS ---
const typeDefs = `#graphql
  enum ProgramType { Womens, Mens, Rhythmic, Acrobatic, Tumbling, TeamGym }
  enum MeetStatus { Open, Closed, Complete, InProgress, Future }

  type Club {
    clubId: Int!
    name: String
    city: String
    state: String
  }

  type Gymnast {
    gymnastId: Int!
    firstName: String!
    lastName: String!
    gender: String
    level: String 
    club: Club # Represents the gymnast's primary/current club
    historicalClub: Club # Represents the club they competed for in a specific meet
  }

  type Sanction {
    sanctionId: Int!
    name: String!
    startDate: String
    endDate: String
    city: String
    state: String
    siteName: String
    meetStatus: MeetStatus
    program: ProgramType
    sessions: [Session]
    gymnasts: [Gymnast]
    scores(gymnastId: Int): [Score]
  }

  type Session {
    sessionId: Int!
    sanctionId: Int!
    name: String
    sessionDate: String
    program: ProgramType
    resultSets: [ResultSet]
  }

  type ResultSet {
    resultSetId: Int!
    level: String
    division: String
    scores: [Score]
  }

  type Score {
    scoreId: Int!
    eventId: String!
    eventName: String # New field for the friendly event name
    finalScore: Float!
    rank: Int
    tie: Boolean
    gymnast: Gymnast
    sanction: Sanction # Added field to link score to a sanction
  }

  # Add Union type for mixed search reults
  union SearchResult = Gymnast | Club

  type Query {
    meets(status: String!): [Sanction]
    sanction(sanctionId: Int!): Sanction
    gymnast(gymnastId: Int!): Gymnast
    gymnastsByClub(clubId: Int!): [Gymnast]
    sanctionsByGymnast(gymnastId: Int!): [Sanction]
    scoresByGymnastAndEvent(gymnastId: Int!, eventId: String!): [Score]
    scoresByGymnast(gymnastId: Int!): [Score]
    club(clubId: Int!): Club
    search(term: String!): [SearchResult]
  }

  type Mutation {
    syncSanctionAndParticipants(sanctionId: Int!): Sanction
    syncScores(resultSetId: Int!): [Score]
    syncSterlingGymData: [Sanction]
  }
`;

// --- DATA MAPPING HELPERS ---
const mapProgramIdToEnum = (id) => ({ 1: 'Womens', 2: 'Mens' }[id] || null);
const mapProgramStringToEnum = (str) =>
  ({ Men: 'Mens', Women: 'Womens' }[str] || null);

const safeParseInt = (
  value: string | number | null | undefined
): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? null : parsed;
};

const safeParseFloat = (
  value: string | number | null | undefined
): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? null : parsed;
};

const mapApiStatusToDbEnum = (status: string): string | null => {
  if (!status) return null;
  const lowerCaseStatus = status.toLowerCase();
  if (lowerCaseStatus === 'in progress') return 'InProgress';
  if (lowerCaseStatus === 'open') return 'Open';
  if (lowerCaseStatus === 'closed') return 'Closed';
  if (lowerCaseStatus === 'complete') return 'Complete';
  if (lowerCaseStatus === 'future') return 'Future';
  console.warn(`Unknown meet status from API: ${status}`);
  return null;
};

const mapEventIdToName = (
  eventId: string,
  program: 'Mens' | 'Womens' | null
): string | null => {
  if (!eventId || !program) return null;

  const menEvents = {
    '1': 'Floor Exercise',
    '2': 'Pommel Horse',
    '3': 'Still Rings',
    '4': 'Vault',
    '5': 'Parallel Bars',
    '6': 'High Bar',
    aa: 'All-Around',
  };

  const womenEvents = {
    '1': 'Vault',
    '2': 'Uneven Bars',
    '3': 'Balance Beam',
    '4': 'Floor Exercise',
    aa: 'All-Around',
  };

  if (program === 'Mens') {
    return menEvents[eventId] || eventId;
  }
  if (program === 'Womens') {
    return womenEvents[eventId] || eventId;
  }
  return eventId; // Default fallback
};

// --- CORE SYNC LOGIC (REFACTORED) ---
async function syncSanctionInternal(sanctionId: number, client: pg.PoolClient) {
  console.log(`Fetching full details for sanction ${sanctionId}...`);
  const response = await fetch(
    `https://api.myusagym.com/v2/sanctions/${sanctionId}`
  );
  if (!response.ok) {
    console.error(
      `Failed to fetch sanction ${sanctionId}. Status: ${response.status}`
    );
    return;
  }
  const data = (await response.json()) as ApiSanctionData;

  const s = data.sanction;
  const dbMeetStatus = mapApiStatusToDbEnum(s.meetStatus);

  await client.query(
    `INSERT INTO sanctions (sanction_id, name, start_date, end_date, city, state, site_name, website, program_id, meet_status, has_results, address1, zip, logo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (sanction_id) DO UPDATE SET name = EXCLUDED.name, start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date, meet_status = EXCLUDED.meet_status;`,
    [
      s.sanctionId,
      s.name,
      s.startDate,
      s.endDate,
      s.city,
      s.state,
      s.siteName,
      s.website,
      s.program,
      dbMeetStatus,
      s.hasResults,
      s.address1,
      s.zip,
      s.logoUrl,
    ]
  );

  for (const club of Object.values(data.clubs)) {
    await client.query(
      `INSERT INTO clubs (club_id, name, short_name, city, state, zip, website, email, phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (club_id) DO NOTHING;`,
      [
        club.clubId,
        club.name,
        club.shortName,
        club.city,
        club.state,
        club.zip,
        club.website,
        club.emailAddress,
        String(club.phone),
      ]
    );
  }

  const knownClubIds = new Set(Object.values(data.clubs).map((c) => c.clubId));
  const processedGymnastIds = new Set<number>();

  for (const person of Object.values(data.people)) {
    if (person && person.personId && person.clubId) {
      if (!knownClubIds.has(person.clubId)) {
        await client.query(
          `INSERT INTO clubs (club_id, name) VALUES ($1, $2) ON CONFLICT (club_id) DO NOTHING;`,
          [person.clubId, 'Unknown Club (placeholder)']
        );
      }
      await client.query(
        `INSERT INTO gymnasts (gymnast_id, club_id, first_name, last_name, gender)
                 VALUES ($1, $2, $3, $4, $5) ON CONFLICT (gymnast_id) DO NOTHING;`,
        [
          person.personId,
          person.clubId,
          person.firstName,
          person.lastName,
          person.gender,
        ]
      );
      processedGymnastIds.add(person.personId);
    } else {
      console.warn(
        `Skipping gymnast with missing data: ${person.firstName} ${person.lastName} (ID: ${person.personId})`
      );
    }
  }

  for (const session of data.sessions) {
    const parsedSessionId = safeParseInt(session.sessionId);
    if (parsedSessionId !== null) {
      await client.query(
        `INSERT INTO sessions (session_id, sanction_id, name, session_date, program)
                 VALUES ($1, $2, $3, $4, $5) ON CONFLICT (session_id, sanction_id) DO NOTHING;`,
        [
          parsedSessionId,
          session.sanctionId,
          session.name,
          session.date,
          mapProgramStringToEnum(session.program),
        ]
      );
    } else {
      console.warn(
        `Skipping session with invalid sessionId: "${session.sessionId}" for sanction ${sanctionId}`
      );
    }
  }

  for (const rs of data.sessionResultSets) {
    const parsedSessionId = safeParseInt(rs.sessionId);
    if (parsedSessionId !== null) {
      await client.query(
        `INSERT INTO result_sets (result_set_id, session_id, sanction_id, level, division, official)
                 VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (result_set_id) DO NOTHING;`,
        [
          rs.resultSetId,
          parsedSessionId,
          rs.sanctionId,
          rs.level,
          rs.division,
          Boolean(rs.official),
        ]
      );
    } else {
      console.warn(
        `Skipping result_set with invalid sessionId: "${rs.sessionId}" for sanction ${sanctionId}`
      );
    }
  }

  for (const sp of Object.values(data.sanctionPeople)) {
    const parsedSessionId = safeParseInt(sp.sessionId);
    if (parsedSessionId !== null && processedGymnastIds.has(sp.personId)) {
      await client.query(
        `INSERT INTO sanction_gymnasts (sanction_id, gymnast_id, session_id, level, division, squad, club_id_for_meet)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (sanction_id, gymnast_id) DO UPDATE SET club_id_for_meet = EXCLUDED.club_id_for_meet;`,
        [
          sp.sanctionId,
          sp.personId,
          parsedSessionId,
          sp.level,
          sp.division,
          sp.squad,
          sp.clubId,
        ]
      );
    } else {
      if (!processedGymnastIds.has(sp.personId)) {
        console.warn(
          `Skipping sanction_gymnasts link for personId ${sp.personId} because they were not found in the sanction's main 'people' list.`
        );
      } else {
        console.warn(
          `Skipping sanction_person with invalid sessionId: "${sp.sessionId}" for sanction ${sanctionId}`
        );
      }
    }
  }
  console.log(
    `✅ Successfully synced sanction ${sanctionId} and all participants.`
  );
}

// --- RESOLVERS ---
const resolvers = {
  SearchResult: {
    __resolveType(obj, context, info) {
      if (obj.firstName) {
        return 'Gymnast';
      }
      if (obj.city) {
        return 'Club';
      }
      return null; // Or throw an error
    },
  },

  Query: {
    meets: async (_, { status }) => {
      const res = await pool.query(
        'SELECT sanction_id AS "sanctionId", name, start_date AS "startDate", end_date AS "endDate", city, state, site_name AS "siteName", meet_status, program_id FROM sanctions WHERE meet_status = $1',
        [status]
      );
      return res.rows;
    },
    sanction: async (_, { sanctionId }) => {
      const res = await pool.query(
        'SELECT sanction_id AS "sanctionId", name, start_date AS "startDate", end_date AS "endDate", city, state, site_name AS "siteName", meet_status, program_id FROM sanctions WHERE sanction_id = $1',
        [sanctionId]
      );
      return res.rows[0];
    },
    gymnast: async (_, { gymnastId }) => {
      const res = await pool.query(
        'SELECT gymnast_id AS "gymnastId", first_name AS "firstName", last_name AS "lastName", gender, club_id FROM gymnasts WHERE gymnast_id = $1',
        [gymnastId]
      );
      return res.rows[0];
    },
    gymnastsByClub: async (_, { clubId }) => {
      const res = await pool.query(
        `
          SELECT
            g.gymnast_id AS "gymnastId",
            g.first_name AS "firstName",
            g.last_name AS "lastName",
            g.gender,
            g.club_id,
            (SELECT sg.level FROM sanction_gymnasts sg JOIN sanctions s ON sg.sanction_id = s.sanction_id WHERE sg.gymnast_id = g.gymnast_id ORDER BY s.start_date DESC LIMIT 1) as level
          FROM gymnasts g
          WHERE g.club_id = $1
          ORDER BY last_name, first_name
        `,
        [clubId]
      );
      return res.rows;
    },
    sanctionsByGymnast: async (_, { gymnastId }) => {
      const res = await pool.query(
        `
            SELECT s.sanction_id AS "sanctionId", s.name, s.start_date AS "startDate", s.site_name AS "siteName"
            FROM sanctions s
            JOIN sanction_gymnasts sg ON s.sanction_id = sg.sanction_id
            WHERE sg.gymnast_id = $1
            ORDER BY s.start_date DESC;
        `,
        [gymnastId]
      );
      return res.rows;
    },
    scoresByGymnastAndEvent: async (_, { gymnastId, eventId }) => {
      const res = await pool.query(
        `
            SELECT
                sc.score_id AS "scoreId",
                sc.event_id AS "eventId",
                sc.final_score AS "finalScore",
                sc.rank,
                sc.tie,
                sc.gymnast_id,
                rs.sanction_id,
                sess.program
            FROM scores sc
            JOIN result_sets rs ON sc.result_set_id = rs.result_set_id
            JOIN sessions sess ON rs.session_id = sess.session_id AND rs.sanction_id = sess.sanction_id
            WHERE sc.gymnast_id = $1 AND sc.event_id = $2
            ORDER BY rs.sanction_id;
        `,
        [gymnastId, eventId]
      );
      return res.rows;
    },
    scoresByGymnast: async (_, { gymnastId }) => {
      const res = await pool.query(
        `
            SELECT
                sc.score_id AS "scoreId",
                sc.event_id AS "eventId",
                sc.final_score AS "finalScore",
                sc.rank,
                sc.tie,
                sc.gymnast_id,
                rs.sanction_id,
                sess.program
            FROM scores sc
            JOIN result_sets rs ON sc.result_set_id = rs.result_set_id
            JOIN sessions sess ON rs.session_id = sess.session_id AND rs.sanction_id = sess.sanction_id
            WHERE sc.gymnast_id = $1
            ORDER BY sess.session_date DESC, sc.event_id;
        `,
        [gymnastId]
      );
      return res.rows;
    },
    club: async (_, { clubId }) => {
      const res = await pool.query(
        'SELECT club_id AS "clubId", name, city, state FROM clubs WHERE club_id = $1',
        [clubId]
      );
      return res.rows[0];
    },
    search: async (_, { term }) => {
      if (!term || term.trim() === '') {
        return [];
      }

      // Query for gymnasts
      const gymnastRes = await pool.query(
        'SELECT gymnast_id AS "gymnastId", first_name AS "firstName", last_name AS "lastName", gender, club_id FROM gymnasts WHERE first_name ILIKE $1 OR last_name ILIKE $1 LIMIT 5',
        [`%${term}%`]
      );

      // Query for clubs
      const clubRes = await pool.query(
        'SELECT club_id AS "clubId", name, city, state FROM clubs WHERE name ILIKE $1 LIMIT 5',
        [`%${term}%`]
      );

      return [...gymnastRes.rows, ...clubRes.rows];
    },
  },

  Mutation: {
    syncSanctionAndParticipants: async (_, { sanctionId }) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await syncSanctionInternal(sanctionId, client);
        await client.query('COMMIT');

        const finalRes = await client.query(
          `
                SELECT sanction_id AS "sanctionId", name, start_date AS "startDate", end_date AS "endDate", city, state, site_name AS "siteName", meet_status, program_id
                FROM sanctions WHERE sanction_id = $1`,
          [sanctionId]
        );
        return finalRes.rows[0];
      } catch (e) {
        await client.query('ROLLBACK');
        console.error(`🔥 Failed to sync sanction ${sanctionId}:`, e);
        throw e;
      } finally {
        client.release();
      }
    },
    syncScores: async (_, { resultSetId }) => {
      console.log(`Fetching scores for result set ${resultSetId}...`);
      const response = await fetch(
        `https://api.myusagym.com/v2/resultsSets/${resultSetId}`
      );
      const data = (await response.json()) as ApiScoresData;

      if (!data.scores) return [];

      const savedScores = [];
      for (const score of data.scores) {
        const query = `
              INSERT INTO scores (score_id, result_set_id, gymnast_id, event_id, final_score, rank, tie)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (score_id) DO UPDATE SET final_score = EXCLUDED.final_score, rank = EXCLUDED.rank
              RETURNING score_id AS "scoreId", event_id AS "eventId", final_score AS "finalScore", rank, tie, gymnast_id;`;
        const res = await pool.query(query, [
          score.scoreId,
          score.resultSetId,
          score.personId,
          score.eventId,
          safeParseFloat(score.finalScore),
          score.rank,
          Boolean(score.tie),
        ]);
        savedScores.push(res.rows[0]);
      }
      console.log(`✅ Synced ${savedScores.length} scores.`);
      return savedScores;
    },
    syncSterlingGymData: async () => {
      console.log(
        'Starting Sterling Gym data sync for 2022-2023 season onwards...'
      );
      const response = await fetch(`https://api.myusagym.com/v1/meets/past`);
      const allPastMeets = (await response.json()) as ApiMeet[];

      const seasonStartDate = new Date('2022-09-01');
      const sterlingGymClubId = 24029;

      const meetsInDateRange = allPastMeets.filter((meet) => {
        const meetDate = new Date(meet.startDate);
        return meetDate >= seasonStartDate;
      });

      console.log(
        `Found ${meetsInDateRange.length} meets since ${
          seasonStartDate.toISOString().split('T')[0]
        }. Checking for Sterling Gym participation...`
      );

      const syncedSanctions = [];
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        for (const meet of meetsInDateRange) {
          console.log(
            `Checking sanction ${meet.sanctionId} (${meet.name}) for Sterling Gym participation...`
          );
          const sanctionDetailsResponse = await fetch(
            `https://api.myusagym.com/v2/sanctions/${meet.sanctionId}`
          );
          if (!sanctionDetailsResponse.ok) {
            console.warn(
              `-- Could not fetch details for sanction ${meet.sanctionId}. Status: ${sanctionDetailsResponse.status}`
            );
            continue; // Skip to the next meet
          }
          const sanctionData =
            (await sanctionDetailsResponse.json()) as ApiSanctionData;

          const clubIds = Object.keys(sanctionData.clubs || {});
          if (clubIds.includes(String(sterlingGymClubId))) {
            console.log(
              `-- Sterling Gym participated in ${meet.name}. Syncing...`
            );
            await syncSanctionInternal(meet.sanctionId, client);
            syncedSanctions.push({ sanctionId: meet.sanctionId });
          }
        }
        await client.query('COMMIT');

        console.log(
          `Finished sync. Synced ${syncedSanctions.length} total meets where Sterling Gym participated.`
        );

        if (syncedSanctions.length === 0) {
          return [];
        }

        const syncedSanctionIds = syncedSanctions.map((s) => s.sanctionId);
        const finalRes = await client.query(
          `
                SELECT sanction_id AS "sanctionId", name, start_date AS "startDate", end_date AS "endDate", city, state, site_name AS "siteName", meet_status, program_id
                FROM sanctions WHERE sanction_id = ANY($1::int[])`,
          [syncedSanctionIds]
        );
        return finalRes.rows;
      } catch (e) {
        await client.query('ROLLBACK');
        console.error('🔥 Full Sterling sync failed:', e);
        throw e;
      } finally {
        client.release();
      }
    },
  },

  Sanction: {
    program: (sanction) => mapProgramIdToEnum(sanction.program_id),
    meetStatus: (sanction) => sanction.meet_status,
    gymnasts: async (sanction) => {
      const res = await pool.query(
        `
            SELECT
                g.gymnast_id AS "gymnastId",
                g.first_name AS "firstName",
                g.last_name AS "lastName",
                g.gender,
                sg.club_id_for_meet -- Use the historical club ID from the join table
            FROM gymnasts g
            JOIN sanction_gymnasts sg ON g.gymnast_id = sg.gymnast_id
            WHERE sg.sanction_id = $1;
        `,
        [sanction.sanctionId]
      );
      return res.rows;
    },
    sessions: async (sanction) => {
      const res = await pool.query(
        'SELECT session_id AS "sessionId", sanction_id AS "sanctionId", name, session_date AS "sessionDate", program FROM sessions WHERE sanction_id = $1',
        [sanction.sanctionId]
      );
      return res.rows;
    },
    // Add the new resolver for scores
    scores: async (sanction, { gymnastId }) => {
      let query = `
        SELECT
            sc.score_id AS "scoreId",
            sc.event_id AS "eventId",
            sc.final_score AS "finalScore",
            sc.rank,
            sc.tie,
            sc.gymnast_id,
            sess.program
        FROM scores sc
        JOIN result_sets rs ON sc.result_set_id = rs.result_set_id
        JOIN sessions sess ON rs.session_id = sess.session_id AND rs.sanction_id = sess.sanction_id
        WHERE rs.sanction_id = $1
      `;
      const params = [sanction.sanctionId];

      if (gymnastId) {
        query += ` AND sc.gymnast_id = $2`;
        params.push(gymnastId);
      }

      query += ` ORDER BY sc.gymnast_id, sc.event_id;`;
      const res = await pool.query(query, params);
      return res.rows;
    },
  },
  Gymnast: {
    level: (gymnast) => gymnast.level || 'N/A',
    club: async (gymnast) => {
      if (!gymnast.club_id) return null;
      const res = await pool.query(
        'SELECT club_id AS "clubId", name, city, state FROM clubs WHERE club_id = $1',
        [gymnast.club_id]
      );
      return res.rows[0];
    },
    historicalClub: async (gymnast) => {
      if (!gymnast.club_id_for_meet) return null;
      const res = await pool.query(
        'SELECT club_id AS "clubId", name, city, state FROM clubs WHERE club_id = $1',
        [gymnast.club_id_for_meet]
      );
      return res.rows[0];
    },
  },
  Session: {
    resultSets: async (session) => {
      const res = await pool.query(
        'SELECT result_set_id AS "resultSetId", level, division FROM result_sets WHERE session_id = $1 AND sanction_id = $2',
        [session.sessionId, session.sanctionId]
      );
      return res.rows;
    },
  },
  ResultSet: {
    scores: async (resultSet) => {
      const res = await pool.query(
        'SELECT score_id AS "scoreId", event_id AS "eventId", final_score AS "finalScore", rank, tie, gymnast_id FROM scores WHERE result_set_id = $1',
        [resultSet.resultSetId]
      );
      return res.rows;
    },
  },
  Score: {
    eventName: (score) => {
      return mapEventIdToName(score.eventId, score.program);
    },
    gymnast: async (score) => {
      const res = await pool.query(
        'SELECT gymnast_id AS "gymnastId", first_name AS "firstName", last_name AS "lastName", gender, club_id FROM gymnasts WHERE gymnast_id = $1',
        [score.gymnast_id]
      );
      return res.rows[0];
    },
    sanction: async (score) => {
      if (!score.sanction_id) return null;
      const res = await pool.query(
        'SELECT sanction_id AS "sanctionId", name, start_date AS "startDate" FROM sanctions WHERE sanction_id = $1',
        [score.sanction_id]
      );
      return res.rows[0];
    },
  },
};

// --- SERVER STARTUP ---
const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
console.log(`🚀 Server ready at: ${url}`);
