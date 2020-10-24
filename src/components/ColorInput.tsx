import React, { Component, useState, useRef } from 'react'
import { ChromePicker, ColorResult } from 'react-color'ä
import Popover from './Popover'
import { verify_color } from '../util/css-colors'

type ColorInputProps = {
  onChange?: (color: ColorResult | string, valid: boolean) => void
  error: boolean,
  value?: string,
  default_value: string
}

export type ColorInputSmallProps = ColorInputProps & {

}

export type ColorInputLargeProps = ColorInputProps & {
  label: string,
  id: string,
}

type ColorInputState = {
  is_open: boolean,
  color: string | undefined
}

class ColorInput<Props extends ColorInputProps> extends Component<Props, ColorInputState> {

  constructor(props: Props) {
    super(props)

    this.state = {
      is_open: false,
      color: props.value
    }
  }

  onChangePicker = (color: ColorResult, _event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ color: color.hex })
  }

  togglePicker = (bool?: boolean | React.MouseEvent) => {
    const new_value = bool !== undefined && typeof(bool) === 'boolean'
      ? bool
      : !this.state.is_open

    console.log('toggle to: ' + new_value)
      
    this.setState({
      is_open: new_value
    }, () => !new_value && this.props.onChange && this.props.onChange(this.state.color as string, this.state.color ? verify_color(this.state.color as string) : false))
  }
}

class ColorInputSmall extends ColorInput<ColorInputSmallProps> {

  target = React.createRef<HTMLDivElement>()

  render() {
    const { default_value, error } = this.props
    return (
      <React.Fragment>
        <div className="colorpicker-preview-wrapper" role="button" tabIndex={0} onClick={e => (console.log('onClick'), this.togglePicker(e))}>
        <div className={'colorpicker-preview' + (error ? ' error' : '')} style={{backgroundColor: this.state.color || default_value}}></div>
      </div>
      {this.state.is_open
        ? <Popover referenceElement={this.target.current} close={this.togglePicker} placement="right">
            <ChromePicker onChange={this.onChangePicker} color={this.state.color} />
          </Popover>
        : null
      }
      </React.Fragment>
    )
  }
}

class ColorInputLarge extends ColorInput<ColorInputLargeProps> {
  target = React.createRef<HTMLDivElement>()

  onChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement
    if(this.props.onChange) this.props.onChange(target.value, verify_color(target.value))
  }

  render() {
    const { default_value, label, id, error } = this.props

    return (
      <div className="ColorInput">

      <div><label className={"heading-sub" + (error ? ' ColorInput-error' : '')} htmlFor={id}>{label}{error ? '!' : null}</label></div>


      <div className="ColorInput-wrapper">
        <div className="ColorInput-circle-wrapper" ref={this.target}>
          <div className="ColorInput-circle-inner" onClick={this.togglePicker} style={{backgroundColor: this.state.color}}></div>
        </div>

        <input id={id} className="text-input input-small ColorInput-input" onChange={this.onChangeInput} value={this.state.color} defaultValue={default_value} />
        </div>
        {this.state.is_open
          ? <Popover referenceElement={this.target.current} close={this.togglePicker}>
              <ChromePicker onChange={this.onChangePicker} color={this.state.color} />
            </Popover>
          : null
        }
      </div>
    )
  }
}

export {
  ColorInputLarge,
  ColorInputSmall,
}