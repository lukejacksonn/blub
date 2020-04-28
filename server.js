import fs from 'fs';
import http from 'http';
import url from 'url';
import path from 'path';
import mimetypes from './types.js';
import directoryTree from './directory-tree.js';
import { init, parse } from './lexer.js';

const mimes = Object.entries(mimetypes).reduce(
  (all, [type, exts]) =>
    Object.assign(all, ...exts.map((ext) => ({ [ext]: type }))),
  {}
);

const toURL = (code) =>
  'data:text/javascript;base64,' +
  Buffer.from(code, 'utf-8').toString('base64');

const isRouteRequest = (pathname) => !~pathname.split('/').pop().indexOf('.');
const removeFileName = (x) => x.split('/').slice(0, -1).join('/');

const flatten = (file) => {
  const folder = removeFileName(file);
  const source = fs.readFileSync(file, 'utf-8');
  const [imports] = parse(source);
  return toURL(
    imports
      .map((i) => source.substring(i.s, i.e))
      .reduce(
        (code, i) => code.replace(i, flatten(path.resolve(folder, i))),
        source
      )
  );
};

const handleRequest = (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);
  if (isRouteRequest(pathname)) {
    const entry = path.join(process.cwd(), pathname, '/index.js');
    const filetree = directoryTree(pathname || '.');
    res.write(`
        <script type="module">
          console.log(${JSON.stringify(filetree)})
          import("${flatten(entry)}")
        </script>
    `);
    res.end();
  } else {
    const ext = pathname.replace(/^.*[\.\/\\]/, '').toLowerCase();
    fs.readFile(pathname, 'binary', (err, file) => {
      if (err) return res.end();
      res.writeHead(200, {
        'Content-Type': mimes[ext] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(file, 'binary');
      res.end();
    });
  }
};

(async () => {
  await init;
  http.createServer(handleRequest).listen(8080);
})();
