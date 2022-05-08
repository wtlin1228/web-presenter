import { getFullPathFromElement } from '../js/element-picker-helpers';
import { hideOverlay, showOverlay } from '../js/highlighter';
import { WebPresenter } from '../js/web-presenter';

const webPresenter = new WebPresenter([]);
let inspecting = true;
let candidates: string[] = [];

const picker = document.createElement('div');

picker.style.position = 'fixed';
picker.style.width = '300px';
picker.style.height = '160px';
picker.style.top = '20px';
picker.style.right = '20px';
picker.style.background = 'white';
picker.style.zIndex = '200000';

const elementSpecificityInput = document.createElement('input');
elementSpecificityInput.type = 'range';
elementSpecificityInput.min = '0';
elementSpecificityInput.max = '30';

const pickButton = document.createElement('button');
pickButton.innerText = 'Pick';
pickButton.onclick = () => {
  inspecting = true;
};

const createButton = document.createElement('button');
createButton.innerText = 'Create';
createButton.onclick = () => {
  hideOverlay();
  webPresenter.addSlide({
    querySelector: candidates[Number(elementSpecificityInput.value)],
    shortcut: '',
  });
};

const buttonsContainer = document.createElement('div');
buttonsContainer.appendChild(pickButton);
buttonsContainer.appendChild(createButton);

picker.appendChild(elementSpecificityInput);
picker.appendChild(buttonsContainer);
document.body.appendChild(picker);

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

    const handleInputChange = (e: Event) => {
      // @ts-expect-error
      const index = e.target.value;

      console.log(index, candidates[index]);

      const elementToHighlight = document.querySelector(candidates[index]);
      if (elementToHighlight) {
        showOverlay([elementToHighlight as HTMLElement], null);
      }
    };

    elementSpecificityInput.removeEventListener('input', handleInputChange);

    elementSpecificityInput.max = `${candidates.length - 1}`;
    elementSpecificityInput.addEventListener('input', handleInputChange);
  }

  //   return result;
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

window.addEventListener('click', onClick, true);
window.addEventListener('mouseover', onMouseMove, true);
