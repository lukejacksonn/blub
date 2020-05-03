import fs from 'fs';
import http from 'http';
import url from 'url';
import path from 'path';
import mimetypes from './types.js';
import directoryTree from './directory-tree.js';
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
    const filetree = directoryTree(pathname || '.');
    const load = await topLevelLoad(`http://localhost:8080/${entry}`);
    let blobs = fs
      .readdirSync('blob')
      .map((x) => [
        x,
        encodeURIComponent(fs.readFileSync(path.join('blob/', x))),
      ]);
    res.write(`
        <script type="module">
          let blobs = ${JSON.stringify(blobs)}
          blobs = Object.fromEntries(blobs.map(([k,v]) => [k, decodeURIComponent(v)]))

          function toURL(code, type = 'application/javascript') {
              return URL.createObjectURL(
                  new Blob([code], { type })
              );
          }

          const importExportRegex = /(from|import)[ \\n]?[\/](.*?)[\/]['"](.*?)['"];?/;
          const importsForCode = code => (code.match(new RegExp(importExportRegex, 'gm')) || []).map(
            x => x.match(new RegExp(importExportRegex))[3]
          );

          const walkTree = (currFile, mapping) => {
            const b = currFile + '.js';
            let imports = importsForCode(blobs[b]);
            for (const i of imports) {
              const blob = mapping[i];
              if (!blob) mapping[i] = walkTree(i, mapping);
              blobs[b] = blobs[b].replace(new RegExp(i, 'g'), mapping[i])
            }
            return toURL(blobs[b]);
          }

          import(walkTree("${load.b}", {}))
          </script>
      `);
    // console.log(${JSON.stringify(filetree)})
    // import("${await flatten(entry)}")
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
