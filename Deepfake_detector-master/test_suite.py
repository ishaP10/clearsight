import io
import time
import requests
import numpy as np
from PIL import Image
import cv2

API_URL = "http://127.0.0.1:5002"

print("--- RUNNING SUITE TEST ---")

# 1. Test Home & Health
r_home = requests.get(f"{API_URL}/")
assert r_home.status_code == 200, f"GET / failed with {r_home.status_code}"
assert "ClearSight" in r_home.text, "Title not found in home page"
print("[OK] Test 1: GET / loaded successfully")

r_health = requests.get(f"{API_URL}/health")
assert r_health.status_code == 200
assert r_health.json()["status"] == "online"
print("[OK] Test 2: GET /health returned online status")

# 2. Test Image Deepfake Analysis
img = Image.new("RGB", (300, 300), color=(180, 120, 90))
img_buf = io.BytesIO()
img.save(img_buf, format="JPEG")
img_buf.seek(0)

r_img = requests.post(
    f"{API_URL}/analyze",
    files={"file": ("test_photo.jpg", img_buf, "image/jpeg")},
    data={"type": "image"}
)
assert r_img.status_code == 200, f"Image analyze failed: {r_img.text}"
img_data = r_img.json()
assert "is_fake" in img_data and "confidence" in img_data
print(f"[OK] Test 3: POST /analyze (image) succeeded -> is_fake={img_data['is_fake']}, conf={img_data['confidence']}%")

# 3. Test Video Deepfake Analysis
video_filename = "test_video.mp4"
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
vw = cv2.VideoWriter(video_filename, fourcc, 10.0, (200, 200))
for i in range(25):
    f_arr = np.full((200, 200, 3), (i * 8, 120, 180), dtype=np.uint8)
    vw.write(f_arr)
vw.release()

with open(video_filename, "rb") as vf:
    r_vid = requests.post(
        f"{API_URL}/analyze",
        files={"file": ("test_video.mp4", vf, "video/mp4")},
        data={"type": "video"}
    )
assert r_vid.status_code == 200, f"Video analyze failed: {r_vid.text}"
vid_data = r_vid.json()
assert "is_fake" in vid_data and "timeline" in vid_data and len(vid_data["timeline"]) > 0
print(f"[OK] Test 4: POST /analyze (video) succeeded -> is_fake={vid_data['is_fake']}, frames={vid_data['frames_analyzed']}")

# 4. Test Image Restoration in Auto Mode
img_buf.seek(0)
r_restore = requests.post(
    f"{API_URL}/restore",
    files={"file": ("restore_test.jpg", img_buf, "image/jpeg")},
    data={"mode": "auto", "denoise": 50, "sharpen": 50, "contrast": 50, "brightness": 0}
)
assert r_restore.status_code == 200, f"Image restore failed: {r_restore.text}"
res_data = r_restore.json()
assert res_data["success"] is True
assert "restored_image" in res_data and res_data["restored_image"].startswith("data:image/jpeg;base64,")
assert "metrics" in res_data
print(f"[OK] Test 5: POST /restore (auto) succeeded -> metrics={res_data['metrics']}")

# 5. Test Download Restored Image
dl_filename = res_data["filename"]
r_dl = requests.get(f"{API_URL}/download/{dl_filename}")
assert r_dl.status_code == 200, f"Download failed: {r_dl.status_code}"
assert len(r_dl.content) > 1000
print(f"[OK] Test 6: GET /download/{dl_filename} succeeded -> downloaded {len(r_dl.content)} bytes")

# 6. Test Additional Restoration Modes
for m in ["denoise", "clarity", "low_light", "portrait"]:
    img_buf.seek(0)
    r_m = requests.post(
        f"{API_URL}/restore",
        files={"file": ("test.jpg", img_buf, "image/jpeg")},
        data={"mode": m}
    )
    assert r_m.status_code == 200
    assert r_m.json()["success"] is True
    print(f"[OK] Test 7.{m}: Restoration mode '{m}' succeeded")

print("\nALL TESTS PASSED SUCCESSFULLY! The entire platform is 100% operational!")
