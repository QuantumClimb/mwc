#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
from urllib.parse import urlparse, parse_qs

class ImageServer(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Handle API request for images
        if self.path == '/api/images':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Get list of images from images folder
            images_dir = 'images'
            image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            image_files = []
            
            if os.path.exists(images_dir):
                for filename in os.listdir(images_dir):
                    if any(filename.lower().endswith(ext) for ext in image_extensions):
                        image_files.append(filename)
            
            # Sort images by number (extract numbers from filenames)
            def extract_number(filename):
                import re
                # Find all numbers in the filename
                numbers = re.findall(r'\d+', filename)
                if numbers:
                    # Return the first number found, or 0 if no numbers
                    return int(numbers[0])
                return 0
            
            # Sort by extracted numbers, then alphabetically for files with same numbers
            image_files.sort(key=lambda x: (extract_number(x), x))
            
            response = json.dumps(image_files)
            self.wfile.write(response.encode())
            return
        
        # Handle regular file requests
        return super().do_GET()

if __name__ == "__main__":
    PORT = 8000
    
    with socketserver.TCPServer(("", PORT), ImageServer) as httpd:
        print(f"Server running at http://localhost:{PORT}")
        print("Press Ctrl+C to stop the server")
        httpd.serve_forever() 