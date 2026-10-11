# Production deployment: Sandipan VPS

This deployment uses Docker Compose for the API, email worker, MySQL, and Redis. Nginx runs on the VPS host, serves the React build, proxies the API, and terminates HTTPS. PM2 is not used.

## Final architecture

```text
crm.sandipandas.website  -> Nginx -> /var/www/leadflow/client/dist
api.sandipandas.website  -> Nginx -> 127.0.0.1:4000 -> API container
API/worker containers    -> private Docker network -> MySQL + Redis
```

MySQL and Redis do not publish ports to the VPS. Only Nginx ports 80/443 and SSH should be public.

## 1. Create DNS records

In the DNS provider for `sandipandas.website`, create two records:

```text
Type  Name  Value
A     crm   YOUR_VPS_PUBLIC_IP
A     api   YOUR_VPS_PUBLIC_IP
```

Wait until both commands return the VPS IP:

```bash
dig +short crm.sandipandas.website
dig +short api.sandipandas.website
```

## 2. Connect and install host software

These commands assume Ubuntu and a non-root sudo user:

```bash
ssh YOUR_USER@YOUR_VPS_PUBLIC_IP
sudo apt update
sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 nginx snapd git ufw
sudo systemctl enable --now docker nginx
sudo usermod -aG docker "$USER"
```

Log out and reconnect so Docker group membership takes effect:

```bash
exit
ssh YOUR_USER@YOUR_VPS_PUBLIC_IP
docker version
docker compose version
```

## 3. Configure the firewall

Open SSH before enabling the firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Do not open ports `3306`, `6379`, or `4000`.

## 4. Upload the project

Use Git or SCP. The final directory in this guide is:

```text
/var/www/leadflow
```

Example with Git:

```bash
sudo mkdir -p /var/www/leadflow
sudo chown -R "$USER":"$USER" /var/www/leadflow
git clone YOUR_REPOSITORY_URL /var/www/leadflow
cd /var/www/leadflow
```

## 5. Create production secrets

Create the real backend environment file:

```bash
cd /var/www/leadflow/server/v1
cp .env.production.example .env.production
chmod 600 .env.production
```

Generate separate secrets:

```bash
openssl rand -hex 32
openssl rand -hex 32
openssl rand -hex 32
openssl rand -hex 64
openssl rand -base64 24
```

Use the results for:

```text
DB_PASSWORD
DB_ROOT_PASSWORD
REDIS_PASSWORD
JWT_SECRET
ADMIN_PASSWORD
```

Edit the file:

```bash
nano .env.production
```

Also replace the SMTP placeholders with real provider credentials. The production domain values are already set:

```env
CORS_ORIGIN=https://crm.sandipandas.website
APP_URL=https://crm.sandipandas.website
TRUST_PROXY=true
```

Never commit or copy `.env.production` to another person. The Docker build explicitly excludes every `.env*` file.

## 6. Validate the Docker configuration

Every production Compose command must include the same file and environment file:

```bash
cd /var/www/leadflow/server/v1
docker compose --env-file .env.production -f compose.production.yaml config --quiet
```

If this produces no error, build the backend image:

```bash
docker compose --env-file .env.production -f compose.production.yaml build
```

## 7. Start MySQL and Redis

```bash
docker compose --env-file .env.production -f compose.production.yaml up -d mysql redis
docker compose --env-file .env.production -f compose.production.yaml ps
```

Wait until both services show `healthy`.

## 8. Run migrations and the one-time seed

```bash
docker compose --env-file .env.production -f compose.production.yaml --profile tools run --rm migrate
docker compose --env-file .env.production -f compose.production.yaml --profile tools run --rm seed
```

The seed creates the first administrator. Run it once; later executions safely skip an existing admin email. Afterward, remove `ADMIN_PASSWORD` from `.env.production` or replace it with a new unused random value.

## 9. Start API and email worker

```bash
docker compose --env-file .env.production -f compose.production.yaml up -d api worker
docker compose --env-file .env.production -f compose.production.yaml ps
curl http://127.0.0.1:4000/api/v1/health
```

Expected health response:

```json
{"data":{"status":"ok"}}
```

Inspect logs if a service is unhealthy:

```bash
docker compose --env-file .env.production -f compose.production.yaml logs --tail=100 api
docker compose --env-file .env.production -f compose.production.yaml logs --tail=100 worker
```

## 10. Build the React frontend

The production API address is already stored in `client/.env.production`.

Build without installing Node.js on the VPS:

```bash
cd /var/www/leadflow
docker run --rm \
  -v "$PWD/client:/app" \
  -w /app \
  node:20-alpine \
  sh -c "npm ci && npm run build"

sudo chown -R www-data:www-data /var/www/leadflow/client/dist
sudo find /var/www/leadflow/client/dist -type d -exec chmod 755 {} \;
sudo find /var/www/leadflow/client/dist -type f -exec chmod 644 {} \;
```

Values beginning with `VITE_` are public browser configuration. Never place passwords or private keys in the client environment.

## 11. Install Nginx site configurations

```bash
sudo cp /var/www/leadflow/deploy/nginx/crm.sandipandas.website.conf /etc/nginx/sites-available/
sudo cp /var/www/leadflow/deploy/nginx/api.sandipandas.website.conf /etc/nginx/sites-available/

sudo ln -s /etc/nginx/sites-available/crm.sandipandas.website.conf /etc/nginx/sites-enabled/crm.sandipandas.website.conf
sudo ln -s /etc/nginx/sites-available/api.sandipandas.website.conf /etc/nginx/sites-enabled/api.sandipandas.website.conf
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx
```

Test HTTP before requesting certificates:

```bash
curl -I http://crm.sandipandas.website
curl http://api.sandipandas.website/api/v1/health
```

## 12. Enable HTTPS with Certbot

Install Certbot using its recommended snap package:

```bash
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --nginx -d crm.sandipandas.website -d api.sandipandas.website
```

Choose HTTPS redirection when prompted, then test renewal:

```bash
sudo certbot renew --dry-run
```

Final checks:

```bash
curl https://api.sandipandas.website/api/v1/health
curl -I https://crm.sandipandas.website
```

Open `https://crm.sandipandas.website/login` and sign in with the seeded administrator.

## Updating the application

```bash
cd /var/www/leadflow
git pull

cd server/v1
docker compose --env-file .env.production -f compose.production.yaml build api worker migrate
docker compose --env-file .env.production -f compose.production.yaml --profile tools run --rm migrate
docker compose --env-file .env.production -f compose.production.yaml up -d api worker

cd /var/www/leadflow
docker run --rm -v "$PWD/client:/app" -w /app node:20-alpine sh -c "npm ci && npm run build"
sudo chown -R www-data:www-data client/dist
sudo systemctl reload nginx
```

## Backups

Create a database backup before deployments that include migrations:

```bash
cd /var/www/leadflow/server/v1
set -a
. ./.env.production
set +a
docker compose --env-file .env.production -f compose.production.yaml exec -T mysql \
  mysqldump -uroot -p"$DB_ROOT_PASSWORD" "$DB_NAME" > "backup-$(date +%F-%H%M).sql"
```

Store backups outside the VPS as well. Redis contains cache, rate-limit counters, and queued jobs; MySQL is the authoritative business database.

## Useful commands

```bash
# Status
docker compose --env-file .env.production -f compose.production.yaml ps

# Follow logs
docker compose --env-file .env.production -f compose.production.yaml logs -f api worker

# Restart only API and worker
docker compose --env-file .env.production -f compose.production.yaml restart api worker

# Stop application
docker compose --env-file .env.production -f compose.production.yaml down
```

Do not run `down -v` in production: `-v` deletes the MySQL and Redis volumes.
