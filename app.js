const form = document.getElementById("qr-form");
const textInput = document.getElementById("text-input");
const sizeSelect = document.getElementById("size-select");
const colorInput = document.getElementById("color-input");
const bgInput = document.getElementById("bg-input");
const outputSection = document.getElementById("output-section");
const canvas = document.getElementById("qr-canvas");
const encodedText = document.getElementById("encoded-text");
const errorMessage = document.getElementById("error-message");
const downloadBtn = document.getElementById("download-btn");
const copyBtn = document.getElementById("copy-btn");

let lastGeneratedText = "";

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  outputSection.hidden = true;
}

function clearError() {
  errorMessage.hidden = true;
  errorMessage.textContent = "";
}

async function generateQRCode(text) {
  const size = Number(sizeSelect.value);
  const color = colorInput.value;
  const background = bgInput.value;

  canvas.width = size;
  canvas.height = size;

  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 2,
    color: {
      dark: color,
      light: background,
    },
    errorCorrectionLevel: "M",
  });
}

function truncateText(text, maxLength = 120) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

async function handleGenerate(event) {
  event.preventDefault();
  clearError();

  const text = textInput.value.trim();

  if (!text) {
    showError("Please enter some text or a URL to encode.");
    textInput.focus();
    return;
  }

  try {
    await generateQRCode(text);
    lastGeneratedText = text;
    encodedText.textContent = truncateText(text);
    outputSection.hidden = false;
  } catch (err) {
    showError("Could not generate QR code. Try shorter text or different characters.");
    console.error(err);
  }
}

function downloadPNG() {
  if (!lastGeneratedText) return;

  const link = document.createElement("a");
  link.download = "qrcode.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function copyToClipboard() {
  if (!lastGeneratedText) return;

  try {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy to clipboard";
    }, 2000);
  } catch {
    showError("Copy failed. Try downloading the image instead.");
  }
}

form.addEventListener("submit", handleGenerate);
downloadBtn.addEventListener("click", downloadPNG);
copyBtn.addEventListener("click", copyToClipboard);

[sizeSelect, colorInput, bgInput].forEach((el) => {
  el.addEventListener("change", () => {
    if (lastGeneratedText) {
      generateQRCode(lastGeneratedText).catch(() => {});
    }
  });
});
