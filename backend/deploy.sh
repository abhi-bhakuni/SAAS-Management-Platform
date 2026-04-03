#!/bin/bash

# Production Deployment Script for SAAS Management Platform
# This script handles building, testing, and deploying the application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    log_success "Dependencies check passed"
}

# Build the application
build_app() {
    log_info "Building application..."

    # Build Docker image
    docker-compose -f docker-compose.prod.yml build --no-cache

    log_success "Application built successfully"
}

# Run tests
run_tests() {
    log_info "Running tests..."

    # Install dependencies for testing
    npm ci

    # Run tests
    npm run test

    log_success "Tests passed"
}

# Deploy application
deploy_app() {
    log_info "Deploying application..."

    # Stop existing containers
    docker-compose -f docker-compose.prod.yml down || true

    # Start services
    docker-compose -f docker-compose.prod.yml up -d

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30

    # Check health
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Application deployed successfully"
        log_info "Application is running at: http://localhost:3000"
        log_info "Health check: http://localhost:3000/health"
    else
        log_error "Health check failed. Please check the logs."
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."

    docker-compose -f docker-compose.prod.yml exec -T app npm run migration:run

    log_success "Database migrations completed"
}

# Main deployment process
main() {
    log_info "Starting production deployment..."

    check_dependencies

    # Ask for confirmation
    read -p "This will deploy to production. Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi

    # Run tests (optional, uncomment if needed)
    # run_tests

    build_app
    deploy_app
    run_migrations

    log_success "🎉 Deployment completed successfully!"
    log_info ""
    log_info "Useful commands:"
    log_info "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
    log_info "  Stop app: docker-compose -f docker-compose.prod.yml down"
    log_info "  Restart: docker-compose -f docker-compose.prod.yml restart"
    log_info "  Run migrations: docker-compose -f docker-compose.prod.yml exec app npm run migration:run"
}

# Handle command line arguments
case "${1:-}" in
    "build")
        check_dependencies
        build_app
        ;;
    "test")
        run_tests
        ;;
    "deploy")
        check_dependencies
        deploy_app
        ;;
    "migrate")
        run_migrations
        ;;
    "logs")
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    "stop")
        docker-compose -f docker-compose.prod.yml down
        ;;
    *)
        main
        ;;
esac