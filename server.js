import fs from 'fs';
import http from 'http';
import url from 'url';
import path from 'path';
import mimetypes from './types.js';
import directoryTree from './directory-tree.js';
import { init, parse } from './lexer.js';

import { topLevelLoad } from './es-module-shims.js';

const mimes = Object.entries(mimetypes).reduce(
  (all, [type, exts]) =>
    Object.assign(all, ...exts.map((ext) => ({ [ext]: type }))),
  {}
);

const toURL = (code) =>
  'data:text/javascript;base64,' +
  Buffer.from(code, 'utf-8').toString('base64');

const removeFileName = (x) => x.split('/').slice(0, -1).join('/');
const isExternal = (x) => x.startsWith('http');

const flatten = async (file) => {
  const folder = removeFileName(file);
  const source = fs.readFileSync(file, 'utf-8');
  const [imports] = parse(source);
  const contents = await imports.reduce(async (a, i) => {
    const code = await a;
    const relative = source.substring(i.s, i.e);
    const absolute = isExternal(relative)
      ? relative
      : path.resolve(folder, relative);
    const escape =
      'http://localhost:8080/' + path.relative(process.cwd(), absolute);
    const flat = !isExternal(relative) && (await flatten(absolute));
    return code.replace(relative, isExternal(relative) ? relative : flat);
  }, Promise.resolve(source));
  return toURL(contents);
};

const isRouteRequest = (pathname) => !~pathname.split('/').pop().indexOf('.');

const handleRequest = async (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);
  if (isRouteRequest(pathname)) {
    const entry = path.join(process.cwd(), pathname, '/index.js');
    const filetree = directoryTree(pathname || '.');

    // fs.readdir('blob', (err, files) => {
    //   if (err) throw err;
    //   for (const file of files) {
    //     fs.unlink(path.join('blob', file), (err) => {
    //       if (err) throw err;
    //     });
    //   }
    // });

    topLevelLoad('http://localhost:8080/test1/index.js').then((load) => {
      let blobs = fs.readdirSync('blob');
      blobs = blobs.map((x) => [
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

          const getCode = key => blobs[key]

          const walkTree = (currFile, mapping) => {
            let imports = importsForCode(blobs[currFile + '.js']);
            for (const i of imports) {
              const blob = mapping[i];
              if (!blob) mapping[i] = walkTree(i, mapping);
              blobs[currFile + '.js'] = blobs[currFile + '.js'].replace(new RegExp(i, 'g'), mapping[i])
            }
            console.log(blobs[currFile + '.js']);
            return toURL(blobs[currFile + '.js']);
          }

          import(walkTree("${load.b}", {}))
          </script>
          `);
      // console.log(${JSON.stringify(filetree)})
      // import("${await flatten(entry)}")
      res.end();
    });
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
