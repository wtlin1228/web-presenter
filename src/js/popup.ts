import type { ISlide } from './types';
import getCurrentTab from './utils/get-current-tab';

const slidesContainer = document.getElementById('slides-container');
const slidesContainerPlaceholder = document.createElement('div');
slidesContainerPlaceholder.id = 'slides-container-placeholder';
slidesContainerPlaceholder.innerText = 'No Slide. Create one first.';

function closePopup() {
  window.close();
}

function goSlide(step: number) {
  getCurrentTab().then((tab) => {
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'GO_SLIDE',
        payload: { step },
      });
    }
  });
}

function updateSlides(newSlides: ISlide[]) {
  getCurrentTab().then((tab) => {
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'UPDATE_SLIDE',
        payload: {
          slides: newSlides,
        },
      });
    }
  });
}

function showSlidesContainerPlaceholder() {
  if (
    document.getElementById('slides-container-placeholder') ||
    !slidesContainer
  ) {
    return;
  }

  slidesContainer.appendChild(slidesContainerPlaceholder);
}

function hideSlidesContainerPlaceholder() {
  const elementToRemove = document.getElementById(
    'slides-container-placeholder'
  );
  if (elementToRemove) {
    elementToRemove.remove();
  }
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

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-selector-button');
    deleteButton.innerText = 'x';
    deleteButton.onclick = () => {
      if (slideDiv) {
        slideDiv.remove();
      }

      const newSlides = slides.filter((_, i) => i !== index);
      chrome.storage.sync.set({ slides: newSlides });
      updateSlides(newSlides);
    };
    slideDiv.appendChild(deleteButton);

    slideDiv.addEventListener('click', () => goSlide(index));
    slidesContainer.appendChild(slideDiv);
  });
}

chrome.storage.sync.get(['slides'], ({ slides }) => {
  if (slides.length > 0) {
    hideSlidesContainerPlaceholder();
    createSlides(slides);
  } else {
    showSlidesContainerPlaceholder();
  }
});

document.getElementById('goto-pick')?.addEventListener('click', () => {
  getCurrentTab().then((tab) => {
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'START_ELEMENT_PICKER',
        payload: {},
      });

      closePopup();
    }
  });
});

document.getElementById('sync-slides')?.addEventListener('click', () => {
  chrome.storage.sync.get(['slides'], ({ slides }) => {
    updateSlides(slides);
  });
});

document.getElementById('clear-slides')?.addEventListener('click', () => {
  chrome.storage.sync.set({ slides: [] });
  slidesContainer?.replaceChildren();
  showSlidesContainerPlaceholder();
  getCurrentTab().then((tab) => {
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'CLEAR_SLIDES',
        payload: {},
      });
    }
  });
});
