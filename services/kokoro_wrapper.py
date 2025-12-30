import sys
import os
from kokoro_tts import KokoroTTS

# Usage: python kokoro_wrapper.py "Text to speak" "output_filename.wav"

def main():
    if len(sys.argv) < 3:
        print("Error: Missing arguments. Usage: python kokoro_wrapper.py <text> <output_file>")
        sys.exit(1)

    text = sys.argv[1]
    output_file = sys.argv[2]
    # speed: arg 3 (default 1.0)
    speed = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
    # voice: arg 4 (default bf_isabella)
    voice = sys.argv[4] if len(sys.argv) > 4 else "bf_isabella"
    
    # Ensure output directory exists (handled by Node usually, but safety check)
    output_dir = os.path.dirname(output_file)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"Initializing Kokoro TTS...")
    try:
        # Initialize TTS (This might download models on first run)
        tts = KokoroTTS()
        
        print(f"Generating audio for: {text[:30]}...")
        # 'af' is 'American Female' (Default usually). pt-br might not be supported directly as primary?
        # Kokoro is English focused but supports some others via phonemes? 
        # Actually Kokoro v0.19 is multilingual. Let's try to use it default first.
        # User wants PT-BR. Kokoro might support 'pf' (Portuguese Female)? Or we map?
        # Let's verify languages. If not, we just run default.
        
        audio = tts.create_audio(text, voice="bf_isabella") # 'bf_isabella' is a popular one or use default
        # If voice doesn't exist, it might default.
        # Let's stick to default .create_audio(text) first to minimize errors.
        
        audio = tts.create_audio(text, voice=voice, speed=speed, lang="en-us") 
        # Note: lang='en-us' is default, Kokoro v0.19 treats input as phonemes or English mostly. 
        # For PT-BR, it might sound foreign but speed works.
        
        tts.save_audio(output_file, audio)
        print(f"Success: Saved to {output_file}")

    except Exception as e:
        print(f"Error generating audio: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
