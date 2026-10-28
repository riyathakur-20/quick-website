
const photoInput = document.getElementById("photoInput");
const uploadStatus = document.getElementById("uploadStatus");
const photoFrames = document.getElementById("photoFrames");
const strip = document.getElementById("strip");
const captionInput = document.getElementById("captionInput");
const previewCaption = document.getElementById("previewCaption");
const previewDate = document.getElementById("previewDate");
const dateToggle = document.getElementById("dateToggle");
const layoutSelect = document.getElementById("layoutSelect");
const filterSelect = document.getElementById("filterSelect");
const downloadButton = document.getElementById("downloadButton");
const resetButton = document.getElementById("resetButton");
const toast = document.getElementById("toast");

let photos = [];
let currentTheme = "coquette";
let frameColor = "#fff8f2";
let toastTimer;

const themes = {
  coquette: {
    background: "#fff8f2",
    ink: "#57434b",
    placeholder: "#f4e5e9",
    placeholderInk: "#c28ba0",
    decoration: "♡"
  },
  korean: {
    background: "#f7f3eb",
    ink: "#574d43",
    placeholder: "#ece6dd",
    placeholderInk: "#988878",
    decoration: "✳"
  },
  y2k: {
    background: "#e7e2fa",
    ink: "#64558f",
    placeholder: "#e5e0f9",
    placeholderInk: "#8474bb",
    decoration: "✦"
  },
  vintage: {
    background: "#e9d8bb",
    ink: "#6b5035",
    placeholder: "#e8d6b9",
    placeholderInk: "#947451",
    decoration: "♡"
  },
  noir: {
    background: "#252323",
    ink: "#ffffff",
    placeholder: "#363234",
    placeholderInk: "#e2d5d8",
    decoration: "✦"
  }
};

const filters = {
  normal: "none",
  soft: "brightness(1.07) saturate(.82)",
  warm: "sepia(.22) saturate(1.15) contrast(.96)",
  mono: "grayscale(1)",
  fade: "sepia(.25) saturate(.72) brightness(1.06) contrast(.84)"
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function getToday() {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, "0")}/${String(
    now.getDate()
  ).padStart(2, "0")}/${String(now.getFullYear()).slice(-2)}`;
}

function getVisiblePhotos() {
  return photos.slice(0, Number(layoutSelect.value));
}

function updateTheme() {
  strip.className = `strip theme-${currentTheme}`;

  document.querySelectorAll(".theme-card").forEach(button => {
    const selected = button.dataset.theme === currentTheme;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  renderPreview();
}

function updateFrameColor() {
  strip.style.backgroundColor = frameColor;

  document.querySelectorAll(".color-dot").forEach(button => {
    const selected = button.dataset.color === frameColor;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function updateCaption() {
  previewCaption.textContent =
    captionInput.value.trim() || "little moments, big feelings ♡";
}

function updateDate() {
  previewDate.textContent = dateToggle.checked ? getToday() : "";
}

function renderPreview() {
  const visiblePhotos = getVisiblePhotos();
  const frameCount = Number(layoutSelect.value);
  const theme = themes[currentTheme];

  photoFrames.replaceChildren();
  photoFrames.style.gap = currentTheme === "noir" ? "5px" : "7px";

  for (let i = 0; i < frameCount; i++) {
    const frame = document.createElement("div");
    frame.className = "photo-frame";

    if (visiblePhotos[i]) {
      const img = document.createElement("img");
      img.src = visiblePhotos[i].url;
      img.alt = `Photo ${i + 1}`;

      img.style.setProperty(
        "--photo-filter",
        filters[filterSelect.value]
      );

      frame.appendChild(img);
    } else {
      frame.classList.add("placeholder");
      frame.style.backgroundColor = theme.placeholder;
      frame.style.color = theme.placeholderInk;

      const symbol = document.createElement("span");
      symbol.textContent = theme.decoration;

      const text = document.createElement("p");
      text.textContent = "your moment";

      frame.append(symbol, text);
    }

    photoFrames.appendChild(frame);
  }

  strip.style.color = theme.ink;
  updateFrameColor();
  updateCaption();
  updateDate();

  uploadStatus.textContent = photos.length
    ? `${photos.length} photo${photos.length === 1 ? "" : "s"} selected · ${
        visiblePhotos.length
      } shown in your strip`
    : "No photos selected yet.";
}

// Upload photos from your device.
photoInput.addEventListener("change", () => {
  const files = Array.from(photoInput.files || []);

  if (!files.length) return;

  const imageFiles = files.filter(file =>
    file.type.startsWith("image/")
  );

  if (imageFiles.length !== files.length) {
    showToast("Some files were skipped because they aren't images.");
  }

  if (imageFiles.length > 4) {
    showToast("Choose up to 4 photos. The first 4 will be used.");
  }

  const selectedFiles = imageFiles.slice(0, 4);

  if (!selectedFiles.length) {
    photoInput.value = "";
    return;
  }

  photos.forEach(photo => URL.revokeObjectURL(photo.url));

  photos = selectedFiles.map(file => ({
    file,
    url: URL.createObjectURL(file)
  }));

  renderPreview();
  showToast("Photos added! Your strip is ready ♡");
});

// Switch between themes.
document.querySelectorAll(".theme-card").forEach(button => {
  button.addEventListener("click", () => {
    currentTheme = button.dataset.theme;
    updateTheme();
  });
});

// Change the frame color.
document.querySelectorAll(".color-dot").forEach(button => {
  button.addEventListener("click", () => {
    frameColor = button.dataset.color;
    updateFrameColor();
  });
});

layoutSelect.addEventListener("change", renderPreview);
filterSelect.addEventListener("change", renderPreview);
captionInput.addEventListener("input", updateCaption);
dateToggle.addEventListener("change", updateDate);

// Create a high-resolution PNG using Canvas.
async function createStripCanvas() {
  const selectedPhotos = getVisiblePhotos();

  if (!selectedPhotos.length) {
    throw new Error("Please upload at least one photo first.");
  }

  const width = 900;
  const padding = 38;
  const photoWidth = width - padding * 2;
  const photoHeight = Math.round(photoWidth / 1.39);
  const gap = 22;
  const topHeight = 92;
  const bottomHeight = 100;
  const count = Number(layoutSelect.value);

  const height =
    topHeight +
    count * photoHeight +
    (count - 1) * gap +
    bottomHeight +
    padding;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Your browser could not create the image.");
  }

  const theme = themes[currentTheme];

  ctx.fillStyle = frameColor;
  ctx.fillRect(0, 0, width, height);

  if (currentTheme === "y2k") {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#e7e2fa");
    gradient.addColorStop(0.55, frameColor);
    gradient.addColorStop(1, "#f5d5e9");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // Header.
  ctx.fillStyle = theme.ink;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = "bold 25px Arial";
  ctx.fillText("snapstrip ✳", padding, 43);

  ctx.textAlign = "right";
  ctx.font = "15px Arial";
  ctx.fillText("VOL. 001", width - padding, 43);

  // Photo frames.
  for (let i = 0; i < count; i++) {
    const x = padding;
    const y = topHeight + i * (photoHeight + gap);

    ctx.fillStyle = theme.placeholder;
    ctx.fillRect(x, y, photoWidth, photoHeight);

    if (selectedPhotos[i]) {
      const img = new Image();
      img.src = selectedPhotos[i].url;

      await new Promise((resolve, reject) => {
        if (img.complete && img.naturalWidth) {
          resolve();
        } else {
          img.onload = resolve;
          img.onerror = () => reject(
            new Error("A photo could not be loaded.")
          );
        }
      });

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, photoWidth, photoHeight);
      ctx.clip();

      // Crop to fill the frame without stretching the photo.
      const scale = Math.max(
        photoWidth / img.naturalWidth,
        photoHeight / img.naturalHeight
      );

      const drawWidth = img.naturalWidth * scale;
      const drawHeight = img.naturalHeight * scale;
      const drawX = x + (photoWidth - drawWidth) / 2;
      const drawY = y + (photoHeight - drawHeight) / 2;

      ctx.filter = filters[filterSelect.value];
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();
    } else {
      ctx.fillStyle = theme.placeholderInk;
      ctx.textAlign = "center";
      ctx.font = "42px Georgia";
      ctx.fillText(theme.decoration, width / 2, y + photoHeight / 2 - 10);

      ctx.font = "20px Arial";
      ctx.fillText("your moment", width / 2, y + photoHeight / 2 + 35);
    }
  }

  // Caption and date.
  const footerY =
    topHeight + count * photoHeight + (count - 1) * gap + 45;

  ctx.fillStyle = theme.ink;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "italic 25px Georgia";

  const caption =
    captionInput.value.trim() || "little moments, big feelings ♡";

  let displayCaption = caption;

  while (
    ctx.measureText(displayCaption).width > photoWidth * 0.68 &&
    displayCaption.length > 4
  ) {
    displayCaption = displayCaption.slice(0, -2) + "…";
  }

  ctx.fillText(displayCaption, padding, footerY);

  if (dateToggle.checked) {
    ctx.textAlign = "right";
    ctx.font = "17px Arial";
    ctx.fillText(getToday(), width - padding, footerY);
  }

  return canvas;
}

// Download the finished photo strip.
downloadButton.addEventListener("click", async () => {
  downloadButton.disabled = true;
  downloadButton.textContent = "Creating your strip…";

  try {
    const canvas = await createStripCanvas();

    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!blob) {
      throw new Error("Could not export the image. Please try again.");
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "snapstrip-photo-strip.png";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showToast("Your photo strip has been downloaded! ♡");
  } catch (error) {
    showToast(error.message || "Something went wrong. Try again.");
  } finally {
    downloadButton.disabled = false;
    downloadButton.innerHTML =
      'Download my photo strip <span>↗</span>';
  }
});

// Reset the studio.
resetButton.addEventListener("click", () => {
  photos.forEach(photo => URL.revokeObjectURL(photo.url));
  photos = [];

  photoInput.value = "";
  captionInput.value = "";
  layoutSelect.value = "4";
  filterSelect.value = "normal";
  dateToggle.checked = true;

  currentTheme = "coquette";
  frameColor = "#fff8f2";

  updateTheme();
  renderPreview();

  showToast("Fresh start! Make a new little memory ♡");
});

// Start the website.
document.getElementById("year").textContent =
  new Date().getFullYear();

updateTheme();
renderPreview();
