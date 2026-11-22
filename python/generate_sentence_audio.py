"""Build the Sentence Builder word manifest and generate Lithuanian MP3s."""

import argparse
import json
import os
from pathlib import Path
import time
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
PHRASES = ROOT / "public" / "phrases.json"
MANIFEST = ROOT / "python" / "sentence_builder_words.json"
AUDIO_ROOT = ROOT / "public" / "audio" / "sentence-builder"
VOICES = {"male": "lt-LT-LeonasNeural", "female": "lt-LT-OnaNeural"}


def spoken_word(tile):
    word = unicodedata.normalize("NFC", tile.strip().lower())
    return word.strip(".,!?;:")


def build_manifest():
    tiles_by_word = {}
    for section in json.loads(PHRASES.read_text(encoding="utf-8")):
        for phrase in section["phrases"]:
            for tile in phrase["shuffled"]:
                word = spoken_word(tile)
                if not word or any(char in word for char in "/\\"):
                    raise ValueError(f"Invalid audio tile: {tile!r}")
                tiles_by_word.setdefault(word, set()).add(tile)

    words = [
        {"lt": word, "tiles": sorted(tiles), "audioFile": f"{word}.mp3"}
        for word, tiles in sorted(tiles_by_word.items())
    ]
    MANIFEST.write_text(json.dumps(words, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return words


def load_azure_environment():
    variables = {
        "AZURE_SPEECH_KEY": "Azure_key_1",
        "AZURE_SPEECH_REGION": "azure_region",
    }
    env_files = (MANIFEST.parent / ".env", ROOT / ".env")
    entries = {}
    if any(path.is_file() for path in env_files):
        try:
            from dotenv import dotenv_values
        except ImportError as error:
            raise SystemExit("Install python-dotenv to read Azure settings from .env.") from error
        for path in reversed(env_files):
            if path.is_file():
                entries.update({
                    name: value for name, value in dotenv_values(path, interpolate=False).items()
                    if value and value.strip()
                })

    replacement_key = os.getenv("AZURE_SPEECH_KEY_2") or entries.get("AZURE_SPEECH_KEY_2")
    if replacement_key and replacement_key.strip():
        os.environ["AZURE_SPEECH_KEY"] = replacement_key.strip()

    for name, alias in variables.items():
        if os.getenv(name, "").strip():
            continue
        value = os.getenv(alias) or entries.get(name) or entries.get(alias)
        if value and value.strip():
            os.environ[name] = value.strip()

    unavailable = [alias for name, alias in variables.items() if not os.getenv(name, "").strip()]
    if unavailable:
        raise SystemExit(f"Missing Azure settings. Add {' and '.join(unavailable)} to .env.")


def generate_audio(words, voices, overwrite, delay):
    load_azure_environment()
    key = os.environ["AZURE_SPEECH_KEY"]
    region = os.environ["AZURE_SPEECH_REGION"]

    from generate_audio import build_ssml, speechsdk, SPEAKING_RATE

    config = speechsdk.SpeechConfig(subscription=key, region=region)
    config.set_speech_synthesis_output_format(
        speechsdk.SpeechSynthesisOutputFormat.Audio48Khz96KBitRateMonoMp3
    )
    errors = speechsdk.CancellationErrorCode
    stop_batch = {errors.AuthenticationFailure, errors.Forbidden}
    transient = {
        errors.TooManyRequests, errors.ConnectionFailure, errors.ServiceTimeout,
        errors.ServiceError, errors.ServiceUnavailable, errors.ServiceRedirectTemporary,
    }
    failed = []
    for voice in voices:
        directory = AUDIO_ROOT / voice
        directory.mkdir(parents=True, exist_ok=True)
        for index, item in enumerate(words, start=1):
            target = directory / item["audioFile"]
            if not overwrite and target.is_file() and target.stat().st_size > 0:
                print(f"[{index}/{len(words)}] Skipping existing: {voice}/{target.name}")
                continue

            ssml = build_ssml(item["lt"], VOICES[voice], SPEAKING_RATE)
            temporary = target.with_suffix(".part.mp3")
            try:
                for attempt in range(1, 4):
                    audio_config = speechsdk.audio.AudioOutputConfig(filename=str(temporary))
                    synthesizer = speechsdk.SpeechSynthesizer(
                        speech_config=config, audio_config=audio_config
                    )
                    result = synthesizer.speak_ssml_async(ssml).get()
                    if (
                        result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted
                        and temporary.is_file() and temporary.stat().st_size > 0
                    ):
                        temporary.replace(target)
                        print(f"[{index}/{len(words)}] Saved {voice}/{target.name}")
                        break

                    details = result.cancellation_details
                    code = details.error_code if details else None
                    reason = code.name if code is not None else f"{result.reason.name} (no MP3 written)"
                    label = f"{voice}/{target.name}"
                    temporary.unlink(missing_ok=True)
                    if code in stop_batch:
                        raise SystemExit(f"Azure Speech stopped the batch at {label}: {reason}. Check the key, region, and resource access.")
                    if attempt == 3 or (code is not None and code not in transient):
                        failed.append(f"{label}: {reason}")
                        print(f"Could not save {label}: {reason}", flush=True)
                        break
                    retry_delay = max(delay, 30 * attempt if code == errors.TooManyRequests else 10 * attempt)
                    print(f"Retrying {label} in {retry_delay:g}s: {reason}", flush=True)
                    time.sleep(retry_delay)
            finally:
                temporary.unlink(missing_ok=True)
            time.sleep(delay)

    if failed:
        raise SystemExit(
            f"{len(failed)} recording(s) could not be generated. Rerun to retry missing clips.\n"
            + "\n".join(failed)
        )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest-only", action="store_true", help="Refresh the word list without calling Azure")
    parser.add_argument("--voice", choices=[*VOICES, "both"], default="both")
    parser.add_argument("--overwrite", action="store_true", help="Regenerate existing recordings")
    parser.add_argument("--delay", type=float, default=3.2, help="Seconds between synthesis requests")
    args = parser.parse_args()
    if args.delay < 0:
        parser.error("--delay must be non-negative")

    words = build_manifest()
    print(f"Found {len(words)} unique words in {MANIFEST.relative_to(ROOT)}")
    if not args.manifest_only:
        voices = VOICES if args.voice == "both" else [args.voice]
        generate_audio(words, voices, args.overwrite, args.delay)


if __name__ == "__main__":
    main()
