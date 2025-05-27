export class Logger {
  private debugElement: HTMLElement | null;

  constructor(debugElement: HTMLElement | null) {
    this.debugElement = debugElement;
  }

  log(...args: unknown[] | string[]) {
    if (this.debugElement) {
      this.debugElement.innerHTML += `<p>${args
        .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : (arg as string)))
        .join(' ')}</p>`;
    }
    console.log(...args);
  }

  time(label: string) {
    if (this.debugElement) {
      performance.mark(label);
      this.debugElement.innerHTML += `<p>${label} started</p>`;
    }
    console.time(label);
  }

  timeEnd(label: string) {
    if (this.debugElement) {
      performance.measure(label);
      const measure = performance.getEntriesByName(label)[0];
      performance.clearMarks(label);
      performance.clearMeasures(label);
      this.debugElement.innerHTML += `<p>${label} took ${measure.duration}ms</p>`;
    }
    console.timeEnd(label);
  }
}
