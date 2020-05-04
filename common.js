import fs from 'fs';
import crypto from 'crypto';

export const resolvedPromise = Promise.resolve();
export let baseUrl;

const hash = (str) => {
  // change to 'md5' if you want an MD5 hash
  var h = crypto.createHash('sha1');
  // change to 'binary' if you want a binary hash.
  h.setEncoding('hex');
  h.write(str);
  h.end();
  return h.read();
};

export function createBlob(source) {
  const uid = hash(source);
  fs.writeFileSync(`./blob/${uid}.js`, source);
  return uid;
}

const backslashRegEx = /\\/g;
export function resolveIfNotPlainOrUrl(relUrl, parentUrl) {
  // strip off any trailing query params or hashes
  parentUrl = parentUrl && parentUrl.split('#')[0].split('?')[0];
  if (relUrl.indexOf('\\') !== -1) relUrl = relUrl.replace(backslashRegEx, '/');
  // protocol-relative
  if (relUrl[0] === '/' && relUrl[1] === '/') {
    return parentUrl.slice(0, parentUrl.indexOf(':') + 1) + relUrl;
  }
  // relative-url
  else if (
    (relUrl[0] === '.' &&
      (relUrl[1] === '/' ||
        (relUrl[1] === '.' &&
          (relUrl[2] === '/' || (relUrl.length === 2 && (relUrl += '/')))) ||
        (relUrl.length === 1 && (relUrl += '/')))) ||
    relUrl[0] === '/'
  ) {
    const parentProtocol = parentUrl.slice(0, parentUrl.indexOf(':') + 1);
    // Disabled, but these cases will give inconsistent results for deep backtracking
    //if (parentUrl[parentProtocol.length] !== '/')
    //  throw new Error('Cannot resolve');
    // read pathname from parent URL
    // pathname taken to be part after leading "/"
    let pathname;
    if (parentUrl[parentProtocol.length + 1] === '/') {
      // resolving to a :// so we need to read out the auth and host
      if (parentProtocol !== 'file:') {
        pathname = parentUrl.slice(parentProtocol.length + 2);
        pathname = pathname.slice(pathname.indexOf('/') + 1);
      } else {
        pathname = parentUrl.slice(8);
      }
    } else {
      // resolving to :/ so pathname is the /... part
      pathname = parentUrl.slice(
        parentProtocol.length + (parentUrl[parentProtocol.length] === '/')
      );
    }

    if (relUrl[0] === '/')
      return (
        parentUrl.slice(0, parentUrl.length - pathname.length - 1) + relUrl
      );

    // join together and split for removal of .. and . segments
    // looping the string instead of anything fancy for perf reasons
    // '../../../../../z' resolved to 'x/y' is just 'z'
    const segmented = pathname.slice(0, pathname.lastIndexOf('/') + 1) + relUrl;

    const output = [];
    let segmentIndex = -1;
    for (let i = 0; i < segmented.length; i++) {
      // busy reading a segment - only terminate on '/'
      if (segmentIndex !== -1) {
        if (segmented[i] === '/') {
          output.push(segmented.slice(segmentIndex, i + 1));
          segmentIndex = -1;
        }
      }

      // new segment - check if it is relative
      else if (segmented[i] === '.') {
        // ../ segment
        if (
          segmented[i + 1] === '.' &&
          (segmented[i + 2] === '/' || i + 2 === segmented.length)
        ) {
          output.pop();
          i += 2;
        }
        // ./ segment
        else if (segmented[i + 1] === '/' || i + 1 === segmented.length) {
          i += 1;
        } else {
          // the start of a new segment as below
          segmentIndex = i;
        }
      }
      // it is the start of a new segment
      else {
        segmentIndex = i;
      }
    }
    // finish reading out the last segment
    if (segmentIndex !== -1) output.push(segmented.slice(segmentIndex));
    return (
      parentUrl.slice(0, parentUrl.length - pathname.length) + output.join('')
    );
  }
}

/*
 * Import maps implementation
 *
 * To make lookups fast we pre-resolve the entire import map
 * and then match based on backtracked hash lookups
 *
 */
export const emptyImportMap = { imports: {}, scopes: {} };

export function resolveUrl(relUrl, parentUrl) {
  return (
    resolveIfNotPlainOrUrl(relUrl, parentUrl) ||
    (relUrl.indexOf(':') !== -1
      ? relUrl
      : resolveIfNotPlainOrUrl('./' + relUrl, parentUrl))
  );
}

export async function hasStdModule(name) {
  try {
    await dynamicImport(name);
    return true;
  } catch (e) {
    return false;
  }
}

async function resolveAndComposePackages(
  packages,
  outPackages,
  baseUrl,
  parentMap,
  parentUrl
) {
  outer: for (let p in packages) {
    const resolvedLhs = resolveIfNotPlainOrUrl(p, baseUrl) || p;
    let target = packages[p];
    if (typeof target === 'string') target = [target];
    else if (!Array.isArray(target)) continue;

    for (const rhs of target) {
      if (typeof rhs !== 'string') continue;
      const mapped = resolveImportMap(
        parentMap,
        resolveIfNotPlainOrUrl(rhs, baseUrl) || rhs,
        parentUrl
      );
      if (
        mapped &&
        (!mapped.startsWith('std:') || (await hasStdModule(mapped)))
      ) {
        outPackages[resolvedLhs] = mapped;
        continue outer;
      }
    }
    targetWarning(p, packages[p], 'bare specifier did not resolve');
  }
}

export async function resolveAndComposeImportMap(json, baseUrl, parentMap) {
  const outMap = {
    imports: Object.assign({}, parentMap.imports),
    scopes: Object.assign({}, parentMap.scopes),
  };

  if (json.imports)
    await resolveAndComposePackages(
      json.imports,
      outMap.imports,
      baseUrl,
      parentMap,
      null
    );

  if (json.scopes)
    for (let s in json.scopes) {
      const resolvedScope = resolveUrl(s, baseUrl);
      await resolveAndComposePackages(
        json.scopes[s],
        outMap.scopes[resolvedScope] || (outMap.scopes[resolvedScope] = {}),
        baseUrl,
        parentMap,
        resolvedScope
      );
    }

  return outMap;
}

function getMatch(path, matchObj) {
  if (matchObj[path]) return path;
  let sepIndex = path.length;
  do {
    const segment = path.slice(0, sepIndex + 1);
    if (segment in matchObj) return segment;
  } while ((sepIndex = path.lastIndexOf('/', sepIndex - 1)) !== -1);
}

function applyPackages(id, packages) {
  const pkgName = getMatch(id, packages);
  if (pkgName) {
    const pkg = packages[pkgName];
    if (pkg === null) return;
    if (id.length > pkgName.length && pkg[pkg.length - 1] !== '/')
      targetWarning(pkgName, pkg, "should have a trailing '/'");
    else return pkg + id.slice(pkgName.length);
  }
}

function targetWarning(match, target, msg) {
  console.warn(
    'Package target ' + msg + ", resolving target '" + target + "' for " + match
  );
}

export function resolveImportMap(importMap, resolvedOrPlain, parentUrl) {
  let scopeUrl = parentUrl && getMatch(parentUrl, importMap.scopes);
  while (scopeUrl) {
    const packageResolution = applyPackages(
      resolvedOrPlain,
      importMap.scopes[scopeUrl]
    );
    if (packageResolution) return packageResolution;
    scopeUrl = getMatch(
      scopeUrl.slice(0, scopeUrl.lastIndexOf('/')),
      importMap.scopes
    );
  }
  return (
    applyPackages(resolvedOrPlain, importMap.imports) ||
    (resolvedOrPlain.indexOf(':') !== -1 && resolvedOrPlain)
  );
}
