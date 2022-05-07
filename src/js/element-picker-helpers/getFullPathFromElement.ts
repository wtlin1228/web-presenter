const safeQuerySelectorAll = function (node: HTMLElement, selector: string) {
  if (node !== null) {
    try {
      return node.querySelectorAll(selector);
    } catch (e) {
      console.error(e);
    }
  }
  return [];
};

const cosmeticFilterFromElement = function (elem: HTMLElement) {
  if (elem === null) {
    return 0;
  }
  if (elem.nodeType !== 1) {
    return 0;
  }

  let selector = '';

  // Id
  let v = typeof elem.id === 'string' && CSS.escape(elem.id);
  if (v) {
    selector = '#' + v;
  }

  // Class(es)
  if (elem.classList) {
    let i = elem.classList.length || 0;
    while (i--) {
      const item = elem.classList.item(i);
      if (item !== null) {
        selector += '.' + CSS.escape(item);
      }
    }
  }

  // Tag name
  const tagName = CSS.escape(elem.localName);

  // Use attributes if still no selector found.
  if (selector === '') {
    const attributes = [];

    switch (tagName) {
      case 'a':
        let href = elem.getAttribute('href');
        if (href) {
          href = href.trim().replace(/\?.*$/, '');
          if (href.length) {
            attributes.push({ k: 'href', v: href });
          }
        }
        break;
      case 'iframe':
      case 'img':
        let src = elem.getAttribute('src');
        if (src && src.length !== 0) {
          src = src.trim();
          if (src.startsWith('data:')) {
            let pos = src.indexOf(',');
            if (pos !== -1) {
              src = src.slice(0, pos + 1);
            }
          } else if (src.startsWith('blob:')) {
            const url = new URL(src.slice(5));
            url.pathname = '';
            src = 'blob:' + url.href;
          }
          attributes.push({ k: 'src', v: src.slice(0, 256) });
          break;
        }
        const alt = elem.getAttribute('alt');
        if (alt && alt.length !== 0) {
          attributes.push({ k: 'alt', v: alt });
          break;
        }
        break;
      default:
        break;
    }

    let attr;
    while ((attr = attributes.pop())) {
      if (attr.v.length === 0) {
        continue;
      }

      const elemAttr = elem.getAttribute(attr.k);
      if (elemAttr === null) {
        continue;
      }

      const w = attr.v.replace(/([^\\])"/g, '$1\\"');
      if (attr.v === elemAttr) {
        selector += `[${attr.k}="${w}"]`;
      } else if (elemAttr.startsWith(attr.v)) {
        selector += `[${attr.k}^="${w}"]`;
      } else {
        selector += `[${attr.k}*="${w}"]`;
      }
    }
  }

  // https://github.com/uBlockOrigin/uBlock-issues/issues/17
  //   If selector is ambiguous at this point, add the element name to
  //   further narrow it down.
  const parentNode = elem.parentNode as HTMLElement;
  if (parentNode !== null) {
    if (
      selector === '' ||
      safeQuerySelectorAll(parentNode, `:scope > ${selector}`).length > 1
    ) {
      selector = tagName + selector;
    }

    // https://github.com/chrisaljoudi/uBlock/issues/637
    //   If the selector is still ambiguous at this point, further narrow using
    //   `nth-of-type`. It is preferable to use `nth-of-type` as opposed to
    //   `nth-child`, as `nth-of-type` is less volatile.
    if (safeQuerySelectorAll(parentNode, `:scope > ${selector}`).length > 1) {
      let i = 1;
      while (elem.previousSibling !== null) {
        elem = elem.previousSibling as HTMLElement;
        if (typeof elem.localName === 'string' && elem.localName === tagName) {
          i++;
        }
      }
      selector += `:nth-of-type(${i})`;
    }
  }

  return selector;
};

const getFullPathFromElement = function (elem: HTMLElement) {
  const path = [];

  while (true) {
    if (elem === document.body) {
      break;
    }

    const selector = cosmeticFilterFromElement(elem);

    if (selector) {
      path.push({
        element: elem,
        selector,
      });
    }

    if (elem.parentNode === null) {
      break;
    }

    elem = elem.parentNode as HTMLElement;
  }

  if (path.length !== 0) {
    const selector = path[path.length - 1].selector.slice(2);
    if (safeQuerySelectorAll(document.body, selector).length > 1) {
      path.push({
        element: document.body,
        selector: 'body',
      });
    }
  }

  return path;
};

export default getFullPathFromElement;
