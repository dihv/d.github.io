// imageViewer.js
window.ImageViewer = class ImageViewer {
    constructor(imageData) {
        // PTA_1 & PTA_5: Use safe character set from shared config
        this.encoder = new window.BitStreamEncoder(window.CONFIG.SAFE_CHARS);
        
        // Setup container
        this.container = this.createContainer();
        document.body.appendChild(this.container);
        
        if (imageData) {
            this.decodeAndDisplayImage(decodeURIComponent(imageData))
                .catch(error => this.showError(error.message));
        } else {
            this.showError('No image data provided');
        }
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'image-viewer-container';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
            box-sizing: border-box;
            background: #f5f5f5;
        `;
        return container;
    }

    async decodeAndDisplayImage(encodedData) {
        try {
            // Validate encoded data
            this.validateEncodedData(encodedData);

            // Show loading state
            this.showStatus('Decoding image data...', 'info');

            // PTA_2 & PTA_3: Decode preserving byte boundaries
            const buffer = await this.decoder(encodedData);
            
            // PTA_4: Detect format from first principles using signatures
            const format = this.detectImageFormat(buffer);
            
            if (!format) {
                throw new Error('Unable to detect valid image format');
            }

            // Verify format is supported
            if (!CONFIG.SUPPORTED_INPUT_FORMATS.includes(format)) {
                throw new Error(`Unsupported image format: ${format}`);
            }

            // Create blob and URL
            const blob = new Blob([buffer], { type: format });
            const url = URL.createObjectURL(blob);

            // Create image element
            const img = await this.createImage(url, format);
            
            // Clear any previous content
            this.container.innerHTML = '';
            
            // Add image info
            this.addImageInfo(buffer.byteLength, format);
            
            // Add the image
            this.container.appendChild(img);

            // Add download button
            this.addDownloadButton(blob, format);

        } catch (error) {
            console.error('Display error:', error);
            this.showError(`Failed to display image: ${error.message}`);
        }
    }

    validateEncodedData(encodedData) {
        // Check for empty data
        if (!encodedData || typeof encodedData !== 'string') {
            throw new Error('Invalid or missing image data');
        }

        // PTA_1: Validate against safe character set
        const invalidChars = [...encodedData].filter(char => !CONFIG.SAFE_CHARS.includes(char));
        if (invalidChars.length > 0) {
            throw new Error('Image data contains invalid characters');
        }

        // Check length constraints
        if (encodedData.length > CONFIG.MAX_URL_LENGTH) {
            throw new Error('Image data exceeds maximum allowed length');
        }
    }

    async decoder(encodedData) {
        try {
            // PTA_2 & PTA_3: Use BitStreamEncoder for decoding
            return await this.encoder.decodeBits(encodedData);
        } catch (error) {
            throw new Error(`Decoding failed: ${error.message}`);
        }
    }

    detectImageFormat(buffer) {
        // PTA_4: Format detection from first principles using byte signatures
        const arr = new Uint8Array(buffer);
        
        for (const [formatName, signature] of Object.entries(CONFIG.FORMAT_SIGNATURES)) {
            const { bytes, offset = 0, format } = signature;
            
            // Skip if buffer is too short
            if (arr.length < (offset + bytes.length)) continue;
            
            // Check signature bytes
            const matches = bytes.every((byte, i) => arr[offset + i] === byte);
            
            if (matches) {
                console.log(`Detected format: ${formatName}`);
                return format;
            }
        }
        
        return null;
    }

    createImage(url, format) {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img');
            
            img.onload = () => {
                URL.revokeObjectURL(url); // Clean up
                resolve(img);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url); // Clean up
                reject(new Error(`Failed to load ${format} image`));
            };

            // Set image styles
            img.style.cssText = `
                max-width: 100%;
                max-height: 90vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            `;
            
            img.src = url;
        });
    }

    addImageInfo(size, format) {
        const info = document.createElement('div');
        info.style.cssText = `
            margin-bottom: 20px;
            text-align: center;
            font-family: system-ui, -apple-system, sans-serif;
            color: #666;
        `;
        
        const formattedSize = (size / 1024).toFixed(2);
        info.textContent = `Format: ${format} | Size: ${formattedSize}KB`;
        
        this.container.appendChild(info);
    }

    addDownloadButton(blob, format) {
        const button = document.createElement('a');
        button.href = URL.createObjectURL(blob);
        button.download = `image.${format.split('/')[1]}`;
        button.className = 'download-button';
        button.textContent = 'Download Image';
        
        button.style.cssText = `
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background: #2196F3;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-family: system-ui, -apple-system, sans-serif;
            transition: background 0.3s ease;
        `;
        
        button.onmouseover = () => button.style.background = '#1976D2';
        button.onmouseout = () => button.style.background = '#2196F3';
        
        this.container.appendChild(button);
    }

    showStatus(message, type = 'info') {
        const status = document.createElement('div');
        status.textContent = message;
        status.style.cssText = `
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
            font-family: system-ui, -apple-system, sans-serif;
            text-align: center;
            ${type === 'error' ? 'background: #ffebee; color: #c62828;' : 
              'background: #e3f2fd; color: #1565c0;'}
        `;
        
        this.container.innerHTML = '';
        this.container.appendChild(status);
    }

    showError(message) {
        this.showStatus(message, 'error');
    }
};
