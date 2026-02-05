let scrubberObserver = null;
let chapterObserver = null;
let resizeTimeout = null;
let fullscreenTimeout = null;
let start = Date.now();

let lastFired = Date.now();

function cleanupNyanChapters() {
  // console.log("nuking everything...");
  const chapters = document.querySelectorAll('.ytp-chapter-hover-container');

  chapters.forEach(chapter => {
    if (!chapter._initialized) return;

    chapter.querySelectorAll('.nyan-layer').forEach(el => el.remove());
    chapter.classList.remove('nyan-chapter', 'nyan-first', 'nyan-last');

    delete chapter._initialized;
    delete chapter._fg;
    delete chapter._width;
    delete chapter._marginRight;
  });
}

function fillChaptersByScrubber() {
  const chapters = Array.from(
    document.querySelectorAll('.ytp-chapter-hover-container')
  );
  if (!chapters.length) return;

  if (!chapters[0]._initialized) {
    rebuildNyan();
    return;
  }

  const scrubber = document.querySelector('.ytp-scrubber-container');
  if (!scrubber) return;

  const match = scrubber.style.transform.match(/translateX\(([\d.]+)px\)/);
  if (!match) return;

  let remaining = parseFloat(match[1]);

  for (const chapter of chapters) {
    if (remaining <= 0) {
      chapter._fg.style.width = '0px';
      continue;
    }

    const fill = Math.min(chapter._width, remaining);
    chapter._fg.style.width = fill + 'px';

    remaining -= chapter._width + chapter._marginRight;
  }
}

function rebuildNyan() {
  const now = Date.now();
  if (now - lastFired < 2000) {
    return;
  }
  lastFired = now;
  
  cleanupNyanChapters();
  initializeChapters();
  fillChaptersByScrubber();
}

function initializeChapters() {
  const chapters = Array.from(
    document.querySelectorAll('.ytp-chapter-hover-container')
  );
  if (!chapters.length) return;

  const REVEALED_SRC = chrome.runtime.getURL("images/rainbow_tail.gif");
  const UNREVEALED_SRC = chrome.runtime.getURL("images/sky.gif");
  const IMAGE_HEIGHT = 16;

  chapters.forEach((chapter, index) => {
    chapter.classList.add('nyan-chapter');

    if (index === 0) chapter.classList.add('nyan-first');
    if (index === chapters.length - 1) chapter.classList.add('nyan-last');

    const bg = document.createElement('div');
    const fg = document.createElement('div');
    const bgRow = document.createElement('div');
    const fgRow = document.createElement('div');

    bg.className = 'nyan-layer';
    fg.className = 'nyan-layer';
    bgRow.className = 'nyan-row';
    fgRow.className = 'nyan-row';

    const width = chapter.clientWidth;
    const count = Math.ceil(width / IMAGE_HEIGHT);

    for (let i = 0; i < count; i++) {
      const bgImg = new Image();
      bgImg.src = UNREVEALED_SRC;
      bgImg.className = 'nyan-img';
      bgRow.appendChild(bgImg);

      const fgImg = new Image();
      fgImg.src = REVEALED_SRC;
      fgImg.className = 'nyan-img';
      fgRow.appendChild(fgImg);
    }

    bg.appendChild(bgRow);
    fg.appendChild(fgRow);
    chapter.appendChild(bg);
    chapter.appendChild(fg);

    chapter._fg = fg;
    chapter._initialized = true;
    chapter._width = chapter.clientWidth;
    const style = getComputedStyle(chapter);
    chapter._marginRight = parseFloat(style.marginRight) || 0;
  });
}

function rebindScrubberObserver() {
  if (scrubberObserver) scrubberObserver.disconnect();
  scrubberObserver = null;
  observeScrubber();
}

function observeScrubber() {
  const scrubber = document.querySelector('.ytp-scrubber-container');
  if (!scrubber) return;

  scrubberObserver = new MutationObserver(fillChaptersByScrubber);
  scrubberObserver.observe(scrubber, {
    attributes: true,
    attributeFilter: ['style']
  });
}

function startChapterObserver() {
  if (chapterObserver) chapterObserver.disconnect();

  const progressBar = document.querySelector('.ytp-progress-bar-container');
  if (!progressBar) return;

  chapterObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.addedNodes.length || m.removedNodes.length) {
        rebuildNyan();
        rebindScrubberObserver();
        break;
      }
    }
  });

  chapterObserver.observe(progressBar, {
    childList: true,
    subtree: true
  });
}

function waitForChapters(callback, interval = 50, timeout = 1500) {

  let delta = Date.now() - start;

  console.log("Time delta: " + delta);

  const check = () => {
    const chapters = document.querySelectorAll('.ytp-chapter-hover-container');
    if (chapters.length) {
      callback();
      return;
    }
    if (Date.now() - start > timeout) return;
    setTimeout(check, interval);
  };

  check();
}

function initRainbow() {
  if (location.pathname !== "/watch") return;
  start = Date.now();
  waitForChapters(() => {
    rebuildNyan();
    rebindScrubberObserver();
    startChapterObserver();
  });
}


document.addEventListener("yt-navigate-finish", initRainbow, true);
document.addEventListener("yt-page-data-updated", initRainbow, true);

let flexyResizeObserver = null;

function observeFlexyResize() {
  if (flexyResizeObserver) flexyResizeObserver.disconnect();

  const flexy = document.querySelector('ytd-watch-flexy');
  if (!flexy) return;

  flexyResizeObserver = new ResizeObserver(() => {
    clearTimeout(fullscreenTimeout);
    fullscreenTimeout = setTimeout(() => {
      rebuildNyan();
      rebindScrubberObserver();
    }, 300);
  });

  flexyResizeObserver.observe(flexy);
}

document.addEventListener("yt-navigate-finish", observeFlexyResize, true);
document.addEventListener("yt-page-data-updated", observeFlexyResize, true);
observeFlexyResize();

window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    rebuildNyan();
    rebindScrubberObserver();
  }, 200);
});

initRainbow();
