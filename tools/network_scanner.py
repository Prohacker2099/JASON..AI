#!/usr/bin/env python3
"""
JASON Network Scanner

This tool scans your local network to find all connected devices.
It's useful for understanding what's actually on your network before
running the smart home discovery.
"""

import socket
import subprocess
import asyncio
import sys
import ipaddress
from concurrent.futures import ThreadPoolExecutor
import requests

class NetworkScanner:
    def __init__(self):
        self.local_ip = self.get_local_ip()
        self.network = self.get_network_range()
        
    def get_local_ip(self):
        """Get the local IP address"""
        try:
            # Connect to a remote address to determine local IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
            return local_ip
        except:
            return "127.0.0.1"
            
    def get_network_range(self):
        """Get the network range"""
        try:
            # Assume /24 subnet
            ip_parts = self.local_ip.split('.')
            network = f"{ip_parts[0]}.{ip_parts[1]}.{ip_parts[2]}.0/24"
            return ipaddress.IPv4Network(network, strict=False)
        except:
            return ipaddress.IPv4Network("192.168.1.0/24")
            
    def ping_host(self, ip):
        """Ping a host to see if it's alive"""
        try:
            # Use ping command
            result = subprocess.run(
                ['ping', '-c', '1', '-W', '1000', str(ip)], 
                capture_output=True, 
                text=True,
                timeout=2
            )
            return result.returncode == 0
        except:
            return False
            
    def scan_port(self, ip, port):
        """Check if a port is open"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((str(ip), port))
            sock.close()
            return result == 0
        except:
            return False
            
    def get_hostname(self, ip):
        """Try to get hostname for IP"""
        try:
            hostname = socket.gethostbyaddr(str(ip))[0]
            return hostname
        except:
            return None
            
    def identify_device(self, ip, open_ports):
        """Try to identify what type of device this is"""
        device_type = "Unknown"
        manufacturer = "Unknown"
        
        # Check for web servers and try to identify
        if 80 in open_ports or 443 in open_ports or 8080 in open_ports:
            try:
                # Try HTTP first
                for port in [80, 8080, 443]:
                    if port in open_ports:
                        protocol = "https" if port == 443 else "http"
                        response = requests.get(f"{protocol}://{ip}:{port}", timeout=3, verify=False)
                        
                        server_header = response.headers.get('Server', '').lower()
                        content = response.text.lower()
                        
                        # Identify based on server header or content
                        if 'hue' in server_header or 'philips' in content:
                            return "Philips Hue Bridge", "Philips"
                        elif 'roku' in server_header or 'roku' in content:
                            return "Roku Device", "Roku"
                        elif 'apple' in server_header or 'apple tv' in content:
                            return "Apple TV", "Apple"
                        elif 'sonos' in server_header or 'sonos' in content:
                            return "Sonos Speaker", "Sonos"
                        elif 'samsung' in content:
                            return "Samsung TV", "Samsung"
                        elif 'lg' in content:
                            return "LG TV", "LG"
                        elif 'chromecast' in content:
                            return "Chromecast", "Google"
                        elif 'nest' in content:
                            return "Nest Device", "Google"
                        elif 'ring' in content:
                            return "Ring Device", "Amazon"
                        elif 'echo' in content or 'alexa' in content:
                            return "Echo Device", "Amazon"
                        
                        break
            except:
                pass
                
        # Identify based on open ports
        if 22 in open_ports:
            device_type = "SSH Server"
        elif 1400 in open_ports:
            device_type = "Sonos Speaker"
            manufacturer = "Sonos"
        elif 8060 in open_ports:
            device_type = "Roku Device"
            manufacturer = "Roku"
        elif 8008 in open_ports:
            device_type = "Chromecast"
            manufacturer = "Google"
        elif 554 in open_ports:
            device_type = "Camera/RTSP"
        elif 5000 in open_ports:
            device_type = "Synology NAS"
            manufacturer = "Synology"
        elif 80 in open_ports or 443 in open_ports:
            device_type = "Web Server"
            
        return device_type, manufacturer
        
    async def scan_network(self):
        """Scan the entire network"""
        print(f"🔍 Scanning network: {self.network}")
        print(f"📍 Your IP: {self.local_ip}")
        print("=" * 60)
        
        alive_hosts = []
        
        # First, find alive hosts
        print("🏃 Finding alive hosts...")
        with ThreadPoolExecutor(max_workers=50) as executor:
            ping_futures = {
                executor.submit(self.ping_host, ip): ip 
                for ip in self.network.hosts()
            }
            
            for future in ping_futures:
                if future.result():
                    ip = ping_futures[future]
                    alive_hosts.append(ip)
                    print(f"   ✅ {ip} is alive")
                    
        print(f"\n📊 Found {len(alive_hosts)} alive hosts")
        
        if not alive_hosts:
            print("⚠️  No hosts found. This could mean:")
            print("   • Network security is blocking ping")
            print("   • Devices don't respond to ping")
            print("   • Wrong network range")
            return []
            
        # Now scan ports on alive hosts
        print("\n🔍 Scanning ports on alive hosts...")
        
        # Common ports to check
        common_ports = [22, 23, 53, 80, 135, 139, 443, 445, 554, 993, 995, 1400, 1900, 5000, 5353, 8008, 8060, 8080, 8443, 9000]
        
        devices = []
        
        for ip in alive_hosts:
            print(f"\n🔍 Scanning {ip}...")
            
            # Get hostname
            hostname = self.get_hostname(ip)
            if hostname:
                print(f"   📛 Hostname: {hostname}")
                
            # Scan ports
            open_ports = []
            with ThreadPoolExecutor(max_workers=20) as executor:
                port_futures = {
                    executor.submit(self.scan_port, ip, port): port 
                    for port in common_ports
                }
                
                for future in port_futures:
                    if future.result():
                        port = port_futures[future]
                        open_ports.append(port)
                        
            if open_ports:
                print(f"   🔓 Open ports: {', '.join(map(str, open_ports))}")
                
                # Try to identify device
                device_type, manufacturer = self.identify_device(ip, open_ports)
                
                device = {
                    'ip': str(ip),
                    'hostname': hostname,
                    'open_ports': open_ports,
                    'device_type': device_type,
                    'manufacturer': manufacturer
                }
                devices.append(device)
                
                print(f"   🏷️  Identified as: {device_type} ({manufacturer})")
            else:
                print(f"   🔒 No open ports found")
                
        return devices
        
    def print_summary(self, devices):
        """Print a summary of discovered devices"""
        print("\n" + "=" * 60)
        print("📊 NETWORK SCAN SUMMARY")
        print("=" * 60)
        
        if not devices:
            print("⚠️  No devices with open ports found")
            return
            
        print(f"🔍 Found {len(devices)} devices with open ports:")
        print()
        
        # Group by manufacturer
        by_manufacturer = {}
        for device in devices:
            manufacturer = device['manufacturer']
            if manufacturer not in by_manufacturer:
                by_manufacturer[manufacturer] = []
            by_manufacturer[manufacturer].append(device)
            
        for manufacturer, manufacturer_devices in by_manufacturer.items():
            print(f"🏭 {manufacturer} ({len(manufacturer_devices)} devices):")
            for device in manufacturer_devices:
                hostname_str = f" ({device['hostname']})" if device['hostname'] else ""
                print(f"   • {device['ip']}{hostname_str} - {device['device_type']}")
                print(f"     Ports: {', '.join(map(str, device['open_ports']))}")
            print()
            
        # Identify potential smart home devices
        smart_devices = []
        for device in devices:
            if any(keyword in device['device_type'].lower() for keyword in 
                   ['hue', 'sonos', 'roku', 'chromecast', 'apple tv', 'nest', 'ring', 'echo']):
                smart_devices.append(device)
                
        if smart_devices:
            print(f"🏠 Potential smart home devices ({len(smart_devices)}):")
            for device in smart_devices:
                print(f"   • {device['ip']} - {device['device_type']} ({device['manufacturer']})")
        else:
            print("⚠️  No obvious smart home devices found")
            print("   This doesn't mean they don't exist - they might:")
            print("   • Use different ports")
            print("   • Be in sleep mode")
            print("   • Block port scanning")
            print("   • Use encrypted protocols")

async def main():
    """Main function"""
    print("🌐 JASON Network Scanner")
    print("=" * 60)
    print("This tool scans your local network to find connected devices.")
    print("It helps identify what's available before running smart home discovery.")
    print("=" * 60)
    
    scanner = NetworkScanner()
    devices = await scanner.scan_network()
    scanner.print_summary(devices)
    
    print("\n🔧 Next steps:")
    print("   • Run the real device discovery: python3 demo/real_device_demo.py")
    print("   • Configure API keys for identified smart devices")
    print("   • Set up JASON smart home automation")

if __name__ == "__main__":
    asyncio.run(main())