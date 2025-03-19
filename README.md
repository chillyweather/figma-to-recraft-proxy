# Recraft API Proxy Server

This is a simple proxy server that forwards requests to the Recraft API. It's designed to be used with the Figma plugin that needs to make requests to the Recraft API.

## Setup on Digital Ocean

### 1. Connect to your Digital Ocean droplet via SSH
```
ssh user@your-droplet-ip
```

### 2. Install Node.js and npm (if not already installed)
```
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Clone or upload this code to your server
```
# Create a directory for the server
mkdir -p /var/www/recraft-proxy
cd /var/www/recraft-proxy

# Clone the repo or copy files to this directory
# If uploading manually, use SCP or SFTP to transfer the files
```

### 4. Install dependencies
```
npm install
```

### 5. Create a .env file
```
cp .env.example .env
nano .env
```

Then edit the file to include your actual Recraft API key.

### 6. Test the server
```
node server.js
```

### 7. Set up PM2 for production management
```
# Install PM2 globally
sudo npm install -g pm2

# Start the server with PM2
pm2 start server.js --name recraft-proxy

# Ensure PM2 starts on system reboot
pm2 startup
pm2 save
```

### 8. Configure a reverse proxy with Nginx (optional but recommended)
```
# Install Nginx
sudo apt-get install nginx

# Create a new Nginx configuration file
sudo nano /etc/nginx/sites-available/recraft-proxy
```

Add the following configuration:
```
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration and restart Nginx:
```
sudo ln -s /etc/nginx/sites-available/recraft-proxy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Set up SSL with Let's Encrypt (recommended)
```
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## API Endpoints

- `GET /health` - Health check to ensure the server is running
- `POST /recraft/generate` - Proxy endpoint for the Recraft API's image generation
  - Body parameters match the Recraft API: `prompt`, `style`, `model`

## Usage in Figma Plugin

When you've set up the proxy server, update your Figma plugin's `package.json` to include your proxy server's domain in the allowed domains, then update the API call in your code to use your proxy server endpoint.