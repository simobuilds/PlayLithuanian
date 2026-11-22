import json

try:
    with open("motif_prompts.json", "r") as f:
        prompts = json.load(f)

    print("\n--- COPY AND PASTE THIS INTO GEMINI WEB ---")
    print("\nI need to generate a set of UI elements for my Lithuanian language app.")
    print("Please generate high-quality vector-style illustrations on a pure white background.")
    print("Style: Lithuanian Folk Art (minimalist, amber/green/red colors, geometric patterns).\n")

    for p in prompts:
        print(f"IMAGE: {p['name']}")
        print(f"PROMPT: {p['prompt']}")
        print("-" * 30)

    print("\nPlease generate these images one by one.")

except Exception as e:
    print(f"Error: {e}")
