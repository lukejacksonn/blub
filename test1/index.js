
import { react, html, css } from 'https://unpkg.com/rplus';

import {f05} from "./0/5.js";
import {f07} from "./0/7.js";
import {f08} from "./0/8.js";
import {f011} from "./0/11.js";
import {f018} from "./0/18.js";
import {f019} from "./0/19.js";

const App = () => html`
  <main>
    <span>Index</span>
    <${f05}/>
<${f07}/>
<${f08}/>
<${f011}/>
<${f018}/>
<${f019}/>
  </main>
`;

react.render(html`<${App}/>`, document.body)   
