#!/bin/bash
# EC2 Deployment Script for LLA Backend
# Run this script on your EC2 instance (Ubuntu)

echo "Starting EC2 setup for LLA Backend..."

# 1. Update packages and install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nginx certbot python3-certbot-nginx

# 2. Setup Python Virtual Environment
cd /home/ubuntu/LLA/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Setup systemd service for Gunicorn
echo "Setting up systemd service..."
sudo cp lla-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start lla-backend
sudo systemctl enable lla-backend

# 4. Setup Nginx as a reverse proxy
echo "Configuring Nginx..."
sudo rm /etc/nginx/sites-enabled/default
cat <<EOF | sudo tee /etc/nginx/sites-available/lla-backend
server {
    listen 80;
    server_name your_domain_or_ip; # REPLACE THIS LATER

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_addrs;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
sudo ln -s /etc/nginx/sites-available/lla-backend /etc/nginx/sites-enabled/
sudo systemctl restart nginx

echo "Backend setup complete! Don't forget to:"
echo "1. Put your real API keys in /home/ubuntu/LLA/backend/.env"
echo "2. Update 'your_domain_or_ip' in /etc/nginx/sites-available/lla-backend"
echo "3. Run 'sudo certbot --nginx -d your_domain' to enable HTTPS/TLS"
