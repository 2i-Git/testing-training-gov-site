const { execSync } = require('child_process');

module.exports = async () => {
  // Stop and remove the test database container after tests
  try {
    execSync('docker compose down', { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to stop test DB:', err.message);
  }
};
