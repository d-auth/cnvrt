from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import tempfile
from moviepy.editor import VideoFileClip, AudioFileClip
import time

app = Flask(__name__)
CORS(app)

# Supported formats
VIDEO_FORMATS = ['mp4', 'mov', 'mkv']
AUDIO_FORMATS = ['mp3', 'ogg', 'wav']

@app.route('/api/convert', methods=['POST'])
def convert_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    target_format = request.form.get('format', '').lower()
    
    if not target_format:
        return jsonify({"error": "No target format specified"}), 400

    # Create temporary paths
    temp_dir = tempfile.gettempdir()
    input_filename = f"input_{int(time.time())}_{file.filename}"
    input_path = os.path.join(temp_dir, input_filename)
    
    output_filename = f"output_{int(time.time())}.{target_format}"
    output_path = os.path.join(temp_dir, output_filename)

    try:
        file.save(input_path)
        
        # Determine if it's audio or video
        is_audio_target = target_format in AUDIO_FORMATS
        
        if is_audio_target:
            # Conversion to audio (from video or audio)
            clip = AudioFileClip(input_path)
            clip.write_audiofile(output_path)
            clip.close()
        else:
            # Conversion to video
            clip = VideoFileClip(input_path)
            clip.write_videofile(output_path, codec="libx264", audio_codec="aac")
            clip.close()

        return send_file(output_path, as_attachment=True, download_name=f"converted.{target_format}")

    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        return jsonify({"error": f"Conversion failed: {str(e)}"}), 500
    
    finally:
        # Cleanup
        if os.path.exists(input_path):
            os.remove(input_path)
        # Note: output_path is sent via send_file, which might need it until transfer is done.
        # Usually send_file doesn't delete, so we might have some leftover in /tmp.
        # In serverless, /tmp is cleared anyway or limited.

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Converter API is running"}), 200

if __name__ == '__main__':
    app.run(debug=True)
