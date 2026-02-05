const NYAN_URL = chrome.runtime.getURL("images/nyancat.gif");

function addNyan(scrubber) {
    if (!scrubber || scrubber.querySelector("img.nyancat")) return;

    const img = document.createElement("img");
    img.src = NYAN_URL;
    img.className = "nyancat";
    img.style.transform = "rotate(-45deg) translate(-16px, 24px)";
    img.style.pointerEvents = "none";

    scrubber.appendChild(img);
}

function initNyan() {
  if (location.pathname !== "/watch") return;
  addNyan(document.querySelector(".ytp-scrubber-pull-indicator"));
}

document.addEventListener("yt-navigate-finish", initNyan, true);
initNyan();