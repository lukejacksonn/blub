import { React, ReactDOM } from /*'https://unpkg.com/es-react'*/'https://localhost:8080/blob/a1c3d53af2b7872b3f21fbc02d'
import htm from /*'https://unpkg.com/htm?module'*/'https://localhost:8080/blob/df238a18a789393c3647ca695'
import css from /*'https://unpkg.com/csz'*/'https://localhost:8080/blob/bb6a291e4759fc3e49c8739198'

const html = htm.bind(React.createElement)
const react = {
  ...React,
  render: ReactDOM.render,
}

export { react, html, css }

//# sourceURL=https://unpkg.com/rplus@1.0.0/index.js