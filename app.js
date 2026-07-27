const form = document.getElementById("qr-form");
const textInput = document.getElementById("text-input");
const sizeSelect = document.getElementById("size-select");
const colorInput = document.getElementById("color-input");
const bgInput = document.getElementById("bg-input");
const logoInput = document.getElementById("logo-input");
const logoSizeField = document.getElementById("logo-size-field");
const logoSizeInput = document.getElementById("logo-size-input");
const logoSizeValue = document.getElementById("logo-size-value");
const logoPreviewRow = document.getElementById("logo-preview-row");
const logoPreview = document.getElementById("logo-preview");
const removeLogoBtn = document.getElementById("remove-logo-btn");
const outputSection = document.getElementById("output-section");
const canvas = document.getElementById("qr-canvas");
const encodedText = document.getElementById("encoded-text");
const errorMessage = document.getElementById("error-message");
const downloadBtn = document.getElementById("download-btn");
const copyBtn = document.getElementById("copy-btn");

let lastGeneratedText = "";
let logoImage = null; // HTMLImageElement, or null

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  outputSection.hidden = true;
}

function clearError() {
  errorMessage.hidden = true;
  errorMessage.textContent = "";
}

function drawLogo(ctx, size) {
  if (!logoImage) return;

  const logoPercent = Number(logoSizeInput.value) / 100;
  const logoSize = size * logoPercent;
  const x = (size - logoSize) / 2;
  const y = (size - logoSize) / 2;

  // White padded "plate" behind the logo so it reads cleanly against the QR pattern.
  const padding = logoSize * 0.16;
  const plateSize = logoSize + padding * 2;
  const plateX = (size - plateSize) / 2;
  const plateY = (size - plateSize) / 2;
  const plateRadius = plateSize * 0.18;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(plateX, plateY, plateSize, plateSize, plateRadius);
  ctx.fill();
  ctx.restore();

  ctx.drawImage(logoImage, x, y, logoSize, logoSize);
}

async function generateQRCode(text) {
  const size = Number(sizeSelect.value);
  const color = colorInput.value;
  const background = bgInput.value;

  canvas.width = size;
  canvas.height = size;

  // Use the highest error-correction level when a logo is present so the
  // QR code can tolerate the center being covered and still scan correctly.
  const errorCorrectionLevel = logoImage ? "H" : "M";

  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 2,
    color: {
      dark: color,
      light: background,
    },
    errorCorrectionLevel,
  });

  const ctx = canvas.getContext("2d");
  drawLogo(ctx, size);
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
    showError("Could not generate QR code. Try shorter text, different characters, or a smaller logo.");
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

function handleLogoChange(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      logoImage = img;
      logoPreview.src = reader.result;
      logoPreviewRow.hidden = false;
      logoSizeField.hidden = false;

      if (lastGeneratedText) {
        generateQRCode(lastGeneratedText).catch(() => {});
      }
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  logoImage = null;
  logoInput.value = "";
  logoPreviewRow.hidden = true;
  logoSizeField.hidden = true;

  if (lastGeneratedText) {
    generateQRCode(lastGeneratedText).catch(() => {});
  }
}

form.addEventListener("submit", handleGenerate);
downloadBtn.addEventListener("click", downloadPNG);
copyBtn.addEventListener("click", copyToClipboard);
logoInput.addEventListener("change", handleLogoChange);
removeLogoBtn.addEventListener("click", removeLogo);

logoSizeInput.addEventListener("input", () => {
  logoSizeValue.textContent = logoSizeInput.value;
  if (lastGeneratedText) {
    generateQRCode(lastGeneratedText).catch(() => {});
  }
});

[sizeSelect, colorInput, bgInput].forEach((el) => {
  el.addEventListener("change", () => {
    if (lastGeneratedText) {
      generateQRCode(lastGeneratedText).catch(() => {});
    }
  });
});
