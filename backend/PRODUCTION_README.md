# SAAS Management Platform - Production Deployment

This guide covers production deployment of the SAAS Management Platform using Docker and Docker Compose.

## Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)
- At least 2GB RAM available
- At least 5GB free disk space

## Quick Start

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd backend
   cp .env.production .env
   # Edit .env with your production values
   ```

2. **Deploy:**
   ```bash
   ./deploy.sh
   ```

## Environment Configuration

Copy `.env.production` to `.env` and configure:

```bash
# Required environment variables
NODE_ENV=production
DATABASE_PASSWORD=your_secure_db_password
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
STRIPE_SECRET_KEY=sk_live_your_stripe_live_secret_key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

## Deployment Commands

```bash
# Full deployment
./deploy.sh

# Build only
./deploy.sh build

# Deploy only (after build)
./deploy.sh deploy

# Run database migrations
./deploy.sh migrate

# View logs
./deploy.sh logs

# Stop application
./deploy.sh stop
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   App           │
│   (Port 80/443) │────│   (Port 3000)   │
└─────────────────┘    └─────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
            ┌─────────────┐ ┌─────┐ ┌─────────────┐
            │ PostgreSQL  │ │Redis│ │   Email    │
            │ (Port 5432) │ │6379 │ │   SMTP     │
            └─────────────┘ └─────┘ └─────────────┘
```

## Health Checks

- **Application Health**: `http://your-domain/health`
- **Readiness Probe**: `http://your-domain/health/readiness`
- **Liveness Probe**: `http://your-domain/health/liveness`

## Monitoring

### Application Logs
```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f app

# View all logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Database Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Redis Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f redis
```

## Database Management

### Backup
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres saas_management_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres saas_management_db < backup_file.sql
```

### Run Migrations
```bash
docker-compose -f docker-compose.prod.yml exec app npm run migration:run
```

## Scaling

### Horizontal Scaling
```yaml
# In docker-compose.prod.yml, add replicas
services:
  app:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
```

### Database Scaling
- Use PostgreSQL connection pooling
- Consider read replicas for high traffic
- Implement database sharding if needed

## Security

### Environment Variables
- Never commit `.env` files
- Use strong, unique passwords
- Rotate secrets regularly

### Network Security
- Use HTTPS in production
- Configure firewall rules
- Use VPN for database access

### Container Security
- Keep images updated
- Run containers as non-root user
- Use minimal base images
- Scan for vulnerabilities

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using port
   lsof -i :3000
   # Kill process or change port in docker-compose.yml
   ```

2. **Database connection failed**
   ```bash
   # Check database logs
   docker-compose -f docker-compose.prod.yml logs postgres
   # Verify environment variables
   ```

3. **Application won't start**
   ```bash
   # Check application logs
   docker-compose -f docker-compose.prod.yml logs app
   # Verify all required environment variables are set
   ```

### Health Check Commands

```bash
# Check if services are running
docker-compose -f docker-compose.prod.yml ps

# Check service health
curl http://localhost:3000/health

# Check database connectivity
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres
```

## Performance Tuning

### Application
- Adjust `REQUEST_TIMEOUT` based on your needs
- Configure appropriate memory limits
- Use connection pooling for database

### Database
- Monitor slow queries
- Configure PostgreSQL for your workload
- Use appropriate indexes

### Caching
- Redis is configured for session storage
- Consider adding Redis for API response caching

## Backup Strategy

1. **Database Backups**
   - Daily automated backups
   - Store backups in cloud storage
   - Test restore procedures regularly

2. **Application Backups**
   - Backup configuration files
   - Backup SSL certificates
   - Document infrastructure setup

## Monitoring & Alerting

Consider implementing:
- Application Performance Monitoring (APM)
- Error tracking (Sentry, Bugsnag)
- Infrastructure monitoring (Prometheus, Grafana)
- Log aggregation (ELK stack)

## Support

For issues or questions:
1. Check the logs: `./deploy.sh logs`
2. Verify configuration in `.env`
3. Check health endpoints
4. Review this documentation

## Version History

- v1.0.0: Initial production deployment setup
- Comprehensive logging and error handling
- Docker containerization
- Health checks and monitoring endpoints