# Alcohol License Training Application - Docker Setup

This document provides instructions for running the Alcohol License Training Application using Docker.

## Prerequisites

- Docker Engine (v20.10 or later)
- Docker Compose (v2.0 or later)

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository and navigate to the project directory:**
   ```bash
   git clone <repository-url>
   cd testing-training-gov-site
   ```

2. **Create necessary directories:**
   ```bash
   mkdir -p database logs
   ```

3. **Start the application:**
   ```bash
   docker compose up -d
   ```

4. **Access the application:**
   - Main application: http://localhost:3000
   - Admin panel: http://localhost:3000/admin/login

### Using Docker only

1. **Build the Docker image:**
   ```bash
   docker build -t alcohol-license-app .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name alcohol-license-training \
     -p 3000:3000 \
     -v $(pwd)/database:/app/database \
     -v $(pwd)/logs:/app/logs \
     -e NODE_ENV=production \
     -e SESSION_SECRET=your-super-secret-session-key \
     alcohol-license-app
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node.js environment | `production` |
| `PORT` | Application port | `3000` |
| `SESSION_SECRET` | Secret key for sessions | (required in production) |
| `DB_PATH` | Database file path | `/app/database/alcohol_license.db` |

## Login Credentials

### Regular User
- Email: `user@example.com`
- Password: `password123`

### Admin User
- Email: `admin@example.com`
- Password: `admin123`

## Data Persistence

The Docker setup includes volume mounts for:
- **Database**: `./database` - SQLite database files
- **Logs**: `./logs` - Application log files

## Health Checks

The container includes health checks that verify the application is running:
- Health check endpoint: `http://localhost:3000/api/health`
- Check interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3

## Management Commands

### View logs
```bash
docker compose logs -f alcohol-license-app
```

### Stop the application
```bash
docker compose down
```

### Restart the application
```bash
docker compose restart
```

### Update the application
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Access container shell
```bash
docker compose exec alcohol-license-app sh
```

### Backup database
```bash
docker compose exec alcohol-license-app cp /app/database/alcohol_license.db /app/database/backup_$(date +%Y%m%d_%H%M%S).db
```

## Production Considerations

For production deployment, consider:

1. **Use environment variables file:**
   ```bash
   # Create .env file
   NODE_ENV=production
   SESSION_SECRET=your-very-secure-session-secret-key
   DB_PATH=/app/database/alcohol_license.db
   ```

2. **Enable HTTPS with reverse proxy:**
   - Uncomment the nginx service in docker-compose.yml
   - Add SSL certificates
   - Configure nginx.conf for your domain

3. **Database backups:**
   - Set up automated database backups
   - Consider using external database for scalability

4. **Monitoring:**
   - Add monitoring tools (Prometheus, Grafana)
   - Set up log aggregation

5. **Security:**
   - Change default passwords
   - Use strong session secrets
   - Enable firewall rules
   - Regular security updates

## Troubleshooting

### Container won't start
```bash
# Check logs
docker compose logs alcohol-license-app

# Check container status
docker compose ps
```

### Database issues
```bash
# Check database file permissions
ls -la database/

# Reset database (WARNING: This will delete all data)
rm database/alcohol_license.db
docker compose restart
```

### Port already in use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>
```

### Performance issues
```bash
# Check container resources
docker stats alcohol-license-training

# Check disk space
df -h
```

## Development

For development with Docker:

```bash
# Use development docker-compose
docker compose -f docker-compose.dev.yml up

# Or override environment
docker compose up -e NODE_ENV=development
```

## Support

For issues and questions:
- Check the application logs
- Verify environment variables
- Ensure proper file permissions
- Check Docker and system resources
