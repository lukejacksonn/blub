
import { react, html, css } from 'https://unpkg.com/rplus';
import {f0410} from "./4/10.js";
import {f04313} from "./4/3/13.js";
import {f04315} from "./4/3/15.js";
import {f04329} from "./4/3/2/9.js";

export const f05 = (props, children) => html`<div className=${style}><span>f05</span><${f0410}/>
<${f04313}/>
<${f04315}/>
<${f04329}/></div>`;
const style = css`padding-left: 1rem`
