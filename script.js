const input = document.getElementById('imageInput');
const chooseButton = document.getElementById('chooseButton');
const dropzone = chooseButton;
const analyzeButton = document.getElementById('analyzeButton');
const buttonText = document.getElementById('buttonText');
const previewWrap = document.getElementById('previewWrap');
const previewImage = document.getElementById('previewImage');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const resultContent = document.getElementById('resultContent');
const loadingContent = document.getElementById('loadingContent');
const finalContent = document.getElementById('finalContent');
const errorContent = document.getElementById('errorContent');
let selectedFile = null;
let previewUrl = null;

chooseButton.addEventListener('click', () => input.click());
input.addEventListener('change', () => { if (input.files && input.files[0]) setFile(input.files[0]); });
['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, e => { e.preventDefault(); dropzone.classList.add('dragover'); }));
['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, e => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
dropzone.addEventListener('drop', e => { const file = e.dataTransfer.files[0]; if (file) setFile(file); });

document.getElementById('removeButton').addEventListener('click', clearFile);
document.getElementById('tryAgainButton').addEventListener('click', clearFile);
document.getElementById('errorTryButton').addEventListener('click', clearFile);

function setFile(file) {
  if (!file.type.startsWith('image/')) { showError('Please select an image file (JPG, PNG, or WEBP).'); return; }
  if (file.size > 10 * 1024 * 1024) { showError('Image must be smaller than 10 MB.'); return; }
  selectedFile = file;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  previewImage.src = previewUrl;
  fileName.textContent = file.name;
  fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready to analyze`;
  dropzone.classList.add('hidden');
  previewWrap.classList.remove('hidden');
  analyzeButton.disabled = false;
  buttonText.textContent = 'Analyze freshness';
  showPanel('result');
}

function clearFile() {
  selectedFile = null;
  input.value = '';
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  previewWrap.classList.add('hidden');
  dropzone.classList.remove('hidden');
  analyzeButton.disabled = true;
  buttonText.textContent = 'Analyze freshness';
  showPanel('result');
}

function showPanel(name) {
  resultContent.classList.toggle('hidden', name !== 'result');
  loadingContent.classList.toggle('hidden', name !== 'loading');
  finalContent.classList.toggle('hidden', name !== 'final');
  errorContent.classList.toggle('hidden', name !== 'error');
}

function showError(message) {
  document.getElementById('errorMessage').textContent = message;
  showPanel('error');
}

analyzeButton.addEventListener('click', async () => {
  if (!selectedFile) return;
  const data = new FormData();
  data.append('image', selectedFile);
  analyzeButton.disabled = true;
  buttonText.textContent = 'Analyzing…';
  showPanel('loading');
  try {
    const response = await fetch('/predict', { method: 'POST', body: data });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Prediction failed.');
    renderResult(result);
    showPanel('final');
  } catch (error) {
    showError(error.message || 'Could not connect to the prediction server. Is Flask running?');
  } finally {
    analyzeButton.disabled = !selectedFile;
    buttonText.textContent = 'Analyze freshness';
  }
});

function renderResult(result) {
  const label = String(result.label || 'Unknown');
  const isFresh = label.toLowerCase().includes('fresh');
  const confidence = Math.max(0, Math.min(100, Number(result.confidence) || 0));
  const badge = document.getElementById('resultLabel');
  badge.textContent = label;
  badge.classList.toggle('rotten', !isFresh);
  document.getElementById('resultEmoji').textContent = isFresh ? '🍏' : '🍎';
  document.getElementById('resultHeadline').textContent = isFresh ? 'Looks fresh!' : 'Looks rotten';
  document.getElementById('resultDescription').textContent = isFresh
    ? 'The model classified this image as fresh.'
    : 'The model classified this image as rotten.';
  document.getElementById('confidenceValue').textContent = `${confidence.toFixed(2)}%`;
  const bar = document.getElementById('confidenceBar');
  bar.style.width = `${confidence}%`;
  bar.classList.toggle('rotten', !isFresh);
}
