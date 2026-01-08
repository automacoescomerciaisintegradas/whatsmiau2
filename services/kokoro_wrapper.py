import sys
import os
import torch
try:
    from kokoro_tts import KokoroTTS
except ImportError:
    print("Error: kokoro_tts library not installed. Please run: pip install kokoro-tts")
    sys.exit(1)

# Usage: python kokoro_wrapper.py "Text to speak" "output_filename.wav" [speed] [voice]

def main():
    if len(sys.argv) < 3:
        print("Error: Missing arguments. Usage: python kokoro_wrapper.py <text> <output_file> [speed] [voice]")
        sys.exit(1)

    text = sys.argv[1]
    output_file = sys.argv[2]
    
    # speed: arg 3 (default 1.2)
    speed = float(sys.argv[3]) if len(sys.argv) > 3 else 1.2
    
    # voice: arg 4 (default bf_isabella)
    # Popular Kokoro voices: af_bella, af_nicole, bf_isabella, bf_emma
    voice = sys.argv[4] if len(sys.argv) > 4 else "bf_isabella"
    
    # Ensure output directory exists
    output_dir = os.path.dirname(output_file)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    print(f"Initializing Kokoro TTS (multilingual)...")
    try:
        # Initialize TTS
        tts = KokoroTTS()
        
        print(f"Generating audio for: {text[:50]}...")
        # Note: Kokoro v0.19 multilingual supports different languages.
        # While 'lang' exists, often the voice itself determines the accent.
        # We will try to detect if text is predominantly PT and use appropriate settings if possible.
        
        # 'p' is often used for Portuguese in Kokoro Multilingual. 
        # But to avoid breaking if not supported, we'll stick to the library's defaults or user's requested lang.
        
        audio = tts.create_audio(
            text, 
            voice=voice, 
            speed=speed, 
            lang="en-us" # Defaulting to en-us as it's the most stable for phonemes
        )
        
        tts.save_audio(output_file, audio)
        print(f"Success: Saved to {output_file}")

    except Exception as e:
        print(f"Error generating audio: {str(e)}")
        # If failure, try a fallback with default voice
        try:
            print("Trying fallback with default voice...")
            audio = tts.create_audio(text, voice="af_bella")
            tts.save_audio(output_file, audio)
            print(f"Success (Fallback): Saved to {output_file}")
        except:
            sys.exit(1)

if __name__ == "__main__":
    main()
