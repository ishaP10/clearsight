# ClearSight — Forensic Media Integrity & AI Image Restoration Studio

A full-stack AI web platform and Chrome extension for detecting deepfakes in images and videos, and restoring/enhancing degraded photographs using intelligent neural & computer vision pipelines.

## Key Capabilities

| Capability | Module | Details |
|---|---|---|
| **Image Deepfake Detection** | `deepfake_cnn.keras` | 4-block Conv2D neural network with spatial artifact analysis |
| **Video Deepfake Detection** | Multi-frame temporal engine | Samples 20 key frames across the video timeline, detects face-swaps & synthesis anomalies |
| **AI Image Restoration** | OpenCV + PIL Vision Pipeline | Denoising (Non-Local Means / Bilateral), CLAHE dynamic range expansion, smart unsharp clarity, low-light illumination, and portrait retouching |
| **Chrome Extension** | Manifest V3 Extension | Analyze & restore directly from popup or right-click any web image |

---

## Supported Media Formats

- **Images**: PNG, JPG, JPEG, WebP, GIF, BMP, TIFF
- **Videos**: MP4, WebM, MOV, AVI, MKV

---

## Quick Start

### 1. Launch the Server

Double-click `start_server.bat` or run:
```bash
py -3.12 app.py
```
*(or `python app.py`)*

The server will initialize on **`http://127.0.0.1:5002`**.

### 2. Open the Web Application

Navigate in your browser to:
```
http://127.0.0.1:5002
```

---

## Chrome Extension Setup

1. Open Google Chrome and go to `chrome://extensions/`
2. Turn ON **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `extension` folder in this repository:
   ```
   c:\Users\Isha\OneDrive\Desktop\Deepfake_detector-master\extension
   ```
4. **Toolbar Popup**: Click the extension icon to upload images, videos, or restore photos directly.
5. **Right-Click Context Menu**: Right-click any image on any webpage and choose:
   - **Analyze image for deepfake (ClearSight)**
   - **Restore & enhance image with AI (ClearSight)**

---

## API Reference

### 1. Deepfake Detection
**`POST /analyze`**
- Multipart Form:
  - `file`: Media file (image or video)
  - `type`: `"image"` or `"video"`

**Response:**
```json
{
  "is_fake": false,
  "confidence": 94.2,
  "fake_probability": 5.8,
  "real_probability": 94.2,
  "status": "success",
  "message": "AUTHENTIC IMAGE DETECTED with 94.2% confidence"
}
```

### 2. Image Restoration
**`POST /restore`**
- Multipart Form:
  - `file`: Image file
  - `mode`: `"auto"` | `"denoise"` | `"clarity"` | `"low_light"` | `"portrait"`
  - `denoise`: `0-100` (optional)
  - `sharpen`: `0-100` (optional)
  - `contrast`: `0-100` (optional)
  - `brightness`: `-50 to +50` (optional)

**Response:**
```json
{
  "success": true,
  "mode": "auto",
  "original_image": "data:image/jpeg;base64,...",
  "restored_image": "data:image/jpeg;base64,...",
  "metrics": {
    "resolution": "1920 × 1080",
    "sharpness_gain": "+42%",
    "noise_reduction": "85%",
    "dynamic_range_gain": "+18%",
    "processing_time": "124ms"
  }
}
```

---

## Project Structure

```
Deepfake_detector-master/
├── app.py                    # Flask backend with ML inference & restoration engine
├── start_server.bat          # 1-click startup script for Windows
├── requirements.txt          # Python dependencies
├── deepfake_cnn.keras/       # Trained Deepfake CNN model
├── templates/
│   └── index.html            # Studio web application (Glassmorphic dark UI)
├── extension/                # Chrome Manifest V3 Extension
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html & popup.js
│   ├── analyze.html & analyze.js
│   └── styles.css
└── uploads/                  # Uploads and restored media
```
