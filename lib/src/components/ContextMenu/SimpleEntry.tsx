import React from 'react'
import KeyboardShortcutDisplay from './KeyboardShortcutDisplay'

import type { EntryProps, SimpleEntry as SimpleEntryT } from '../../types/ContextMenu'

const SimpleEntry = ({ entry, close }: EntryProps<SimpleEntryT>) => {

  const callback = () => {
    if(entry.action) entry.action()
    close()
  }

  return (
    <div role="button" tabIndex={0} className="contextmenu-entry-outer" key={entry.key} onClick={callback} onKeyDown={e => e.key === ' ' && callback()}>
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
}

export default SimpleEntry
