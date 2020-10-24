import React, { useState, useRef } from 'react'
import type { AdvancedEntry, AdvancedSubmenuEntry, Entry, SimpleEntry, SimpleSubmenuEntry } from '../types/ContextMenu'
import KeyboardShortcutDisplay from './KeyboardShortcutDisplay'
import Popover from './Popover'

import '../css/contextmenu.css'
const renderEntry = (entry: Entry, close: () => void) => entry.submenu
  ? entry.simple
    ? null
    : null
  : entry.simple
    ? renderSimpleEntry(entry as SimpleEntry, close)
    : renderAdvancedEntry(entry as AdvancedEntry, close)

const ContextMenu = ({ referenceElement, menu, close } : { referenceElement: any, menu: Entry[], close: () => void }) => { // TODO: find out actual type and figure out to do refs well again
  const handleKeypress = (e: React.KeyboardEvent) => {
    if(e.key === 'Escape') close()
  }

  return (
    <Popover referenceElement={referenceElement} close={close}>
      <div tabIndex={0} className="contextmenu-wrapper" onKeyDown={handleKeypress}>
        <div className="contextmenu-container">
          {menu.map((entry, i) => <React.Fragment key={entry.key}>{renderEntry(entry, close)}</React.Fragment>)}
        </div>
      </div>
    </Popover>
  )
}

const renderSimpleEntry = (entry: SimpleEntry, close: () => void) => (
  <div role="button" tabIndex={0} className="contextmenu-entry-outer" key={entry.key} onClick={() => {if(entry.action) entry.action(); close()}}>
    <div className="contextmenu-entry-inner">
      <div className="icon_wrapper">
        {entry.icon}
      </div>
      <div className="text_wrapper">
        <div className="text">{entry.name}</div>
      </div>
      {entry.shortcut
        ? <div className="shortcut_wrapper">
          <KeyboardShortcutDisplay keys={entry.shortcut} theme_base="light" simple={true} />
        </div>
        : null}
    </div>
  </div>
)

const renderAdvancedEntry = (entry: AdvancedEntry, close: () => void) => entry.component(entry, close)

export default ContextMenu

export {
  ContextMenu,
}