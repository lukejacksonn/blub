import { react, html, css } from 'https://unpkg.com/rplus';

import { f39 } from './3/9.js';
import { f313 } from './3/13.js';
import { f314 } from './3/14.js';
import { f316 } from './3/16.js';
import { f318 } from './3/18.js';
import { f330 } from './3/30.js';
import { f334 } from './3/34.js';
import { f336 } from './3/36.js';
import { f338 } from './3/38.js';
import { f339 } from './3/39.js';
import { f341 } from './3/41.js';
import { f352 } from './3/52.js';
import { f354 } from './3/54.js';
import { f357 } from './3/57.js';
import { f359 } from './3/59.js';
import { f360 } from './3/60.js';
import { f361 } from './3/61.js';
import { f363 } from './3/63.js';
import { f364 } from './3/64.js';
import { f373 } from './3/73.js';
import { f377 } from './3/77.js';
import { f390 } from './3/90.js';
import { f391 } from './3/91.js';
import { f394 } from './3/94.js';
import { f395 } from './3/95.js';
import { f398 } from './3/98.js';
import { f399 } from './3/99.js';

const App = () => html`
  <main>
    <span>Index</span>
    <${f39} />
    <${f313} />
    <${f314} />
    <${f316} />
    <${f318} />
    <${f330} />
    <${f334} />
    <${f336} />
    <${f338} />
    <${f339} />
    <${f341} />
    <${f352} />
    <${f354} />
    <${f357} />
    <${f359} />
    <${f360} />
    <${f361} />
    <${f363} />
    <${f364} />
    <${f373} />
    <${f377} />
    <${f390} />
    <${f391} />
    <${f394} />
    <${f395} />
    <${f398} />
    <${f399} />
  </main>
`;

react.render(html`<${App} />`, document.querySelector('main'));
