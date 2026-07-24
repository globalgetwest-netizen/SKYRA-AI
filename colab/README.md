# SKYRA — Free Video Generation on Google Colab

Your laptop has no dedicated GPU, so video is generated on Google's **free**
Colab GPU instead. You run an open video model there, expose a small endpoint,
and point SKYRA at it. No subscription required.

> **Reality check:** the free Colab GPU (T4) runs **LTX-Video**, an open model
> that makes short clips (~5s). Quality is good but below paid Kling/Veo, and
> Colab free has time/session limits. It's perfect for testing and simple
> shots; the paid `replicate` engine is there when you want top quality.

SKYRA talks to the server through one simple contract, so **any** server that
honors it works — you can upgrade the model later without changing SKYRA.

**Contract** — `POST <endpoint>` with JSON
`{ "prompt", "negative_prompt", "aspect_ratio", "seconds", "seed" }`
→ responds with `video/mp4` bytes (or JSON `{ "video_base64" }`).

## Steps

1. Open <https://colab.research.google.com> → **New notebook**.
2. Menu **Runtime → Change runtime type → T4 GPU → Save**.
3. Paste each cell below and run them top to bottom.
4. The last cell prints a public URL like `https://xxxx.trycloudflare.com`.
5. On your laptop, set SKYRA to use it and run:
   ```powershell
   $env:SKYRA_VIDEO_PROVIDER="http"
   $env:SKYRA_VIDEO_ENDPOINT="https://xxxx.trycloudflare.com/generate"
   npm run dev
   ```
   Scenes marked for video now save `scene-N.mp4` in `storage/output/`.

Keep the Colab tab open while generating (closing it stops the server).

---

### Cell 1 — install
```python
!pip -q install "diffusers>=0.32" transformers accelerate imageio imageio-ffmpeg flask
!wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /usr/local/bin/cloudflared
!chmod +x /usr/local/bin/cloudflared
```

### Cell 2 — load the LTX-Video model (open, free weights)
```python
import torch
from diffusers import LTXPipeline

pipe = LTXPipeline.from_pretrained(
    "Lightricks/LTX-Video", torch_dtype=torch.bfloat16
).to("cuda")
print("model ready")
```

### Cell 3 — a server that honors SKYRA's contract
```python
import io, base64, tempfile
from flask import Flask, request, send_file
from diffusers.utils import export_to_video

app = Flask(__name__)

DIMS = {"16:9": (704, 480), "9:16": (480, 704), "1:1": (512, 512)}

@app.post("/generate")
def generate():
    data = request.get_json(force=True)
    w, h = DIMS.get(data.get("aspect_ratio", "16:9"), (704, 480))
    seconds = float(data.get("seconds", 5))
    num_frames = max(9, int(seconds * 24) // 8 * 8 + 1)  # LTX likes 8n+1 frames

    result = pipe(
        prompt=data["prompt"],
        negative_prompt=data.get("negative_prompt") or "worst quality, blurry, distorted",
        width=w, height=h, num_frames=num_frames,
        num_inference_steps=40,
    ).frames[0]

    path = tempfile.mktemp(suffix=".mp4")
    export_to_video(result, path, fps=24)
    return send_file(path, mimetype="video/mp4")

print("server defined")
```

### Cell 4 — start it + get a public URL
```python
import subprocess, threading, time, re
threading.Thread(target=lambda: app.run(port=8000), daemon=True).start()
time.sleep(2)
proc = subprocess.Popen(
    ["cloudflared", "tunnel", "--url", "http://localhost:8000"],
    stderr=subprocess.PIPE, text=True,
)
for line in proc.stderr:
    m = re.search(r"https://[-\w.]+trycloudflare\.com", line)
    if m:
        print("\n\n👉 SKYRA_VIDEO_ENDPOINT =", m.group(0) + "/generate\n\n")
        break
```

Copy the printed `.../generate` URL into `SKYRA_VIDEO_ENDPOINT` on your laptop.

---

## Prefer paid, top quality instead?
Skip Colab entirely and use Replicate (Kling), pay-per-clip:
```powershell
$env:SKYRA_VIDEO_PROVIDER="replicate"
$env:REPLICATE_API_TOKEN="r8_your_token"
npm run dev
```

## Notes / troubleshooting
- Colab free sessions time out after inactivity — rerun cells 2-4 to restart.
- If `LTXPipeline` import fails, bump diffusers: `!pip install -U diffusers`.
- First generation is slow (model warm-up); later ones are faster.
- Want higher quality on the free path? Try the model
  `Lightricks/LTX-Video-0.9.7-dev` in Cell 2 (heavier, slower).
