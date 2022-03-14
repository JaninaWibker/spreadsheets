import React from 'react'

import { isMacOrIos } from '../../util/platform-detection'

import '../../css/keyboardshortcutdisplay.css'

// const cmdKeyIsMod = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)

const cmdKeyIsMod = isMacOrIos()

const keymap = {
  cmd: '⌘',
  ctrl: '⌃',
  mod: cmdKeyIsMod ? '⌘' : '⌃',
  alt: '⌥',
  shift: '⇧',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  backspace: '⇦',
  tab: '⇥',
  enter: '↵',
  pagedown: 'PageDown',
  pageup: 'PageUp'
} as { [key: string]: string }



const KeyboardShortcutDisplay = ({ keys=[], theme_base='light', simple=false }: { keys: string[], theme_base?: 'light' | 'dark', simple?: boolean }) => {
  return (
    <React.Fragment>
      <span className={"keyboard-shortcut" + (simple ? ' simple' : ' not-simple')}>
        {keys.map((key, i) =>
          <span key={i} className={"keyboard-shortcut-key " + theme_base + (keymap[key] ? '' : ' no-icon') + (simple ? ' simple' : ' not-simple')}>{keymap[key] || key.toUpperCase()}</span>
        )}
      </span>
      <wbr />
      {/*
        wbr := Word Break Opportunity;
        Works together with white-space: nowrap. white-space: nowrap tells the browser NOT to
        break inside the keyboard-shortcut span element while <wbr /> gives the browser a hint
        about where breaking  is okay / good (right after the keyboard-shortcut span element)
      */}
    </React.Fragment>
  )
}

export default KeyboardShortcutDisplay
