# FruitCheck — Fruit Fresh/Rotten CNN Classifier

Responsive HTML/CSS/JavaScript frontend with a Flask API that loads your `.keras` model.

## 1. Put your model in this folder
Copy your trained model into this folder and rename it to `model.keras`.

## 2. Install dependencies
Use Python 3.10 or 3.11 in a virtual environment, then run:

```bash
pip install -r requirements.txt
```

TensorFlow can be large and may need a compatible Python version. On deployment, check the Python/TensorFlow versions supported by the selected host.

## 3. Run locally

```bash
python app.py
```

Open http://127.0.0.1:5000

## Important model settings
- `app.py` currently assumes images were scaled to 0–1 (`image / 255.0`). Change `preprocess_image()` to match the exact preprocessing used when training your CNN.
- For a two-output softmax model, set `CLASS_NAMES` to the exact class order from training (for example, if `class_indices` was `{'fresh': 0, 'rotten': 1}`, use `['Fresh', 'Rotten']`).
- For a one-output sigmoid model, the code assumes sigmoid probability means Rotten. Reverse that logic if your training labels used the opposite convention.
- If you trained at a specific image size, make sure it matches the model input size. The code tries to read height and width from the saved model.

## Render deployment outline
1. Push this project to GitHub, including `app.py`, `templates/`, `static/`, and `requirements.txt`.
2. Keep the model file in the repo only if its size and your repository policy allow it. A 128 MB model may be better stored via Git LFS or downloaded from model storage at startup.
3. Create a Render Web Service and use build command `pip install -r requirements.txt`.
4. Use start command `gunicorn app:app` and add `gunicorn` to `requirements.txt`.
5. Ensure the model file is present at the path in `MODEL_PATH` (default: `model.keras`).
