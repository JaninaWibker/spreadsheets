import React, { Component, PropsWithChildren } from 'react'
import '../css/editable.css'

import { Modifiers } from '../types/Events'

interface EditableProps {
  raw_data?: string,
  text?: string,
  pretty_text?: string,
  setInnerHTML: boolean,
  isFocused: boolean, // TODO: this is not being used?
  cb: (value: string) => any,
  onArrowKeyEvent?: (key: "ArrowLeft" | "ArrowUp" | "ArrowRight" | "ArrowDown", modifierse: Modifiers, preventDefault: () => any) => any
}

interface EditableState {
  editing: boolean,
  old_text: string,
  text: string,
  pretty_text: string | React.ReactNode
}

export default class Editable extends Component<PropsWithChildren<EditableProps>, EditableState> {
  /**
   * Render text and start editing it by simply double clicking
   *
   * @remarks
   * There are mutliple ways to use this component; those include just passing text which is rendered and can be edited;
   * rendering something different from what can be edited (the rendered text is most likely derived from the editable text)
   * In addition to that either HTML (in string form) or complete JSX components can be rendered (but not edited in that form)

   * To use those features multiple props need to be used:
   * @param raw_data  - provides the text that is being edited
   * @param text      - if no destinction between `raw_data` and `pretty_text` needs to be made (the text that should get rendered is also the text
   *                    that can be edited); if `pretty_text` is specified this (mostly?; **don't depend on this behaviour**) acts the same as `raw_data`
   * @param pretty_text   - text that is rendered when not editing
   * @param children      - **ONLY** used to render actual react components
   * @param setInnerHTML  - boolean value which determines wether or not a string is rendered to html using `dangerouslySetInnerHTML`

   * To get notified when changes happen the following props can be used:
   * @param cb - Just a callback that gets fired everytime the text is edited (when the user *finishes* editing the text to be precise)
   * @param onArrowKeyEvent - this is a special event listener which fires when the arrow keys are pressed **while not editing**. This can
   *                          be useful in some cases. Besides the pressed key information about which modifiers were held down is also sent along.
   *
   * @param isFocused - **NOT IMPLEMENTED (YET?)**
   */

  el: HTMLInputElement | null = null

  constructor(props: Readonly<PropsWithChildren<EditableProps>>) {
    super(props)

    console.log(this.props.children)

    const text = this.props.raw_data !== undefined
      ? this.props.raw_data
      : this.props.text !== undefined
        ? this.props.text
        : this.props.children!.toString()

    const pretty_text = this.props.text !== undefined
      ? this.props.text
      : (this.props.children && this.props.children.toString()) || undefined

    this.state = {
      editing: false,
      old_text: text,
      text: text,
      pretty_text: pretty_text, //this.props.text || (this.props.children && this.props.children.toString()) || undefined
    }


    this.startEdit = this.startEdit.bind(this)
    this.finishEdit = this.finishEdit.bind(this)
    this.cancelEdit = this.cancelEdit.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onChange = this.onChange.bind(this)
  }

  // static getDerivedStateFromProps(nextProps, prevState) {
  //   console.log(nextProps)
  //   const newText = nextProps.raw_data || nextProps.text || nextProps.children
  //   if(newText !== prevState.text || prevState.editing) {
  //     console.log('text has changed: ', newText, prevState.text)
  //     console.log({
  //       old_text: newText,
  //       text: prevState.editing ? prevState.text : newText,
  //       pretty_text: nextProps.text || nextProps.children
  //     })
  //     return {
  //       old_text: newText,
  //       text: prevState.editing ? prevState.text : newText,
  //       pretty_text: nextProps.text || nextProps.children
  //     }
  //   } else {
  //     return null
  //   }
  // }

  // * INFO: only about 2-5% of calls to this method result actually qualify for updating the state and this function is called **A LOT**. This means that correctly determining whether to update or not is **REALLY IMPORTANT** for performance.
  UNSAFE_componentWillReceiveProps(nextProps: Readonly<EditableProps> & Readonly<{ children?: React.ReactNode }>) { // TODO: replace componentWillReceiveProps with getDerivedStateFromProps (https://hackernoon.com/replacing-componentwillreceiveprops-with-getderivedstatefromprops-c3956f7ce607)

    // use this to update the state; this ensures that logging (if not commented out) is consistent across execution paths. All of the state changes also looked almost completely similar so this reduces redundency
    const update_state = (old_text: string, text: string, pretty_text: string | React.ReactNode) => {
      console.log({ children: nextProps.children, raw_data: nextProps.raw_data, text: nextProps.text, pretty_text: nextProps.pretty_text, setInnerHTML: nextProps.setInnerHTML }, { text: this.state.text, pretty_text: this.state.pretty_text })
      this.setState({
        old_text: old_text,
        text: this.state.editing ? this.state.text : text,
        pretty_text: pretty_text
      })
    }

    // differentiate between just supplying text and also supplying raw_data
    if(nextProps.raw_data !== undefined) { // raw_data supplied; differentiating between text and pretty_text
      const new_raw_text = nextProps.raw_data

      if(nextProps.children !== undefined && typeof(nextProps.children) !== "string" ) { // handle React Component as pretty_text
        if(new_raw_text !== this.state.text || nextProps.children !== this.state.pretty_text) {
          update_state(new_raw_text, new_raw_text, nextProps.children)
        }
      } else {

        const new_text = nextProps.pretty_text !== undefined
          ? nextProps.pretty_text
          : nextProps.text !== undefined
            ? nextProps.text
            : nextProps.children!.toString()

        if(new_raw_text !== this.state.text || new_text !== this.state.pretty_text) {
          update_state(new_raw_text, new_raw_text, new_text)
        }
      }

    } else { // not differentiating between text and pretty text
      if(nextProps.children !== undefined && typeof(nextProps.children) !== "string" ) { // handle React Component as pretty_text
        if(nextProps.children !== this.state.pretty_text) {
          // if children is a JSX component and for some reason text / raw_data is not used just don't change the already existing values for old_text and text
          update_state(this.state.old_text, this.state.text, nextProps.children)
        }
      } else {
        const new_text: string = nextProps.pretty_text || nextProps.text || nextProps.children!.toString()
        if(new_text !== this.state.text || new_text !== this.state.pretty_text) {
          update_state(new_text, new_text, new_text)
        }
      }
    }
  }

  startEdit(_e?: React.MouseEvent<HTMLSpanElement, MouseEvent>) {
    this.setState({editing: true, old_text: this.state.text}, () => {
      this.el!.focus()
      this.el!.setSelectionRange(0, this.el!.value.length)
    })
  }

  finishEdit() {
    this.setState({editing: false, old_text: this.state.text})
    this.props.cb(this.state.text)
  }

  cancelEdit() {
    this.setState({editing: false, text: this.state.old_text})
  }

  onKeyDown(e: React.KeyboardEvent<HTMLInputElement> & { target: HTMLInputElement }) {
    if(e.target.nodeName === 'INPUT') {
      if(e.key === 'Enter' || e.key === 'Tab') this.finishEdit()
      else if(e.key === 'Escape') this.cancelEdit()
    } else if(e.target.nodeName === 'SPAN') {
      if((e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'ArrowDown') && this.props.onArrowKeyEvent) {
        this.props.onArrowKeyEvent(e.key, { shift: e.shiftKey, alt: e.altKey, ctrl: e.ctrlKey, meta: e.metaKey }, e.preventDefault.bind(e))
      } else if(e.key === 'Backspace') {
        this.setState({text: '', pretty_text: '', old_text: ''}, () => this.props.cb(''))
      } else if(e.altKey || e.metaKey || e.shiftKey) {
        // nothing
      } else this.startEdit()
    }
  }

  onChange(e: React.ChangeEvent<HTMLInputElement> & { target: HTMLInputElement }) {
    this.setState({text: e.target.value.trim()})
  }

  render() {
    return this.state.editing
        ? <input className="editable-input"
            type='text'
            onChange={this.onChange}
            onBlur={this.finishEdit}
            onKeyDown={this.onKeyDown}
            defaultValue={this.state.text}
            ref={el => this.el = el} />
        : this.props.setInnerHTML
          ? <span
              className="editable-preview editable-html"
              tabIndex={0}
              onKeyDown={this.onKeyDown}
              onDoubleClick={this.startEdit}
              dangerouslySetInnerHTML={{__html: this.state.pretty_text as string}} />
          : <span
              className="editable-preview"
              tabIndex={0}
              onKeyDown={this.onKeyDown}
              onDoubleClick={this.startEdit}>
                {this.state.pretty_text}
            </span>
  }
}

/*

behavior with raw data:
it should show the prettified (non-raw) data in the span and as soon as
the user clicks on the span switch to an input field with the raw data in it
the user can edit the raw data and as soon as he modifies it the callback function is called
and the span now shows the new prettified data and not the old one
*/
