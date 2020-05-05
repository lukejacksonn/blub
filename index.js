import http from 'http';
import url from 'url';
import path from 'path';

import { init } from './lib/lexer.js';
import { topLevelLoad } from './lib/loader.js';

const handleRequest = async (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);
  const entry = path.join(pathname, '/index.js');
  const [base, bundle] = await topLevelLoad(`${req.headers.referer}${entry}`);
  const script = `
      
    const toURL = (code, type = 'application/javascript') =>
      URL.createObjectURL(new Blob([code], { type }));

    const io = /(from|import)[ \\n]?[\/](.*?)[\/]['"](.*?)['"];?/;
    const imports = code => (code.match(new RegExp(io, 'gm')) || []).map(
      x => x.match(new RegExp(io))[3]
    );

    const blob = (file, mapping) => {
      for (const i of imports(bundle[file])) {
        if (!mapping[i]) mapping[i] = blob(i, mapping);
        bundle[file] = bundle[file].replace(i, mapping[i]);
      }
      return toURL(bundle[file]);
    }

    const bundle = Object.fromEntries(${JSON.stringify(bundle)});
    import(blob("${base}", {}));

  `;
  res.writeHead(200, {
    'Content-Type': 'application/javascript',
    'Access-Control-Allow-Origin': '*',
  });
  res.write(script);
  res.end();
};

(async () => {
  await init;
  http.createServer(handleRequest).listen(8080);
})();
