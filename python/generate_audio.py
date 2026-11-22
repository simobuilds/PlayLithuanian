import html
import json
import os
import re
import time
import azure.cognitiveservices.speech as speechsdk

# ================= CONFIGURATION =================
INPUT_JSON = "words.json"
OUTPUT_JSON = "words_with_audio.json"
AUDIO_DIR = "audio_male"

# Choose voice: "lt-LT-OnaNeural" (female) or "lt-LT-LeonasNeural" (male)
VOICE_NAME = "lt-LT-LeonasNeural"

# Speaking speed: "0%" is normal, "-10%" is slightly slower (great for learners)
SPEAKING_RATE = "-3%"

# Azure Free (F0) tier allows 20 requests per minute (~1 every 3 seconds).
# If you are on Paid (S0) tier, you can lower this to 0.2.
DELAY_SECONDS = 3.2
# =================================================


def make_safe_filename(item_id: int, word: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", word.lower()).strip("_")
    return f"{item_id:03d}_{slug}.mp3"


def build_ssml(text: str, voice: str, rate: str) -> str:
    # Adding a period helps single words end with natural falling intonation
    spoken_text = text.strip()
    if not spoken_text.endswith((".", "!", "?")):
        spoken_text += "."

    escaped_text = html.escape(spoken_text)
    return (
        f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="lt-LT">'
        f'<voice name="{voice}">'
        f'<break time="200ms"/>'
        f'<prosody rate="{rate}">{escaped_text}</prosody>'
        f"</voice>"
        f"</speak>"
    )


def load_words(filepath: str) -> list:
    with open(filepath, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    if isinstance(raw_data, str):
        raw_data = json.loads(raw_data)

    if isinstance(raw_data, dict):
        words = []
        for value in raw_data.values():
            if isinstance(value, list):
                words.extend(value)
            elif isinstance(value, dict):
                words.append(value)
    elif isinstance(raw_data, list):
        words = raw_data
    else:
        raise ValueError(f"Unexpected JSON format: {type(raw_data)}")

    if not words or not isinstance(words[0], dict):
        raise ValueError(
            f"Expected word objects like {{'id': 1, 'word': '...', 'lt': '...'}}, but got: {words[:2]}"
        )

    return words


def main():
    speech_key = os.getenv("AZURE_SPEECH_KEY")
    speech_region = os.getenv("AZURE_SPEECH_REGION")

    if not speech_key or not speech_region:
        raise ValueError(
            "Missing credentials! Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION environment variables."
        )

    words = load_words(INPUT_JSON)
    os.makedirs(AUDIO_DIR, exist_ok=True)

    speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=speech_region)
    speech_config.set_speech_synthesis_output_format(
        speechsdk.SpeechSynthesisOutputFormat.Audio48Khz96KBitRateMonoMp3
    )

    total = len(words)
    print(f"Found {total} words. Generating audio using {VOICE_NAME}...\n")

    for index, item in enumerate(words, start=1):
        word_id = item.get("id", index)
        word_en = item.get("word") or item.get("en") or f"word_{index}"
        word_lt = item.get("lt")

        if not word_lt:
            raise ValueError(f"Missing 'lt' translation in item #{index}: {item}")

        filename = make_safe_filename(word_id, word_en)
        filepath = os.path.join(AUDIO_DIR, filename)
        item["audioFile"] = filename

        # Skip already-generated files (safe to resume if interrupted)
        if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
            print(f"[{index}/{total}] Skipping existing: {filename}")
            continue

        ssml = build_ssml(word_lt, VOICE_NAME, SPEAKING_RATE)
        audio_config = speechsdk.audio.AudioOutputConfig(filename=filepath)
        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config, audio_config=audio_config
        )

        for attempt in range(1, 4):
            result = synthesizer.speak_ssml_async(ssml).get()

            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                print(f"[{index}/{total}] Saved {filename} -> \"{word_lt}\"")
                break
            else:
                details = result.cancellation_details
                print(
                    f"[{index}/{total}] Error (attempt {attempt}): "
                    f"{details.reason} - {details.error_details}"
                )
                if os.path.exists(filepath):
                    os.remove(filepath)
                if attempt < 3:
                    wait_time = 10 * attempt
                    print(f"   Waiting {wait_time}s before retrying...")
                    time.sleep(wait_time)
                else:
                    raise RuntimeError(
                        f"Failed to synthesize '{word_lt}' after 3 attempts."
                    )

        time.sleep(DELAY_SECONDS)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, indent=2)

    print(f"\nDone! All audio saved in '{AUDIO_DIR}/' and mapped in '{OUTPUT_JSON}'.")


if __name__ == "__main__":
    main()