const { neon } = require('@neondatabase/serverless');
if (!process.env.DATABASE_URL) {
  exports.sql = () => { throw new Error('DATABASE_URL is not configured'); };
} else {
  exports.sql = neon(process.env.DATABASE_URL);
}
