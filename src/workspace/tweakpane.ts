import { Pane, type BindingParams } from 'tweakpane';
import type { Control } from '../engine/contracts';
import type { Parameters } from './storage';
import { controlValue } from './view';

export function parameterPane(container: HTMLElement, controls: readonly Control[], params: Parameters,
  defaults: Parameters, expandedGroups: string[], onchange: (key: string, value: unknown) => void,
  onexpand: (group: string, open: boolean) => void) {
  const pane = new Pane({ container });
  const mirror = { ...params };
  let canonical = { ...params };
  let refreshing = false;
  let disposed = false;
  const listeners = new AbortController();
  const unsubscribe: (() => void)[] = [];
  const semantics: (() => void)[] = [];
  const listen = <K extends keyof HTMLElementEventMap>(element: HTMLElement, type: K,
    handler: (event: HTMLElementEventMap[K]) => void, capture = false) =>
    element.addEventListener(type, handler, { capture, signal: listeners.signal });
  listen(container, 'keydown', event => event.stopPropagation());
  listen(container, 'keyup', event => event.stopPropagation());

  function silently(action: () => void) {
    const previous = refreshing;
    refreshing = true;
    try { action(); } finally { refreshing = previous; }
  }
  const folders = [...new Set(controls.map(control => control.group))].map(group => {
    const folder = pane.addFolder({ title: group, expanded: expandedGroups.includes(group) });
    const button = folder.element.querySelector('button')!;
    const describe = () => button.setAttribute('aria-expanded', String(folder.expanded));
    semantics.push(describe);
    const fold = () => { describe(); if (!refreshing && !disposed) onexpand(group, folder.expanded); };
    folder.on('fold', fold);
    unsubscribe.push(() => folder.off('fold', fold));
    for (const control of controls.filter(control => control.group === group)) {
      const options: BindingParams = { label: control.label };
      if (control.type === 'number') {
        Object.assign(options, { min: control.min, max: control.max, keyScale: control.step,
          pointerScale: control.step, format: (value: number) => String(Number(value.toFixed(10))) });
      } else if (control.type === 'choice') {
        options.options = control.options.map(value => ({ text: value, value }));
      } else if (control.type === 'text') options.view = 'text';
      else if (control.type === 'color') options.picker = 'inline';
      const binding = folder.addBinding(mirror, control.key, options);
      const root = binding.element;
      const input = root.querySelector<HTMLInputElement>('input');
      const select = root.querySelector<HTMLSelectElement>('select');
      const slider = control.type === 'number' ? root.querySelector<HTMLElement>('[tabindex]') : null;
      function describe() {
        if (control.type === 'choice' && select) select.value = String(canonical[control.key]);
        if (control.type !== 'number') return;
        if (input) input.value = String(canonical[control.key]);
        for (const element of [input, slider]) {
          element?.setAttribute('aria-valuenow', String(canonical[control.key]));
        }
      }
      function refresh() { silently(() => binding.refresh()); describe(); }
      function commit(value: unknown) {
        if (disposed) return;
        const previous = canonical[control.key];
        const next = control.type === 'number' && String(value).trim() === ''
          ? previous : controlValue(control, value, previous);
        canonical[control.key] = mirror[control.key] = next;
        refresh();
        if (next !== previous) onchange(control.key, next);
      }
      const change = () => { if (!refreshing) commit(mirror[control.key]); };
      binding.on('change', change);
      unsubscribe.push(() => binding.off('change', change));
      if (input) input.setAttribute('aria-label', control.type === 'number' ? `${control.label} exact` : control.label);
      if (control.type === 'number' && input && slider) {
        input.setAttribute('role', 'spinbutton');
        input.inputMode = 'decimal';
        slider.setAttribute('role', 'slider');
        slider.setAttribute('aria-label', control.label);
        for (const element of [input, slider]) {
          element.setAttribute('aria-valuemin', String(control.min));
          element.setAttribute('aria-valuemax', String(control.max));
          listen(element, 'keydown', event => {
            const direction = ['ArrowUp', 'ArrowRight'].includes(event.key) ? 1
              : ['ArrowDown', 'ArrowLeft'].includes(event.key) ? -1 : 0;
            if (!direction || (element === input && ['ArrowLeft', 'ArrowRight'].includes(event.key))) return;
            event.preventDefault(); event.stopImmediatePropagation();
            commit(Number(canonical[control.key]) + direction * control.step);
          }, true);
        }
        listen(root, 'change', event => {
          if (event.target !== input) return;
          event.stopImmediatePropagation();
          commit(input.value);
        }, true);
        listen(slider, 'dblclick', () => commit(defaults[control.key]));
        const reset = folder.addButton({ title: `Reset ${control.label}` });
        const resetValue = () => commit(defaults[control.key]);
        reset.on('click', resetValue);
        unsubscribe.push(() => reset.off('click', resetValue));
      } else if (control.type === 'choice' && select) {
        select.setAttribute('aria-label', control.label);
        listen(root, 'change', event => {
          if (event.target !== select) return;
          event.stopImmediatePropagation();
          commit(select.value);
        }, true);
      } else if (control.type === 'text' && input) {
        listen(input, 'input', () => commit(input.value));
      } else if (control.type === 'color' && input) {
        listen(input, 'input', () => input.dispatchEvent(new Event('change', { bubbles: true })));
        root.querySelector('button')?.setAttribute('aria-label', `Choose ${control.label} color`);
        select?.setAttribute('aria-label', `${control.label} color format`);
        const describeChannels = () => {
          const channels = [...root.querySelectorAll('input')].slice(1);
          const names = select?.value === 'hex' ? ['hex'] : select?.value === 'rgb' ? ['red', 'green', 'blue']
            : select?.value === 'hsl' ? ['hue', 'saturation', 'lightness'] : ['hue', 'saturation', 'value'];
          channels.forEach((channel, index) => channel.setAttribute('aria-label', `${control.label} ${names[index] ?? 'alpha'}`));
        };
        if (select) listen(select, 'change', describeChannels);
        describeChannels();
        root.querySelectorAll<HTMLElement>('[tabindex]').forEach((element, index) => {
          element.setAttribute('role', 'group');
          element.setAttribute('aria-label', `${control.label} ${index === 0 ? 'saturation and value' : 'hue'} picker`);
        });
      }
      semantics.push(describe);
    }
    return { group, folder };
  });
  return {
    refresh(values: Parameters, expanded: string[]) {
      if (disposed) return;
      silently(() => {
        canonical = { ...values };
        Object.assign(mirror, values);
        pane.refresh();
        for (const { group, folder } of folders) folder.expanded = expanded.includes(group);
        for (const describe of semantics) describe();
      });
    },
    dispose() {
      disposed = true;
      listeners.abort();
      for (const off of unsubscribe) off();
      pane.dispose();
    },
  };
}
