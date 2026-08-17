#!/bin/bash
# ============================================================
# Signologos — SSL Setup Script (Let's Encrypt via Certbot)
# ============================================================
#
# Run this script ONCE on the production server to obtain
# SSL certificates before starting the full stack.
#
# Requirements:
#   - Ubuntu/Debian server with Docker installed
#   - Domain DNS pointing to this server's IP
#   - Ports 80 and 443 open
#
# Usage:
#   chmod +x infra/scripts/setup-ssl.sh
#   sudo ./infra/scripts/setup-ssl.sh --domain signologos.com --email tu@email.com

set -euo pipefail

# ── Parse arguments ────────────────────────────────────────
DOMAIN=""
EMAIL=""
STAGING=false  # Set to true to use Let's Encrypt staging (no rate limits)

usage() {
    echo "Usage: $0 --domain <domain> --email <email> [--staging]"
    echo "  --domain   Your domain (e.g. signologos.com)"
    echo "  --email    Email for Let's Encrypt notifications"
    echo "  --staging  Use Let's Encrypt staging environment (for testing)"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)  DOMAIN="$2";  shift 2 ;;
        --email)   EMAIL="$2";   shift 2 ;;
        --staging) STAGING=true; shift   ;;
        *)         usage ;;
    esac
done

[[ -z "$DOMAIN" || -z "$EMAIL" ]] && usage

echo "============================================================"
echo "  Signologos SSL Setup"
echo "  Domain:  $DOMAIN"
echo "  Email:   $EMAIL"
echo "  Staging: $STAGING"
echo "============================================================"

# ── Create required directories ────────────────────────────
SSL_DIR="$(dirname "$0")/../nginx/ssl"
WEBROOT_DIR="/var/www/certbot"

mkdir -p "$SSL_DIR"
mkdir -p "$WEBROOT_DIR"

echo "[1/4] Created SSL directories"

# ── Create a temporary Nginx config for ACME challenge ──────
# This allows Certbot to verify domain ownership via HTTP
TEMP_NGINX_CONF="/tmp/signologos-acme.conf"
cat > "$TEMP_NGINX_CONF" << 'EOF'
server {
    listen 80;
    server_name _;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 "Signologos ACME setup in progress...";
        add_header Content-Type text/plain;
    }
}
EOF

echo "[2/4] Starting temporary HTTP server for ACME challenge..."

# Check if nginx is already running
if docker ps --format '{{.Names}}' | grep -q signologos_nginx; then
    echo "  (Nginx already running, skipping temporary server)"
else
    docker run -d --rm \
        --name signologos-acme-nginx \
        -p 80:80 \
        -v "$WEBROOT_DIR:/var/www/certbot" \
        -v "$TEMP_NGINX_CONF:/etc/nginx/conf.d/default.conf:ro" \
        nginx:1.25-alpine
    echo "  Temporary Nginx started"
fi

# ── Obtain certificate ─────────────────────────────────────
STAGING_FLAG=""
if [[ "$STAGING" == "true" ]]; then
    STAGING_FLAG="--staging"
    echo "[3/4] Obtaining STAGING certificate (for testing)..."
else
    echo "[3/4] Obtaining production certificate..."
fi

docker run --rm \
    -v "$(realpath "$SSL_DIR"):/etc/letsencrypt" \
    -v "$WEBROOT_DIR:/var/www/certbot" \
    certbot/certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    $STAGING_FLAG

echo "  Certificate obtained!"

# ── Stop temporary nginx ───────────────────────────────────
if docker ps --format '{{.Names}}' | grep -q signologos-acme-nginx; then
    docker stop signologos-acme-nginx
    echo "  Temporary Nginx stopped"
fi

# ── Set up auto-renewal cron ───────────────────────────────
echo "[4/4] Setting up auto-renewal cron job..."

CRON_JOB="0 3 * * * docker run --rm -v $(realpath "$SSL_DIR"):/etc/letsencrypt -v $WEBROOT_DIR:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot --quiet && docker exec signologos_nginx nginx -s reload"

(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -

echo ""
echo "============================================================"
echo "  ✅ SSL Setup Complete!"
echo ""
echo "  Certificate: $SSL_DIR/live/$DOMAIN/fullchain.pem"
echo "  Private key: $SSL_DIR/live/$DOMAIN/privkey.pem"
echo ""
echo "  Next steps:"
echo "  1. Update infra/nginx/nginx.conf with your domain"
echo "  2. Update .env with your secrets"
echo "  3. Run: docker compose -f infra/docker-compose.prod.yml up -d"
echo ""
if [[ "$STAGING" == "true" ]]; then
    echo "  ⚠️  You used --staging. Run WITHOUT --staging for production certs."
fi
echo "============================================================"
