import React from 'react'
import Popover from '../Popover'
import SimpleEntry from './SimpleEntry'
import SimpleSubmenu from './SimpleSubmenu'

import type { AdvancedEntry as AdvancedEntryProps, AdvancedSubmenuEntry, Entry, SimpleEntry as SimpleEntryProps, SimpleSubmenuEntry } from '../../types/ContextMenu'

import '../../css/contextmenu.css'

const AdvancedEntry = ({ entry, close } : { entry: AdvancedEntryProps, close: () => void }) => entry.component(entry, close)

const AdvancedSubmenu = ({ entry, close, register_submenu, notify_open_submenu }: { entry: AdvancedSubmenuEntry, close: () => void, register_submenu: (submenu: { is_open: boolean, close: () => void }) => number, notify_open_submenu: (idx: number, is_open: boolean) => void }) => entry.component(entry, close, register_submenu, notify_open_submenu)


const renderEntry = (entry: Entry, close: () => void, register_submenu: (submenu: { is_open: boolean, close: () => void }) => number, open_submenu: (idx: number, is_open: boolean) => void) => entry.submenu
  ? entry.simple
    ? <SimpleSubmenu   entry={entry as SimpleSubmenuEntry}   close={close} register_submenu={register_submenu} notify_open_submenu={open_submenu} />
    : <AdvancedSubmenu entry={entry as AdvancedSubmenuEntry} close={close} register_submenu={register_submenu} notify_open_submenu={open_submenu} />
  : entry.simple
    ? <SimpleEntry entry={entry as SimpleEntryProps} close={close} />
    : <AdvancedEntry entry={entry as AdvancedEntryProps} close={close} />

type ContextMenuProps = {
  referenceElement: any, // TODO: find out actual type and figure out to do refs well again
  menu: Entry[],
  close: () => void
  placement?: Parameters<typeof Popover>[0]['placement'],
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

export default ContextMenu
