# Production Deployment Checklist

## Environment Setup

- [ ] Set NODE_ENV=production
- [ ] Configure SESSION_SECRET with strong random value
- [ ] Set up HTTPS/TLS certificates
- [ ] Configure CORS_ORIGIN for production domain
- [ ] Set up database backups
- [ ] Configure log rotation

## Security Hardening

- [ ] Enable HTTPS (set session.cookie.secure=true)
- [ ] Configure firewall rules
- [ ] Set up DDoS protection
- [ ] Enable security monitoring
- [ ] Regular security updates
- [ ] Vulnerability scanning

## Performance Optimization

- [ ] Database optimization and indexing
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure caching headers
- [ ] Database connection pooling
- [ ] Health checks and monitoring

## Monitoring & Logging

- [ ] Set up application monitoring (PM2, New Relic, etc.)
- [ ] Configure log aggregation (ELK stack, Splunk, etc.)
- [ ] Set up alerting for errors and performance issues
- [ ] Database monitoring
- [ ] Uptime monitoring

## Backup & Recovery

- [ ] Automated database backups
- [ ] Backup testing and restoration procedures
- [ ] Disaster recovery plan
- [ ] Data retention policies

## Compliance & Legal

- [ ] GDPR compliance review
- [ ] Data protection impact assessment
- [ ] Terms of service and privacy policy
- [ ] Accessibility testing (WCAG 2.1)
- [ ] Security audit
