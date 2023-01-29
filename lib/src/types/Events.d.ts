export type Modifiers = { shift: boolean, alt: boolean, meta: boolean, ctrl: boolean }

export type ModifiersPlatformAdjusted = Modifers & { mod: boolean }

export type FakeMouseEvent = {
  type: 'click' | 'context' | 'mouseenter' | 'mouseleave' | 'mousedown' | 'mouseup',
  buttons: number,
  button: number,
  modifiers: ModifiersPlatformAdjusted,
  preventDefault: () => void,
  target: EventTarget
}
