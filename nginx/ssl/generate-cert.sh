#!/bin/bash

# Generate a self-signed SSL certificate for development
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout jason.key -out jason.crt \
  -subj "/C=US/ST=State/L=City/O=JASON/CN=localhost"

# Create .htpasswd file for basic auth
# Default credentials: admin:jason_monitoring
echo "admin:\$apr1\$rqQwBHdZ\$Irtlk1/Ey0KFTqKHSjZ4j1" > ../.htpasswd

echo "Self-signed certificate generated successfully."
echo "Note: For production, replace with a valid certificate from a trusted CA."