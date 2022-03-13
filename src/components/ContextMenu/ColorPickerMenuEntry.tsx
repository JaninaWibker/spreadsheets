import React, { useState, useRef } from 'react'

import { ColorInputSmall } from '../ColorInput'

import type { ColorResult } from 'react-color'

export type ColorPickerMenuEntryProps = {
  key: string,
  color: string | undefined,
  text: string,
  cb: (color: string | undefined) => void,
  close: () => void,
  register_submenu?: (menu: { is_open: boolean, close: () => void }) => number,
  notify_open_submenu?: (idx: number, is_open: boolean) => void
}

const ColorPickerMenuEntry = ({ color=undefined, text="Color", cb, close, register_submenu=() => -1, notify_open_submenu=() => {} }: ColorPickerMenuEntryProps) => {

  const [current_color, state_set_color] = useState(color)
  const list_item_ref = useRef(null)

  let force_close = () => console.log('should close now')

  const submenu_id = register_submenu({ is_open: false, close: () => force_close() })

  const set_color = (color: ColorResult | string, valid: boolean) => {
    const hex_color = !color || typeof(color) === 'string' ? color : color.hex
    state_set_color(hex_color)
    if(valid) {
      cb(hex_color)
    }
  }

  return (
    <div className="contextmenu-entry-outer colorpicker" ref={list_item_ref}>
      <div className="contextmenu-entry-inner">
        <div className="text_wrapper"><div className="text">{text}</div></div>
        <ColorInputSmall
          onChange={set_color}
          onOpenOrClose={(is_open: boolean) => notify_open_submenu(submenu_id, is_open)}
          getForceClose={(close: () => void) => force_close = close}
          error={false}
          value={current_color}
          default_value="transparent"
          overrideReferenceElement={list_item_ref.current} />
      </div>
    </div>
  )
}

export default ColorPickerMenuEntry
