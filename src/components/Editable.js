import React, { Component } from 'react'
import styled from 'styled-components'

const EditableInput = styled.input`
  display: inline-block;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  font-size: 14px;
  line-height: 15px;
  border: none;
  margin: 0px;
  padding: 4px;

  :focus {
    outline: none;
  }
`

export default class Editable extends Component {
  constructor(props) {
    super(props)

    this.state = {
      editing: false,
      old_text: this.props.raw_data || this.props.text || this.props.children,
      text: this.props.raw_data || this.props.text || this.props.children,
      pretty_text: this.props.text || this.props.children
    }


    this.startEdit = this.startEdit.bind(this)
    this.finishEdit = this.finishEdit.bind(this)
    this.cancelEdit = this.cancelEdit.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onChange = this.onChange.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    //console.log(nextProps, this.state)
    const newText = nextProps.raw_data || nextProps.text || nextProps.children
    if(newText !== this.state.text || this.state.editing) {
      console.log('text has changed: ', newText, this.state.text)
      this.setState({
        old_text: newText,
        text: this.state.editing ? this.state.text : newText,
        pretty_text: nextProps.text || nextProps.children
      })
    }
  }

  startEdit(e) {
    this.setState({editing: true, old_text: this.state.text}, () => {
      this.el.focus()
      this.el.setSelectionRange(0, this.el.value.length)
    })
  }

  finishEdit() {
    this.setState({editing: false, old_text: this.state.text})
    this.props.cb(this.state.text)
  }

  cancelEdit() {
    this.setState({editing: false, text: this.state.old_text})
  }

  onKeyDown(e) {
    if(e.target.nodeName === 'INPUT') {
      if(e.key === 'Enter' || e.key === 'Tab') this.finishEdit()
      else if(e.key === 'Escape') this.cancelEdit()
    } else if(e.target.nodeName === 'SPAN') {
      if((e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'ArrowDown') && this.props.handleArrowKeys) {
        this.props.handleArrowKeys(e.key, e.shiftKey, e.altKey, e.ctrlKey || e.metaKey, e.preventDefault.bind(e))
      } else if(e.key === 'Backspace') {
        this.setState({text: '', pretty_text: '', old_text: ''}, x => this.props.cb(''))
      } else if(e.altKey || e.metaKey || e.shiftKey) {
        // nothing
      } else this.startEdit()
    }
  }

  onChange(e) {
    this.setState({text: e.target.value.trim()})
  }

  render() {
    return this.state.editing
        ? <EditableInput
            type='text'
            onChange={this.onChange}
            onBlur={this.finishEdit}
            onKeyDown={this.onKeyDown}
            defaultValue={this.state.text}
            innerRef={el => this.el = el} />
        : this.props.setInnerHTML
          ? <span
              tabIndex="0"
              onKeyDown={this.onKeyDown}
              onDoubleClick={this.startEdit}
              dangerouslySetInnerHTML={{__html: this.state.pretty_text}} />
          : <span
              tabIndex="0"
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
