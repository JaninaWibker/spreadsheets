import React from 'react'
import Popover from '../Popover'
import SimpleEntry from './SimpleEntry'
import SimpleSubmenu from './SimpleSubmenu'

import type { AdvancedEntry as AdvancedEntryT, AdvancedSubmenuEntry, Entry as EntryT, SimpleEntry as SimpleEntryT, SimpleSubmenuEntry } from '../../types/ContextMenu'

import '../../css/contextmenu.css'

export type RegisterSubmenu = (submenu: { is_open: boolean, close: () => void }) => number
export type OpenSubmenu = (idx: number, is_open: boolean) => void

export type MenuProps<SubmenuEntry> = {
  entry: SubmenuEntry,
  close: () => void,
  register_submenu: (submenu: { is_open: boolean, close: () => void }) => number,
  notify_open_submenu: (idx: number, is_open: boolean) => void
}

export type EntryProps = {
  entry: EntryT,
  close: () => void,
  register_submenu: RegisterSubmenu,
  open_submenu: OpenSubmenu
}

const AdvancedEntry = ({ entry, close } : { entry: AdvancedEntryT, close: () => void }) => entry.component(entry, close)

const AdvancedSubmenu = ({ entry, close, register_submenu, notify_open_submenu }: MenuProps<AdvancedSubmenuEntry>) => entry.component(entry, close, register_submenu, notify_open_submenu)

const Entry = ({ entry, close, register_submenu, open_submenu }: EntryProps) => entry.submenu
  ? entry.simple
    ? <SimpleSubmenu   entry={entry as SimpleSubmenuEntry}   close={close} register_submenu={register_submenu} notify_open_submenu={open_submenu} />
    : <AdvancedSubmenu entry={entry as AdvancedSubmenuEntry} close={close} register_submenu={register_submenu} notify_open_submenu={open_submenu} />
  : entry.simple
    ? <SimpleEntry entry={entry as SimpleEntryT} close={close} />
    : <AdvancedEntry entry={entry as AdvancedEntryT} close={close} />

type ContextMenuProps = {
  referenceElement: any, // TODO: find out actual type and figure out to do refs well again
  menu: EntryT[],
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
          {menu.map(entry => <Entry
            key={entry.key}
            entry={entry}
            close={close}
            register_submenu={register_submenu}
            open_submenu={open_submenu}
          />)}
        </div>
      </div>
    </Popover>
  )
}

export default ContextMenu
