import React from 'react'
import Popover from './Popover'
import SimpleEntry from './SimpleEntry'
import SimpleSubmenu from './SimpleSubmenu'

import type { AdvancedEntry as AdvancedEntryT, AdvancedSubmenuEntry, Entry as EntryT, EntryProps, MenuProps } from '../../types/ContextMenu'

import '../../css/contextmenu.css'

const AdvancedEntry = ({ entry, close } : EntryProps<AdvancedEntryT>) => entry.component(entry, close)

const AdvancedSubmenu = ({ entry, close, register_submenu, notify_open_submenu }: MenuProps<AdvancedSubmenuEntry>) => entry.component(entry, close, register_submenu, notify_open_submenu)

const Entry = ({ entry, close, register_submenu, notify_open_submenu }: MenuProps<EntryT>) => entry.submenu
  ? entry.simple
    ? <SimpleSubmenu entry={entry} close={close} register_submenu={register_submenu} notify_open_submenu={notify_open_submenu} />
    : <AdvancedSubmenu entry={entry} close={close} register_submenu={register_submenu} notify_open_submenu={notify_open_submenu} />
  : entry.simple
    ? <SimpleEntry entry={entry} close={close} />
    : <AdvancedEntry entry={entry} close={close} />

type ContextMenuProps = {
  /**
   * The element next to where the context menu should be placed,
   * Either supply a VirtualElement ([Popper.JS concept](https://popper.js.org/react-popper/v2/virtual-elements/), an object with getBoundingClientRect function) or a normal Element.
   */
  referenceElement: Parameters<(typeof Popover)>[0]['referenceElement'],
  /**
   * List of menu entries
   */
  menu: EntryT[],
  /**
   * Called on close
   */
  close: () => void,
  /**
   * Placement of the context menu relative to `referenceElement`
   */
  placement?: Parameters<typeof Popover>[0]['placement'],
  /**
   * Callback for mouse enter
   */
  onMouseEnter?: (e: React.MouseEvent) => void,
  /**
   * Callback for mouse leave
   */
  onMouseLeave?: (e: React.MouseEvent) => void
}

const ContextMenu = ({ referenceElement, menu, close, placement, onMouseEnter, onMouseLeave } : ContextMenuProps) => {
  const handleKeypress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') close()
  }

  const submenu: { is_open: boolean, close: () => void }[] = []
  const register_submenu = ({ is_open, close }: { is_open: boolean, close: () => void }): number => {
    submenu.push({ is_open, close })
    return submenu.length - 1
  }
  const open_submenu = (idx: number, is_open: boolean) => {
    if (is_open) {
      submenu.filter((menu, i) => menu.is_open && i !== idx).map(menu => menu.close())
    }
    submenu[idx].is_open = is_open
  }

  return (
    <Popover referenceElement={referenceElement} close={close} placement={placement}>
      <div tabIndex={0} className="contextmenu-wrapper clickoutside-skip" onKeyDown={handleKeypress} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <div className="contextmenu-container">
          {menu.map(entry => (
            <Entry
              key={entry.key}
              entry={entry}
              close={close}
              register_submenu={register_submenu}
              notify_open_submenu={open_submenu}
            />
          ))}
        </div>
      </div>
    </Popover>
  )
}

export default ContextMenu
