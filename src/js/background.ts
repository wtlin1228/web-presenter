import type { IMessageRequest, ISlide } from './types';

chrome.storage.sync.get('slides', ({ slides }) => {
  if (!slides) {
    chrome.storage.sync.set({ slides: [] });
  }
});

const createSlide = (slide: ISlide) => {
  chrome.storage.sync.get('slides', ({ slides }) => {
    slides.push(slide);
    chrome.storage.sync.set({ slides });
  });
};

chrome.runtime.onMessage.addListener(function (
  request: IMessageRequest,
  sender,
  sendResponse
) {
  switch (request.type) {
    case 'CREATE_SLIDE':
      createSlide(request.payload as ISlide);
      break;

    default:
  }

  // Fix Chrome: "The message port closed before a response was received."
  // See: https://github.com/mozilla/webextension-polyfill/issues/130
  sendResponse({});
  return true;
});
