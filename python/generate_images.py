import base64
import json
import os
import re
import time
from google import genai
from google.genai import types

# ================= CONFIGURATION =================
INPUT_JSON = "image_prompts.json"
OUTPUT_JSON = "words_with_images.json"
IMAGE_DIR = "images"

# Choose approach:
#   "gemini" -> uses gemini-2.5-flash-image (great for stylized UI icons)
#   "imagen" -> uses imagen-4.0-generate-001 (dedicated Imagen model)
MODE = "gemini"

GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image"
IMAGEN_MODEL = "imagen-4.0-generate-001"

ASPECT_RATIO = "1:1"
DELAY_SECONDS = 2.0  # Pause between requests to avoid rate limits
# =================================================


def make_safe_filename(item_id: int, word: str, ext: str = "png") -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", word.lower()).strip("_")
    return f"{item_id:03d}_{slug}.{ext}"


def clean_prompt(prompt: str) -> str:
    # Remove Midjourney flags like "--ar 1:1" since Gemini uses config parameters
    return re.sub(r"\s*--ar\s+\S+", "", prompt).strip()


def find_existing_image(item_id: int, word: str) -> str | None:
    for ext in ("png", "jpg", "jpeg", "webp"):
        fname = make_safe_filename(item_id, word, ext)
        fpath = os.path.join(IMAGE_DIR, fname)
        if os.path.exists(fpath) and os.path.getsize(fpath) > 0:
            return fname
    return None


def generate_with_gemini(client: genai.Client, prompt: str) -> tuple[bytes, str]:
    response = client.models.generate_content(
        model=GEMINI_IMAGE_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(aspect_ratio=ASPECT_RATIO),
        ),
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            raw_data = part.inline_data.data
            if isinstance(raw_data, str):
                raw_data = base64.b64decode(raw_data)
            mime = (part.inline_data.mime_type or "image/png").lower()
            ext = "jpg" if "jpeg" in mime or "jpg" in mime else "png"
            return raw_data, ext

    raise RuntimeError("No image data returned in Gemini response.")


def generate_with_imagen(client: genai.Client, prompt: str) -> tuple[bytes, str]:
    result = client.models.generate_images(
        model=IMAGEN_MODEL,
        prompt=prompt,
        config=types.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio=ASPECT_RATIO,
            output_mime_type="image/png",
        ),
    )

    if not result.generated_images:
        raise RuntimeError("No image returned by Imagen.")

    img_bytes = result.generated_images[0].image.image_bytes
    return img_bytes, "png"


def main():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Missing API key! Set the GEMINI_API_KEY environment variable.")

    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        items = json.load(f)

    os.makedirs(IMAGE_DIR, exist_ok=True)
    client = genai.Client(api_key=api_key)

    total = len(items)
    print(f"Found {total} prompts. Generating 1:1 images using MODE='{MODE}'...\n")

    for index, item in enumerate(items, start=1):
        item_id = item.get("id", index)
        word = item.get("word") or item.get("en") or f"item_{index}"
        raw_prompt = item.get("prompt")

        if not raw_prompt:
            raise ValueError(f"Missing 'prompt' field in item #{index}: {item}")

        existing = find_existing_image(item_id, word)
        if existing:
            item["imageFile"] = existing
            print(f"[{index}/{total}] Skipping existing: {existing}")
            continue

        prompt = clean_prompt(raw_prompt)

        for attempt in range(1, 4):
            try:
                if MODE == "imagen":
                    img_bytes, ext = generate_with_imagen(client, prompt)
                else:
                    img_bytes, ext = generate_with_gemini(client, prompt)

                filename = make_safe_filename(item_id, word, ext)
                filepath = os.path.join(IMAGE_DIR, filename)

                with open(filepath, "wb") as out:
                    out.write(img_bytes)

                item["imageFile"] = filename
                print(f"[{index}/{total}] Saved {filename}")
                break

            except Exception as e:
                print(f"[{index}/{total}] Error (attempt {attempt}): {e}")
                if attempt < 3:
                    wait_time = 10 * attempt
                    print(f"   Waiting {wait_time}s before retrying...")
                    time.sleep(wait_time)
                else:
                    raise

        time.sleep(DELAY_SECONDS)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    print(f"\nDone! Images saved in '{IMAGE_DIR}/' and mapped in '{OUTPUT_JSON}'.")


if __name__ == "__main__":
    main()