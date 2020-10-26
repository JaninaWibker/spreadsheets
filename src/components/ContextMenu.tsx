import React, { useState, useRef } from 'react'
import type { AdvancedEntry, AdvancedSubmenuEntry, Entry, SimpleEntry, SimpleSubmenuEntry } from '../types/ContextMenu'
import KeyboardShortcutDisplay from './KeyboardShortcutDisplay'
import Popover from './Popover'

import '../css/contextmenu.css'
const renderEntry = (entry: Entry, close: () => void, register_submenu: (submenu: { is_open: boolean, close: () => void }) => number, open_submenu: (idx: number, is_open: boolean) => void) => entry.submenu
  ? entry.simple
    ? <SimpleSubmenu entry={entry as SimpleSubmenuEntry} close={close} register_submenu={register_submenu} notify_open_submenu={open_submenu} />
  : entry.simple
    ? renderSimpleEntry(entry as SimpleEntry, close)
    : renderAdvancedEntry(entry as AdvancedEntry, close)

type ContextMenuProps = {
  referenceElement: any, // TODO: find out actual type and figure out to do refs well again
  menu: Entry[],
  close: () => void
  placement?: "right" | "auto" | "auto-start" | "auto-end" | "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "right-start" | "right-end" | "left" | "left-start" | "left-end"
  onMouseEnter?: (e: React.MouseEvent) => void,
  onMouseLeave?: (e: React.MouseEvent) => void,
}

const ContextMenu = ({ referenceElement, menu, close, placement, onMouseEnter, onMouseLeave } : ContextMenuProps) => {
  const handleKeypress = (e: React.KeyboardEvent) => {
    if(e.key === 'Escape') close()
  }

  const submenu: { is_open: boolean, close: () => void }[] = []
  const register_submenu = ({ is_open, close }: { is_open: boolean, close: () => void }): number => {
    submenu.push({ is_open, close})
    return submenu.length-1
  }
  const open_submenu = (idx: number, is_open: boolean) => {
    if(is_open) {
      submenu.filter((menu, i) => menu.is_open && i !== idx).map(menu => menu.close())
    }
    submenu[idx].is_open = is_open
  }

  return (
    <Popover referenceElement={referenceElement} close={close} placement={placement}>
      <div tabIndex={0} className="contextmenu-wrapper clickoutside-skip" onKeyDown={handleKeypress} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <div className="contextmenu-container">
          {menu.map((entry, i) => <React.Fragment key={entry.key}>{renderEntry(entry, close, register_submenu, open_submenu)}</React.Fragment>)}
        </div>
      </div>
    </Popover>
  )
}

const renderSimpleEntry = (entry: SimpleEntry, close: () => void) => {

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

const SimpleSubmenu = ({ entry, close, register_submenu, notify_open_submenu }: { entry: SimpleSubmenuEntry, close: () => void, register_submenu: (submenu: { is_open: boolean, close: () => void }) => number, notify_open_submenu: (idx: number, is_open: boolean) => void }) => {

  const [is_submenu_open, set_submenu_open] = useState(false)
  const [entered_submenu, set_entered_submenu] = useState(false)

  const onSubmenuOpen = (bool: boolean) => {
    if(bool && entry.action) entry.action()
    notify_open_submenu(submenu_id, bool)
    set_submenu_open(bool)
  }

  const submenu_id = register_submenu({ is_open: false, close: () => onSubmenuOpen(false) })

  const toggle_submenu = () => onSubmenuOpen(!is_submenu_open)
  const open_submenu = () => onSubmenuOpen(true)
  const close_submenu = () => setTimeout(() => entered_submenu || onSubmenuOpen(false), 200)

  const list_item_ref = useRef(null)
  
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
const renderAdvancedEntry = (entry: AdvancedEntry, close: () => void) => entry.component(entry, close)

export default ContextMenu

export {
  ContextMenu,
}