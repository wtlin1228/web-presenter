import type { IMessageRequest } from '../types';

import { getFullPathFromElement } from '../element-picker-helpers';
import { hideOverlay, showOverlay } from '../highlighter';
import { WebPresenter } from '../web-presenter';

/************************************************************/
/*********              Element Picker              *********/
/************************************************************/

let inspecting = true;
let candidates: string[] = [];

let picker: HTMLDivElement | null;
let elementSpecificityInput: HTMLInputElement | null;

const createPicker = () => {
  picker = document.createElement('div');

  picker.style.position = 'fixed';
  picker.style.width = '300px';
  picker.style.height = '160px';
  picker.style.top = '20px';
  picker.style.right = '20px';
  picker.style.background = 'white';
  picker.style.zIndex = '200000';

  elementSpecificityInput = document.createElement('input');
  elementSpecificityInput.type = 'range';
  elementSpecificityInput.min = '0';
  elementSpecificityInput.max = '30';

  const displayNameInput = document.createElement('input');

  const pickButton = document.createElement('button');
  pickButton.innerText = 'Pick';
  pickButton.onclick = () => {
    inspecting = true;
  };

  const createButton = document.createElement('button');
  createButton.innerText = 'Create';
  createButton.onclick = () => {
    hideOverlay();

    if (elementSpecificityInput) {
      const querySelector = candidates[Number(elementSpecificityInput.value)];
      chrome.runtime.sendMessage({
        type: 'CREATE_SLIDE',
        payload: {
          querySelector,
          displayName: displayNameInput.value,
        },
      });

      webPresenter.addSlide({
        querySelector,
        shortcut: '',
      });
    }
  };

  const quitButton = document.createElement('button');
  quitButton.innerText = 'Quit';
  quitButton.onclick = () => {
    destroyPicker();
  };

  const displayNameContainer = document.createElement('div');
  displayNameContainer.appendChild(displayNameInput);

  const buttonsContainer = document.createElement('div');
  buttonsContainer.appendChild(pickButton);
  buttonsContainer.appendChild(createButton);
  buttonsContainer.appendChild(quitButton);

  picker.appendChild(elementSpecificityInput);
  picker.appendChild(displayNameContainer);
  picker.appendChild(buttonsContainer);
  document.body.appendChild(picker);
};

const destroyPicker = () => {
  if (picker !== null) {
    picker.remove();
    picker = null;
  }
};

const handleInputChange = (e: Event) => {
  // @ts-expect-error
  const index = e.target.value;

  console.log(index, candidates[index]);

  const elementToHighlight = document.querySelector(candidates[index]);
  if (elementToHighlight) {
    showOverlay([elementToHighlight as HTMLElement], null);
  }
};

const onClick = (event: MouseEvent) => {
  if (inspecting === false) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  inspecting = false;

  if (event.target) {
    const filters = getFullPathFromElement(event.target as HTMLElement);

    candidates = filters.reverse().reduce((acc: string[], curr) => {
      const { selector } = curr;
      if (acc.length === 0) {
        acc.push(selector);
      } else {
        acc.push(acc[acc.length - 1] + ' ' + selector);
      }
      return acc;
    }, []);

    if (elementSpecificityInput) {
      elementSpecificityInput.max = `${candidates.length - 1}`;
    }
  }
};

const onMouseMove = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();

  if (!inspecting) {
    return;
  }

  const { target } = event;

  if (!target) {
    return;
  }

  showOverlay([target as HTMLElement], null);
};

function startElementPicker() {
  createPicker();

  if (elementSpecificityInput) {
    elementSpecificityInput.addEventListener('input', handleInputChange);
  }

  window.addEventListener('click', onClick, true);
  window.addEventListener('mouseover', onMouseMove, true);
}

function stopElementPicker() {
  if (elementSpecificityInput) {
    elementSpecificityInput.removeEventListener('input', handleInputChange);
  }
  window.removeEventListener('click', onClick, true);
  window.removeEventListener('mouseover', onMouseMove, true);

  destroyPicker();
}

/************************************************************/
/*********              Web Presenter               *********/
/************************************************************/

let webPresenter: WebPresenter;
chrome.storage.sync.get(['slides'], ({ slides }) => {
  webPresenter = new WebPresenter(slides);
});

/************************************************************/
/*********                 Messaging                *********/
/************************************************************/

chrome.runtime.onMessage.addListener(function (
  request: IMessageRequest,
  sender,
  sendResponse
) {
  switch (request.type) {
    case 'START_ELEMENT_PICKER':
      startElementPicker();
      return;

    case 'STOP_ELEMENT_PICKER':
      stopElementPicker();
      return;

    case 'GO_SLIDE':
      webPresenter.goStep(request.payload.step);
      return;

    case 'UPDATE_SLIDE':
      webPresenter.updateSlides(request.payload.slides);
      return;

    default:
      return;
  }
});
