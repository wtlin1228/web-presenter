import type { ISlide } from './types';
import getCurrentTab from './utils/get-current-tab';

const slidesContainer = document.getElementById('slides-container');

function handleSelectorClick(e: MouseEvent) {
  let step = (e.target as HTMLElement).dataset.step;

  getCurrentTab().then((tab) => {
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'GO_SLIDE',
        payload: { step },
      });
    }
  });
}

function createSlides(slides: ISlide[]) {
  if (slidesContainer === null) {
    return;
  }

  slides.forEach(({ querySelector, displayName }, index) => {
    const slideDiv = document.createElement('div');
    slideDiv.dataset.step = String(index);
    slideDiv.classList.add('selector');

    const indexText = document.createElement('p');
    indexText.innerText = String(index + 1);
    slideDiv.appendChild(indexText);

    const nameText = document.createElement('p');
    nameText.classList.add('selector-name');
    nameText.innerText = displayName;
    slideDiv.appendChild(nameText);

    slideDiv.addEventListener('click', handleSelectorClick);
    slidesContainer.appendChild(slideDiv);
  });
}

chrome.storage.sync.get(['slides'], ({ slides }) => {
  createSlides(slides);
});

document.getElementById('goto-pick')?.addEventListener('click', () => {
  getCurrentTab().then((tab) => {
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'START_ELEMENT_PICKER',
        payload: {},
      });
    }
  });
});

document.getElementById('sync-slides')?.addEventListener('click', () => {
  chrome.storage.sync.get(['slides'], ({ slides }) => {
    getCurrentTab().then((tab) => {
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'UPDATE_SLIDE',
          payload: {
            slides,
          },
        });
      }
    });
  });
});
