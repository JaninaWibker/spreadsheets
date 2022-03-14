import React, { useState, useRef } from 'react'
import Popover from './Popover'
import ContextMenu from './ContextMenu'

import type { MenuProps, SimpleSubmenuEntry } from '../../types/ContextMenu'

const SimpleSubmenu = ({ entry, close, register_submenu, notify_open_submenu }: MenuProps<SimpleSubmenuEntry>) => {

  const [is_submenu_open, set_submenu_open] = useState(false)
  const [entered_submenu, set_entered_submenu] = useState(false)

  const on_submenu_open = (bool: boolean) => {
    if(bool && entry.action) entry.action()
    notify_open_submenu(submenu_id, bool)
    set_submenu_open(bool)
  }

  const submenu_id = register_submenu({ is_open: false, close: () => on_submenu_open(false) })

  const toggle_submenu = () => on_submenu_open(!is_submenu_open)
  const open_submenu   = () => on_submenu_open(true)
  const close_submenu  = () => setTimeout(() => entered_submenu || on_submenu_open(false), 200)

  const list_item_ref = useRef<HTMLDivElement>(null)

  return (
    <div role="button" tabIndex={0} ref={list_item_ref} key={entry.key} className="contextmenu-entry-outer" onClick={toggle_submenu} onMouseEnter={open_submenu} onMouseLeave={close_submenu} onKeyDown={e => e.key === ' ' && toggle_submenu()}>
      <div className="contextmenu-entry-inner">
        <div className="text_wrapper">
          <div className="text">{entry.name}</div>
        </div>
        <div className="icon_wrapper">
          {entry.expand_icon}
        </div>
      </div>
      {is_submenu_open
        ? <Popover referenceElement={list_item_ref.current} close={close_submenu} modifiers={[{ name: 'offset', options: { offset: [-45, 0], } }]}>
            <ContextMenu referenceElement={list_item_ref.current} menu={entry.menu} close={close} placement="top-start" onMouseEnter={() => set_entered_submenu(true)} onMouseLeave={() => { set_entered_submenu(false); set_submenu_open(false); }} />
          </Popover>
        : null}
    </div>
  )
}

export default SimpleSubmenu
