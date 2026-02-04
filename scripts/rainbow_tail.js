function fillChaptersByScrubber() {
  const chapters = Array.from(
    document.querySelectorAll('.ytp-chapter-hover-container')
  );
  if (!chapters.length) return;

  const REVEALED_SRC = chrome.runtime.getURL("images/rainbow_tail.gif");
  const UNREVEALED_SRC = chrome.runtime.getURL("images/sky.gif");
  const IMAGE_HEIGHT = 16;

  chapters.forEach((chapter, index) => {
    if (!chapter._initialized) {
      chapter.classList.add('nyan-chapter');

      const isFirst = index === 0;
      const isLast = index === chapters.length - 1;

      const bg = document.createElement('div');
      const fg = document.createElement('div');
      const bgRow = document.createElement('div');
      const fgRow = document.createElement('div');

      if (isFirst) chapter.classList.add('nyan-first');
      if (isLast) chapter.classList.add('nyan-last');

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
    }

    chapter._width = chapter.clientWidth;
    const style = getComputedStyle(chapter);
    chapter._marginRight = parseFloat(style.marginRight) || 0;
  });

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
    chapter._fg.style.zIndex = '10';
    chapter._fg.style.display = 'flex';

    remaining -= chapter._width + chapter._marginRight;
  }
}

function observeScrubber() {
  const scrubber = document.querySelector('.ytp-scrubber-container');
  if (!scrubber) return;

  const observer = new MutationObserver(() => {
    fillChaptersByScrubber();
  });


  observer.observe(scrubber, {
    attributes: true,
    attributeFilter: ['style']
  });
}


const chapterObserver = new MutationObserver(() => {
  const chapters = document.querySelectorAll('.ytp-chapter-hover-container');
  if (chapters.length) {
    fillChaptersByScrubber();
    observeScrubber();
    chapterObserver.disconnect();
  }
});

chapterObserver.observe(document.body, {
  childList: true,
  subtree: true
});
