import fs from 'fs';
import http from 'http';
import url from 'url';
import mimetypes from './types.js';
import directoryTree from './directory-tree.js';
import { init, parse } from './lexer.js';

const mimes = Object.entries(mimetypes).reduce(
  (all, [type, exts]) =>
    Object.assign(all, ...exts.map((ext) => ({ [ext]: type }))),
  {}
);

// function toURL(code, type = 'application/javascript') {
//   return URL.createObjectURL(new Blob([code], { type }));
// }

const toURL = (code) =>
  'data:text/javascript;base64,' +
  Buffer.from(code, 'utf-8').toString('base64');

const isRouteRequest = (pathname) => !~pathname.split('/').pop().indexOf('.');

const handleRequest = (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);
  console.log(pathname);
  if (isRouteRequest(pathname)) {
    // file system to json
    // module dependency tree
    const source = fs.readFileSync(`${pathname || '.'}/index.js`, 'utf-8');
    const dependencies = parse(source)[0].reduce(
      (a, i) => ({ ...a, [source.substring(i.s, i.e)]: [i, source] }),
      {}
    );
    const filetree = directoryTree(pathname || '.');
    const mod = toURL(
      Object.keys(dependencies).reduce(
        (a, b) => a.replace(b, toURL('export default 5')),
        source
      )
    );
    res.write(`
        <script type="module">
            console.log("${mod}")
            console.log(${JSON.stringify(dependencies)})
            console.log(${JSON.stringify(filetree)})
            // import("${pathname === '' ? '' : `/${pathname}`}/index.js")
            import("${mod}")
        </script>
    `);
    res.end();
  } else {
    const ext = pathname.replace(/^.*[\.\/\\]/, '').toLowerCase();
    fs.readFile(pathname, 'binary', (err, file) => {
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
  // const tree = go('./src/index.js');
  // console.dir(tree, { depth: 1000 });

  http.createServer(handleRequest).listen(8080);

  // Returns "asdf"
  //   source.substring(imports[0].s, imports[0].e);
  //   // Returns "import { a } from 'asdf';"
  //   source.substring(imports[0].ss, imports[0].se);

  //   // Returns "p,q"
  //   exports.toString();

  //   // Dynamic imports are indicated by imports[1].d > -1
  //   // In this case the "d" index is the start of the dynamic import
  //   // Returns true
  //   imports[1].d > -1;

  //   // Returns "'asdf'"
  //   source.substring(imports[1].s, imports[1].e);
  //   // Returns "import /*comment!*/ ("
  //   source.substring(imports[1].d, imports[1].s);

  //   // import.meta is indicated by imports[2].d === -2
  //   // Returns true
  //   imports[2].d === -2;
  //   // Returns "import /*comment!*/.meta"
  //   source.substring(imports[2].s, imports[2].e);
})();
