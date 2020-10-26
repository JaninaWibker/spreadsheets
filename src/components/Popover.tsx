import React, { useState, useEffect } from 'react'
import { usePopper } from 'react-popper'
import type { Modifier } from 'react-popper'

const backtrackFindClass = (node: HTMLElement, className: string): boolean => {
  if(node.classList.contains(className)) return true
  else return node.parentElement !== null && backtrackFindClass(node.parentElement as HTMLElement, className)
}

const useOutsideDetecter = (ref: HTMLElement | null, cb: () => void) => useEffect(() => {
  const handleClickOutside = (evt: MouseEvent) => {
    if(ref && !ref.contains(evt.target as Node) && !backtrackFindClass(evt.target as HTMLElement, 'clickoutside-skip')) {
      console.log('click outside', ref, evt.target)
      cb()
    }
  }
  const onMount = () => document.addEventListener('mousedown', handleClickOutside)
  const onUnmount = () => document.removeEventListener('mousedown', handleClickOutside)

  onMount()
  return onUnmount
}, [ref])

type PopoverProps = {
  referenceElement: any, // TODO: find out actual type and figure out to do refs well again
  auto_focus?: boolean,
  placement?: | 'auto' | 'auto-start' | 'auto-end' | 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'right' | 'right-start' | 'right-end' | 'left' | 'left-start' | 'left-end',
  close: () => void,
  modifiers?: readonly Partial<Modifier<unknown, object>>[]
  children: React.ReactNode,
}

const Popover = ({ referenceElement, close, placement='auto', auto_focus=false, children, modifiers=[] } : PopoverProps) => {

  const [popperElement, setPopperElement] = useState(null) as [HTMLElement | null, React.Dispatch<React.SetStateAction<HTMLElement | null>>]
  const [arrowElement, setArrowElement] = useState(null) as [HTMLElement | null, React.Dispatch<React.SetStateAction<HTMLElement | null>>]
  const {styles, attributes} = usePopper(referenceElement, popperElement, {
    modifiers: [
      { name: 'arrow', options: { element: arrowElement } },
      { name: 'preventOverflow', options: { boundary: window.document.documentElement, altBoundary: true } },
      ...modifiers
    ],
    placement: placement
  })

  useOutsideDetecter(popperElement, close)

  if(popperElement && auto_focus) {
    // @ts-ignore
    popperElement.children[0].focus()
  }

  return (
    <div ref={setPopperElement} style={styles.popper} {...attributes.popper}>
      {children}
      <div className="popover-arrow" ref={setArrowElement} style={styles.arrow} />
    </div>
  )
}

export default Popover