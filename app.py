from flask import Flask, render_template, request, jsonify
from tensorflow.keras.models import load_model
from PIL import Image
import numpy as np
import os, io

app = Flask(__name__)
MODEL_PATH = os.environ.get('MODEL_PATH', 'model.keras')
model = load_model(MODEL_PATH)

# IMPORTANT: For a 2-class softmax model, set these in the SAME order as your
# training dataset's class_indices. Example: ['fresh', 'rotten'].
CLASS_NAMES = ['Fresh', 'Rotten']

# Read expected image dimensions from the model where possible.
shape = model.input_shape
IMG_HEIGHT = int(shape[1]) if shape and shape[1] else 224
IMG_WIDTH = int(shape[2]) if shape and shape[2] else 224


def preprocess_image(file_bytes):
    image = Image.open(io.BytesIO(file_bytes)).convert('RGB')
    image = image.resize((IMG_WIDTH, IMG_HEIGHT))
    arr = np.asarray(image, dtype=np.float32)
    # Common CNN convention. If your training pipeline used a different
    # preprocessing step (e.g. preprocess_input), mirror it here.
    arr = arr / 255.0
    return np.expand_dims(arr, axis=0)


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'Please choose an image first.'}), 400
    file = request.files['image']
    if not file.filename:
        return jsonify({'error': 'Please choose an image first.'}), 400
    try:
        image_array = preprocess_image(file.read())
        prediction = np.asarray(model.predict(image_array, verbose=0))
        values = prediction.reshape(-1)

        if len(values) == 1:
            # Sigmoid output: probability of the positive class.
            rotten_probability = float(values[0])
            # Assumes sigmoid class 1 is Rotten. Change if your model was trained differently.
            if rotten_probability >= 0.5:
                label, confidence = 'Rotten', rotten_probability
            else:
                label, confidence = 'Fresh', 1.0 - rotten_probability
        else:
            idx = int(np.argmax(values))
            label = CLASS_NAMES[idx] if idx < len(CLASS_NAMES) else f'Class {idx}'
            confidence = float(values[idx])

        return jsonify({'label': label, 'confidence': round(confidence * 100, 2)})
    except Exception as exc:
        app.logger.exception('Prediction failed')
        return jsonify({'error': f'Could not process this image. Check model preprocessing and image format. ({str(exc)})'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)
