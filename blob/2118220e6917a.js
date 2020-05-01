import { React, ReactDOM } from /*'https://unpkg.com/es-react'*/'0af2502abc283'
import htm from /*'https://unpkg.com/htm?module'*/'81914f4440e6b'
import css from /*'https://unpkg.com/csz'*/'62ead14f7b2e5'

const html = htm.bind(React.createElement)
const react = {
  ...React,
  render: ReactDOM.render,
}

export { react, html, css }

//# sourceURL=https://unpkg.com/rplus@1.0.0/index.js