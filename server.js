import fs from 'fs';
import http from 'http';
import url from 'url';
import path from 'path';
import mimetypes from './types.js';
import { init } from './lexer.js';

import { topLevelLoad } from './es-module-shims.js';

const mimes = Object.entries(mimetypes).reduce(
  (all, [type, exts]) =>
    Object.assign(all, ...exts.map((ext) => ({ [ext]: type }))),
  {}
);

const isRouteRequest = (pathname) => !~pathname.split('/').pop().indexOf('.');

const handleRequest = async (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);
  if (isRouteRequest(pathname)) {
    const entry = path.join(pathname, '/index.js');
    const [base, bundle] = await topLevelLoad(`http://localhost:8080/${entry}`);
    const script = `
      <script type="module">
      
        const toURL = (code, type = 'application/javascript') =>
          URL.createObjectURL(new Blob([code], { type }));

        const io = /(from|import)[ \\n]?[\/](.*?)[\/]['"](.*?)['"];?/;
        const imports = code => (code.match(new RegExp(io, 'gm')) || []).map(
          x => x.match(new RegExp(io))[3]
        );

        const remap = (file, mapping) => {
          for (const i of imports(bundle[file])) {
            if (!mapping[i]) mapping[i] = remap(i, mapping);
            bundle[file] = bundle[file].replace(i, mapping[i]);
          }
          return toURL(bundle[file]);
        }

        const bundle = Object.fromEntries(${JSON.stringify(bundle)});
        import(remap("${base}", {}));

      </script>
    `;
    res.write(script);
    res.end();
  } else {
    const ext = pathname.replace(/^.*[\.\/\\]/, '').toLowerCase();
    fs.readFile(pathname, 'binary', (err, file) => {
      if (err) {
        res.writeHead(404);
        res.end();
        return;
      }
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
