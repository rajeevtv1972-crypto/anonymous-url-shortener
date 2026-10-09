const form = document.querySelector("#shorten-form");
const urlInput = document.querySelector("#long-url");
const expirySelect = document.querySelector("#expiry");
const customExpiry = document.querySelector("#custom-expiry");
const customDuration = document.querySelector("#custom-duration");
const customUnit = document.querySelector("#custom-unit");
const submitButton = document.querySelector("#submit-button");
const buttonLabel = submitButton.querySelector(".button-label");
const formMessage = document.querySelector("#form-message");
const resultPanel = document.querySelector("#result-panel");
const shortUrl = document.querySelector("#short-url");
const expirySummary = document.querySelector("#expiry-summary");
const copyButton = document.querySelector("#copy-button");
const shareButton = document.querySelector("#share-button");
const copyMessage = document.querySelector("#copy-message");

document.querySelector("#year").textContent = new Date().getFullYear();

function setMessage(message) {
  formMessage.textContent = message;
  formMessage.hidden = !message;
}

function selectedExpirySeconds() {
  if (expirySelect.value === "never") return null;
  if (expirySelect.value !== "custom") return Number(expirySelect.value);

  const amount = Number(customDuration.value);
  if (!Number.isInteger(amount) || amount < 1 || amount > 365) {
    throw new Error("Choose a whole number between 1 and 365 for the custom duration.");
  }
  const seconds = amount * (customUnit.value === "days" ? 86400 : 3600);
  if (seconds < 3600 || seconds > 31536000) {
    throw new Error("Custom links must last from 1 hour to 365 days.");
  }
  return seconds;
}

function readableExpiry(seconds) {
  if (seconds === null) return "No expiry";
  if (seconds % 86400 === 0) {
    const days = seconds / 86400;
    return `Expires in ${days} ${days === 1 ? "day" : "days"}`;
  }
  const hours = Math.round(seconds / 3600);
  return `Expires in ${hours} ${hours === 1 ? "hour" : "hours"}`;
}

function setBusy(isBusy) {
  submitButton.disabled = isBusy;
  buttonLabel.textContent = isBusy ? "Creating your link…" : "Create short link";
}

function fallbackCopy(text) {
  const temporary = document.createElement("textarea");
  temporary.value = text;
  temporary.setAttribute("readonly", "");
  temporary.style.position = "fixed";
  temporary.style.left = "-9999px";
  document.body.appendChild(temporary);
  temporary.select();
  const copied = document.execCommand("copy");
  temporary.remove();
  if (!copied) throw new Error("Copy was blocked by your browser. Select the link and copy it manually.");
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    fallbackCopy(text);
  }
}

expirySelect.addEventListener("change", () => {
  customExpiry.hidden = expirySelect.value !== "custom";
  if (expirySelect.value === "custom") customDuration.focus();
  setMessage("");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("");
  resultPanel.hidden = true;
  copyMessage.textContent = "";

  const enteredUrl = urlInput.value.trim();
  if (!enteredUrl) {
    setMessage("Paste a URL to get started.");
    urlInput.focus();
    return;
  }

  let expiresInSeconds;
  try {
    expiresInSeconds = selectedExpirySeconds();
  } catch (error) {
    setMessage(error.message);
    customDuration.focus();
    return;
  }

  try {
    const parsed = new URL(enteredUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Only http:// and https:// links are supported.");
    }
    if (parsed.username || parsed.password) {
      throw new Error("Remove any username or password from the URL before shortening it.");
    }
  } catch (error) {
    setMessage(error.message || "Enter a valid URL including https://.");
    urlInput.focus();
    return;
  }

  setBusy(true);
  try {
    const response = await fetch("/api/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: enteredUrl, expiresInSeconds })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "We couldn't create that link. Please try again.");
    }

    shortUrl.href = data.shortUrl;
    shortUrl.textContent = data.shortUrl;
    expirySummary.textContent = readableExpiry(expiresInSeconds);
    resultPanel.hidden = false;
    copyButton.setAttribute("aria-label", "Copy short link");
    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    setMessage(error.message || "Something went wrong. Please try again.");
  } finally {
    setBusy(false);
  }
});

copyButton.addEventListener("click", async () => {
  const value = shortUrl.href;
  try {
    await copyText(value);
    copyMessage.textContent = "Copied to clipboard.";
  } catch (error) {
    copyMessage.textContent = error.message || "Copy failed. Please copy the link manually.";
  }
});

shareButton.addEventListener("click", async () => {
  const value = shortUrl.href;
  if (navigator.share) {
    try {
      await navigator.share({ title: "A short link", url: value });
      copyMessage.textContent = "Share sheet opened.";
      return;
    } catch (error) {
      if (error && error.name === "AbortError") return;
    }
  }
  try {
    await copyText(value);
    copyMessage.textContent = "Link copied. Paste it into your message.";
  } catch (error) {
    copyMessage.textContent = error.message || "Sharing isn't available in this browser.";
  }
});