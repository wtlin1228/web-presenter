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

const createPickerElement = () => {
  const picker = document.createElement('div');

  picker.style.background = '#2c3453';
  picker.style.padding = '6px';
  picker.style.position = 'fixed';
  picker.style.width = '300px';
  picker.style.height = '160px';
  picker.style.top = '20px';
  picker.style.right = '20px';
  picker.style.zIndex = '200000';

  return picker;
};

const createElementSpecificityInput = () => {
  const input = document.createElement('input');

  input.type = 'range';
  input.min = '0';
  input.max = '30';

  input.style.width = '100%';
  input.style.display = 'inline-block';
  input.style.accentColor = '#5e9eff';

  return input;
};

const createDisplayNameInput = () => {
  const input = document.createElement('input');

  input.type = 'text';
  input.placeholder = 'Name your slide';

  input.style.width = '100%';
  input.style.display = 'inline-block';
  input.style.backgroundColor = 'white';
  input.style.color = 'black';
  input.style.padding = '1px 8px';
  input.style.cursor = 'text';
  input.style.fontSize = '16px';
  input.style.fontWeight = '500';
  input.style.lineHeight = '24px';
  input.style.borderRadius = '0';

  return input;
};

const createElementPickerButton = () => {
  const button = document.createElement('button');

  button.style.padding = '6px 12px';
  button.style.borderRadius = '8px';
  button.style.fontSize = '16px';
  button.style.fontWeight = '600';
  button.style.color = '#183153';
  button.style.background = 'white';
  button.style.lineHeight = '24px';
  button.style.marginInlineStart = '4px';
  button.style.cursor = 'pointer';

  return button;
};

const createPickButton = () => {
  const button = createElementPickerButton();

  button.innerText = 'Pick';
  button.onclick = () => {
    inspecting = true;
  };

  return button;
};

const createCreateButton = (displayNameInput: HTMLInputElement) => {
  const button = createElementPickerButton();

  button.innerText = 'Create';
  button.onclick = () => {
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

      displayNameInput.value = '';
    }
  };

  return button;
};

const createQuitButton = () => {
  const button = createElementPickerButton();

  button.innerText = 'Quit';
  button.onclick = () => {
    destroyPicker();
  };

  return button;
};

const createPicker = () => {
  // control the specificity of picked element
  elementSpecificityInput = createElementSpecificityInput();

  // display name of slide
  const displayNameInput = createDisplayNameInput();

  // action buttons
  const pickButton = createPickButton();
  const createButton = createCreateButton(displayNameInput);
  const quitButton = createQuitButton();

  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.marginBlockStart = '12px';
  buttonsContainer.appendChild(pickButton);
  buttonsContainer.appendChild(createButton);
  buttonsContainer.appendChild(quitButton);

  // picker itself
  picker = createPickerElement();
  picker.appendChild(elementSpecificityInput);
  picker.appendChild(displayNameInput);
  picker.appendChild(buttonsContainer);

  document.body.appendChild(picker);
};

const destroyPicker = () => {
  inspecting = false;
  hideOverlay();

  if (picker !== null) {
    picker.remove();
    picker = null;
  }
};

const handleInputChange = (e: Event) => {
  // @ts-expect-error
  const index = e.target.value;

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

    case 'CLEAR_SLIDES':
      webPresenter.clearSlides();

    default:
      return;
  }
});
