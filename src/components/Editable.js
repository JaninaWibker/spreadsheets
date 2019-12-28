import React, { Component } from 'react'
import '../css/editable.css'

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

  UNSAFE_componentWillReceiveProps(nextProps) { // TODO: replace componentWillReceiveProps with getDerivedStateFromProps (https://hackernoon.com/replacing-componentwillreceiveprops-with-getderivedstatefromprops-c3956f7ce607)
    // console.log(nextProps)
    //console.log(nextProps, this.state)
    const newText = nextProps.raw_data || nextProps.text || nextProps.children
    if(newText !== this.state.text || this.state.editing) {
      console.log('text has changed: ', newText, this.state.text)
      // console.log({
      //   old_text: newText,
      //   text: this.state.editing ? this.state.text : newText,
      //   pretty_text: nextProps.text || nextProps.children
      // })
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
        ? <input className="editable-input"
            type='text'
            onChange={this.onChange}
            onBlur={this.finishEdit}
            onKeyDown={this.onKeyDown}
            defaultValue={this.state.text}
            ref={el => this.el = el} />
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
