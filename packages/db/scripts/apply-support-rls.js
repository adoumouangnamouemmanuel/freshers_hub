require("dotenv").config({ path: "../../.env" });
const { Client } = require("pg");

async function applyRLS() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    console.log("Applying RLS to sessions table...");

    await client.query(`
      ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS unit_head_access ON sessions;
      CREATE POLICY unit_head_access ON sessions
          FOR SELECT
          USING (
              unit_id IN (
                  SELECT ur.unit_id FROM user_roles ur
                  JOIN roles r ON r.id = ur.role_id
                  WHERE ur.user_id = current_setting('app.current_user_id', true)::uuid
                    AND r.name IN ('coach_admin', 'counselling_head', 'advisor', 'odip_head')
              )
          );

      DROP POLICY IF EXISTS own_session_access ON sessions;
      CREATE POLICY own_session_access ON sessions
          FOR SELECT
          USING (
              student_id = current_setting('app.current_user_id', true)::uuid
              OR provider_id = current_setting('app.current_user_id', true)::uuid
          );
    `);

    console.log("Applying RLS to session_reports table...");

    await client.query(`
      ALTER TABLE session_reports ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS unit_head_report_access ON session_reports;
      CREATE POLICY unit_head_report_access ON session_reports
          FOR SELECT
          USING (
              EXISTS (
                  SELECT 1 FROM sessions s
                  WHERE s.id = session_reports.session_id
                    AND s.unit_id IN (
                        SELECT ur.unit_id FROM user_roles ur
                        JOIN roles r ON r.id = ur.role_id
                        WHERE ur.user_id = current_setting('app.current_user_id', true)::uuid
                          AND r.name IN ('coach_admin', 'counselling_head', 'advisor', 'odip_head')
                    )
              )
          );

      DROP POLICY IF EXISTS provider_report_access ON session_reports;
      CREATE POLICY provider_report_access ON session_reports
          FOR SELECT
          USING (
              provider_id = current_setting('app.current_user_id', true)::uuid
          );
    `);
    
    console.log("RLS policies applied successfully!");
  } catch (error) {
    console.error("Error applying RLS:", error);
  } finally {
    await client.end();
  }
}

applyRLS();
