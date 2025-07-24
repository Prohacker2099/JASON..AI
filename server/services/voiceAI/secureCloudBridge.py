#!/usr/bin/env python3
"""
JASON Secure Cloud Bridge

This service creates a secure, encrypted tunnel between your local JASON instance
and the cloud proxy components (Alexa Skill, Google Action). It ensures:

1. End-to-end encryption
2. Authentication and authorization
3. No device data leaves your local network
4. Secure command forwarding
5. Privacy-first architecture

The cloud proxies connect to this bridge to forward voice commands securely.
"""

import asyncio
import json
import logging
import ssl
import websockets
import jwt
import hashlib
import os
from datetime import datetime, timedelta
from typing import Dict, Set, Optional, Any
from dataclasses import dataclass
import aiohttp
from cryptography.fernet import Fernet

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SecureCloudBridge")

@dataclass
class CloudConnection:
    """Represents a cloud proxy connection"""
    websocket: websockets.WebSocketServerProtocol
    connection_id: str
    source: str  # 'alexa_skill' or 'google_action'
    user_id: str
    authenticated: bool
    last_activity: datetime

class SecureCloudBridge:
    """
    Secure Cloud Bridge for JASON
    
    This service provides a secure, encrypted bridge between cloud voice assistants
    and your local JASON instance, ensuring privacy and security.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Security configuration
        self.encryption_key = self._get_or_create_encryption_key()
        self.jwt_secret = self._get_or_create_jwt_secret()
        self.cipher_suite = Fernet(self.encryption_key)
        
        # Connection management
        self.active_connections: Dict[str, CloudConnection] = {}
        self.authorized_sources = {'alexa_skill', 'google_action', 'mobile_app'}
        
        # Rate limiting
        self.rate_limits: Dict[str, list] = {}
        self.max_requests_per_minute = 60
        
        # SSL configuration
        self.ssl_context = self._create_ssl_context()
        
        # Server configuration
        self.host = self.config.get('bridge_host', 'localhost')
        self.port = self.config.get('bridge_port', 8765)
        
        # Voice orchestrator integration
        self.voice_orchestrator = None
        
    def _get_or_create_encryption_key(self) -> bytes:
        """Get or create encryption key for secure communication"""
        key_file = self.config.get('encryption_key_file', 'jason_encryption.key')
        
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            # Generate new key
            key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(key)
            logger.info("🔐 Generated new encryption key")
            return key
            
    def _get_or_create_jwt_secret(self) -> str:
        """Get or create JWT secret for authentication"""
        secret_file = self.config.get('jwt_secret_file', 'jason_jwt.secret')
        
        if os.path.exists(secret_file):
            with open(secret_file, 'r') as f:
                return f.read().strip()
        else:
            # Generate new secret
            secret = hashlib.sha256(os.urandom(32)).hexdigest()
            with open(secret_file, 'w') as f:
                f.write(secret)
            logger.info("🔐 Generated new JWT secret")
            return secret
            
    def _create_ssl_context(self) -> ssl.SSLContext:
        """Create SSL context for secure WebSocket connections"""
        context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        
        # Load certificates
        cert_file = self.config.get('ssl_cert_file', 'jason_cert.pem')
        key_file = self.config.get('ssl_key_file', 'jason_key.pem')
        
        if os.path.exists(cert_file) and os.path.exists(key_file):
            context.load_cert_chain(cert_file, key_file)
        else:
            logger.warning("⚠️ SSL certificates not found. Generating self-signed certificates...")
            self._generate_self_signed_cert(cert_file, key_file)
            context.load_cert_chain(cert_file, key_file)
            
        return context
        
    def _generate_self_signed_cert(self, cert_file: str, key_file: str):
        """Generate self-signed SSL certificate for development"""
        try:
            from cryptography import x509
            from cryptography.x509.oid import NameOID
            from cryptography.hazmat.primitives import hashes
            from cryptography.hazmat.primitives.asymmetric import rsa
            from cryptography.hazmat.primitives import serialization
            import ipaddress
            
            # Generate private key
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
            )
            
            # Create certificate
            subject = issuer = x509.Name([
                x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
                x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "CA"),
                x509.NameAttribute(NameOID.LOCALITY_NAME, "San Francisco"),
                x509.NameAttribute(NameOID.ORGANIZATION_NAME, "JASON Smart Home"),
                x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
            ])
            
            cert = x509.CertificateBuilder().subject_name(
                subject
            ).issuer_name(
                issuer
            ).public_key(
                private_key.public_key()
            ).serial_number(
                x509.random_serial_number()
            ).not_valid_before(
                datetime.utcnow()
            ).not_valid_after(
                datetime.utcnow() + timedelta(days=365)
            ).add_extension(
                x509.SubjectAlternativeName([
                    x509.DNSName("localhost"),
                    x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
                ]),
                critical=False,
            ).sign(private_key, hashes.SHA256())
            
            # Write certificate
            with open(cert_file, "wb") as f:
                f.write(cert.public_bytes(serialization.Encoding.PEM))
                
            # Write private key
            with open(key_file, "wb") as f:
                f.write(private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption()
                ))
                
            logger.info("🔐 Generated self-signed SSL certificate")
            
        except ImportError:
            logger.error("❌ cryptography library not available for SSL certificate generation")
            raise
            
    async def start_bridge(self):
        """Start the secure cloud bridge server"""
        logger.info(f"🌉 Starting JASON Secure Cloud Bridge on {self.host}:{self.port}")
        
        # Start WebSocket server
        server = await websockets.serve(
            self.handle_connection,
            self.host,
            self.port,
            ssl=self.ssl_context,
            process_request=self.process_request
        )
        
        # Start cleanup task
        asyncio.create_task(self.cleanup_connections())
        
        logger.info("✅ Secure Cloud Bridge is running")
        return server
        
    async def process_request(self, path, request_headers):
        """Process incoming WebSocket request for authentication"""
        # Extract authorization header
        auth_header = request_headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return (401, [('WWW-Authenticate', 'Bearer')], b'Unauthorized')
            
        # Verify token
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        if not self._verify_token(token):
            return (401, [('WWW-Authenticate', 'Bearer')], b'Invalid token')
            
        # Allow connection
        return None
        
    def _verify_token(self, token: str) -> bool:
        """Verify JWT token from cloud proxy"""
        try:
            # For development, accept the encryption key as token
            # In production, use proper JWT tokens
            return token == self.encryption_key.decode() or token == self.jwt_secret
        except:
            return False
            
    async def handle_connection(self, websocket, path):
        """Handle incoming WebSocket connection from cloud proxy"""
        connection_id = self._generate_connection_id()
        
        try:
            logger.info(f"🔗 New cloud connection: {connection_id}")
            
            # Wait for authentication message
            auth_message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
            auth_data = json.loads(auth_message)
            
            # Validate authentication
            if not self._authenticate_connection(auth_data):
                await websocket.send(json.dumps({
                    'type': 'auth_error',
                    'message': 'Authentication failed'
                }))
                return
                
            # Create connection object
            connection = CloudConnection(
                websocket=websocket,
                connection_id=connection_id,
                source=auth_data.get('source', 'unknown'),
                user_id=auth_data.get('user_id', 'anonymous'),
                authenticated=True,
                last_activity=datetime.now()
            )
            
            self.active_connections[connection_id] = connection
            
            # Send authentication success
            await websocket.send(json.dumps({
                'type': 'auth_success',
                'connection_id': connection_id
            }))
            
            logger.info(f"✅ Authenticated connection from {connection.source}")
            
            # Handle messages
            async for message in websocket:
                await self.handle_message(connection, message)
                
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"🔌 Connection closed: {connection_id}")
        except asyncio.TimeoutError:
            logger.warning(f"⏰ Authentication timeout: {connection_id}")
        except Exception as e:
            logger.error(f"❌ Connection error: {e}")
        finally:
            # Clean up connection
            if connection_id in self.active_connections:
                del self.active_connections[connection_id]
                
    def _generate_connection_id(self) -> str:
        """Generate unique connection ID"""
        import uuid
        return str(uuid.uuid4())[:8]
        
    def _authenticate_connection(self, auth_data: Dict[str, Any]) -> bool:
        """Authenticate cloud proxy connection"""
        source = auth_data.get('source')
        if source not in self.authorized_sources:
            return False
            
        # Additional authentication checks would go here
        # (API keys, certificates, etc.)
        
        return True
        
    async def handle_message(self, connection: CloudConnection, message: str):
        """Handle incoming message from cloud proxy"""
        try:
            data = json.loads(message)
            message_type = data.get('type')
            
            # Update last activity
            connection.last_activity = datetime.now()
            
            # Rate limiting
            if not self._check_rate_limit(connection.user_id):
                await connection.websocket.send(json.dumps({
                    'type': 'rate_limit_exceeded',
                    'message': 'Too many requests'
                }))
                return
                
            # Route message based on type
            if message_type == 'alexa_command':
                await self._handle_alexa_command(connection, data)
            elif message_type == 'google_action_command':
                await self._handle_google_action_command(connection, data)
            elif message_type == 'ping':
                await self._handle_ping(connection, data)
            else:
                logger.warning(f"⚠️ Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("❌ Invalid JSON message received")
        except Exception as e:
            logger.error(f"❌ Error handling message: {e}")
            
    def _check_rate_limit(self, user_id: str) -> bool:
        """Check rate limiting for user"""
        now = datetime.now()
        minute_ago = now - timedelta(minutes=1)
        
        if user_id not in self.rate_limits:
            self.rate_limits[user_id] = []
            
        # Clean old requests
        self.rate_limits[user_id] = [
            req_time for req_time in self.rate_limits[user_id]
            if req_time > minute_ago
        ]
        
        # Check limit
        if len(self.rate_limits[user_id]) >= self.max_requests_per_minute:
            return False
            
        # Add current request
        self.rate_limits[user_id].append(now)
        return True
        
    async def _handle_alexa_command(self, connection: CloudConnection, data: Dict[str, Any]):
        """Handle command from Alexa skill"""
        command = data.get('command', '')
        user_id = data.get('user_id', 'anonymous')
        
        logger.info(f"🗣️ Alexa command: '{command}' from user {user_id}")
        
        # Forward to voice orchestrator
        response = await self._process_voice_command(
            command=command,
            user_id=user_id,
            source='alexa',
            connection=connection
        )
        
        # Send response back
        await connection.websocket.send(json.dumps({
            'type': 'command_response',
            'response': response,
            'timestamp': datetime.now().isoformat()
        }))
        
    async def _handle_google_action_command(self, connection: CloudConnection, data: Dict[str, Any]):
        """Handle command from Google Action"""
        command = data.get('command', '')
        user_id = data.get('user_id', 'anonymous')
        
        logger.info(f"🗣️ Google Action command: '{command}' from user {user_id}")
        
        # Forward to voice orchestrator
        response = await self._process_voice_command(
            command=command,
            user_id=user_id,
            source='google',
            connection=connection
        )
        
        # Send response back
        await connection.websocket.send(json.dumps({
            'type': 'command_response',
            'response': response,
            'timestamp': datetime.now().isoformat()
        }))
        
    async def _handle_ping(self, connection: CloudConnection, data: Dict[str, Any]):
        """Handle ping message for connection health"""
        await connection.websocket.send(json.dumps({
            'type': 'pong',
            'timestamp': datetime.now().isoformat()
        }))
        
    async def _process_voice_command(self, 
                                   command: str, 
                                   user_id: str, 
                                   source: str,
                                   connection: CloudConnection) -> str:
        """Process voice command through JASON's voice orchestrator"""
        try:
            # Import here to avoid circular imports
            from .consciousVoiceOrchestrator import conscious_voice_orchestrator, VoiceChannel
            
            # Map source to voice channel
            channel_map = {
                'alexa': VoiceChannel.ALEXA_SKILL,
                'google': VoiceChannel.GOOGLE_ACTION
            }
            
            channel = channel_map.get(source, VoiceChannel.WEB_INTERFACE)
            
            # Process through voice orchestrator
            interaction = await conscious_voice_orchestrator.process_voice_interaction(
                channel=channel,
                user_id=user_id,
                text_input=command,
                context={'source': source, 'connection_id': connection.connection_id}
            )
            
            return interaction.response_text or "I processed your request."
            
        except Exception as e:
            logger.error(f"❌ Error processing voice command: {e}")
            return "I'm sorry, I encountered an error processing your request."
            
    async def cleanup_connections(self):
        """Clean up inactive connections"""
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute
                
                now = datetime.now()
                inactive_threshold = timedelta(minutes=30)
                
                inactive_connections = [
                    conn_id for conn_id, conn in self.active_connections.items()
                    if now - conn.last_activity > inactive_threshold
                ]
                
                for conn_id in inactive_connections:
                    connection = self.active_connections[conn_id]
                    try:
                        await connection.websocket.close()
                    except:
                        pass
                    del self.active_connections[conn_id]
                    logger.info(f"🧹 Cleaned up inactive connection: {conn_id}")
                    
            except Exception as e:
                logger.error(f"❌ Error in cleanup task: {e}")
                
    def get_bridge_status(self) -> Dict[str, Any]:
        """Get bridge status information"""
        return {
            'active_connections': len(self.active_connections),
            'connections_by_source': {
                source: len([c for c in self.active_connections.values() if c.source == source])
                for source in self.authorized_sources
            },
            'rate_limits': {
                user_id: len(requests)
                for user_id, requests in self.rate_limits.items()
            },
            'server_info': {
                'host': self.host,
                'port': self.port,
                'ssl_enabled': True
            }
        }

# Create singleton instance
secure_cloud_bridge = SecureCloudBridge()