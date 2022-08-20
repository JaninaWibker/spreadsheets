# Spreadsheets 📈

Spreadsheets is a small simple (**WIP**) spreadsheet application web app thingy.

<p align="center">
  <img src="./.github/assets/spreadsheets-demo-2.gif" alt="Basic functionality demo gif" />
  <strong>Basic functionality</strong>
  <br />
</p>

<p align="center">
  <img src="./.github/assets/spreadsheets-demo-error-handling.gif" alt="Error handling demo gif" />
  <strong>Error handling</strong>
  <br />
</p>


## Features

- Excel-like formulas
- Markdown support
- more coming soon™

## Installation

```
git clone https://github.com/JannikWibker/spreadsheets
cd spreadsheets
npm install
npm start
```

## Development

This project uses [vite](vitejs.dev).

The project is roughly split into the following folders
- components: every react component that is not the root component (the root component is located in App.js)
- css
- util: useful utilities, parsers and everything that does not really belong together with react components
- public: static resources like the manifest.json or the favicon

A file format for spreadsheet files exists which is pretty much just json and some extra bits. An example can be found in the `example-spreadsheet-file.txt`. What file extension such files should have is something which still needs to be decided. It shouldn't be too long and also shouldn't clash with existing ones. Just using .bin, .txt or similar is also an option. For now .txt is used until some decision is made.
