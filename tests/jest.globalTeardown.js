const { execSync } = require('child_process');

module.exports = async () => {
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  // Stop and remove the test database container after tests (local only)
  if (!isCI) {
    try {
      execSync('docker compose down', { stdio: 'inherit' });
    } catch (err) {
      console.error('Failed to stop test DB:', err.message);
    }
  }
};
