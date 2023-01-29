import React, { useState, useEffect } from 'react'
import { usePopper } from 'react-popper'
import type { Modifier, PopperChildrenProps, PopperProps } from 'react-popper'

const backtrackFindClass = (node: HTMLElement, className: string): boolean => {
  if (node.classList.contains(className)) return true
  else return node.parentElement !== null && backtrackFindClass(node.parentElement, className)
}

const useOutsideDetecter = (ref: HTMLElement | null, cb: () => void) => useEffect(() => {
  const handleClickOutside = (evt: MouseEvent) => {
    if (ref && !ref.contains(evt.target as Node) && !backtrackFindClass(evt.target as HTMLElement, 'clickoutside-skip')) {
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
  /**
   * Either supply a VirtualElement ([Popper.JS concept](https://popper.js.org/react-popper/v2/virtual-elements/), an object with getBoundingClientRect function)
   * or a normal Element.
   * You can use:
   * ```ts
   * const popper_ref = useRef<HTMLDivElement>(null)
   *
   * <div ref={popper_ref}>
   *   <Popover referenceElement={popper_ref.current} />
   * </div>
   * ```
   */
  referenceElement: NonNullable<PopperProps<any>['referenceElement']> | null,
  /**
   * automatically move focus to the Popper element after creation
   */
  auto_focus?: boolean,
  /**
   * Where to place the Popper element
   */
  placement?: PopperChildrenProps['placement'],
  /**
   * Called on close
   */
  close: () => void,
  /**
   * [Popper.js modifiers](https://popper.js.org/docs/v2/modifiers/)
   */
  modifiers?: readonly Partial<Modifier<unknown, object>>[],
  /**
   * The content of the popover to display
   */
  children: React.ReactNode
}

const Popover = ({ referenceElement, close, placement = 'auto', auto_focus = false, children, modifiers = [] } : PopoverProps) => {
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null)
  const [arrowElement, setArrowElement] = useState<HTMLElement | null>(null)
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    modifiers: [
      { name: 'arrow', options: { element: arrowElement } },
      { name: 'preventOverflow', options: { boundary: window.document.documentElement, altBoundary: true } },
      ...modifiers
    ],
    placement
  })

  useOutsideDetecter(popperElement, close)

  if (popperElement && auto_focus) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
