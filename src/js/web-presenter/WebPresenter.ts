import type { ISlide } from './types';

const OFFSET = 2;

export default class WebPresenter {
  private step: number;
  private slides: ISlide[];
  private frame: HTMLDivElement;

  constructor(slides: ISlide[]) {
    this.step = 0;
    this.slides = slides;
    this.frame = this.createFrame();
    this.initializeKeyboardShortcuts();
  }

  private initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (!e.ctrlKey) {
        return;
      }

      e.preventDefault();
      const key = e.key.toLowerCase();

      if (key === 'p') {
        this.toggleFrame();
        return;
      }

      // "Next"
      if (key === '.') {
        this.nextStep();
        return;
      }

      // "Previous"
      if (key === ',') {
        this.previousStep();
        return;
      }

      const index = this.slides
        .map(({ shortcut }) => shortcut)
        .findIndex((shortcut) => shortcut === key);

      if (index !== -1) {
        this.showFrame();
        this.step = index;
        this.navigateToCurrentStep();
      }
    });
  }

  /************************************************************/
  /*********                    Frame                 *********/
  /************************************************************/

  private createFrame() {
    const frame = document.createElement('div');

    frame.style.display = 'none';
    frame.style.zIndex = '1024';
    frame.style.inset = '0px';
    frame.style.position = 'fixed';
    frame.style.background = 'rgba(0, 0, 0, 0.6)';
    frame.style.transition = 'clip-path 0.5s';

    document.body.appendChild(frame);
    frame.addEventListener('click', () => {
      this.hideFrame();
    });

    return frame;
  }

  private removeFrame() {
    this.frame.remove();
  }

  private showFrame() {
    if (this.frame.style.display === 'none') {
      this.frame.style.display = '';
    }
  }

  private hideFrame() {
    if (this.frame.style.display !== 'none') {
      this.frame.style.display = 'none';
    }
  }

  private toggleFrame() {
    if (this.frame.style.display === 'none') {
      this.showFrame();
    } else {
      this.hideFrame();
    }
  }

  /************************************************************/
  /*********                   Slides                 *********/
  /************************************************************/
  public updateSlides(slides: ISlide[]) {
    this.step = 0;
    this.slides = slides;
  }

  public addSlide(slide: ISlide) {
    this.slides.push(slide);
  }

  public removeSlide(indexToRemove: number) {
    if (indexToRemove < 0 || indexToRemove > this.slides.length - 1) {
      return;
    }

    this.slides = this.slides.filter((_, index) => index !== indexToRemove);
  }

  public clearSlides() {
    this.step = 0;
    this.slides = [];
    this.hideFrame();
  }

  /************************************************************/
  /*********                 Navigation               *********/
  /************************************************************/

  public navigateToCurrentStep() {
    const target = document.querySelector(this.slides[this.step].querySelector);
    if (target) {
      this.frame.style.clipPath = WebPresenter.getClipPath(target);
    }
  }

  public nextStep() {
    if (this.step + 1 < this.slides.length) {
      this.step += 1;
    }

    this.showFrame();
    this.navigateToCurrentStep();
    return this.step;
  }

  public previousStep() {
    if (this.step !== 0) {
      this.step -= 1;
    }

    this.showFrame();
    this.navigateToCurrentStep();
    return this.step;
  }

  public goStep(step: number) {
    if (0 <= step && step < this.slides.length) {
      this.step = step;
    }

    this.showFrame();
    this.navigateToCurrentStep();
    return this.step;
  }

  /************************************************************/
  /*********                   Helpers                *********/
  /************************************************************/

  static getClipPath(targetElement: Element) {
    const bound = targetElement.getBoundingClientRect();
    let { top, right, bottom, left } = bound;

    const topWithOffset = top - OFFSET + 'px';
    const rightWithOffset = right + OFFSET + 'px';
    const bottomWithOffset = bottom + OFFSET + 'px';
    const leftWithOffset = left - OFFSET + 'px';

    const leftTop = '0% 0%';
    const leftBottom = '0% 100%';
    const rightTop = '100% 0%';
    const rightBottom = '100% 100%';

    const points = [
      `${leftTop}`,
      `${leftBottom}`,
      `${leftWithOffset} 100%`,
      `${leftWithOffset} ${topWithOffset}`,
      `${rightWithOffset} ${topWithOffset}`,
      `${rightWithOffset} ${bottomWithOffset}`,
      `${leftWithOffset} ${bottomWithOffset}`,
      `${leftWithOffset} 100%`,
      `${rightBottom}`,
      `${rightTop}`,
    ].join(',');

    return `polygon(${points})`;
  }
}
