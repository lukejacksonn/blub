# Blub

> analyze and flatten es module dependency graphs on the server

Building large javascript programs has never been so easy since es module landed as a JS language feature. There is now official syntax that allows files now reference dependencies which are to be fetched, parsed, linked and evaluated at runtime. This nearly renders the need for a full blown bundler (like rollup or webpack) obsolete in a low latency environment but relying on this "no build" approach when distributing same program over a network can prove problematic.

The intention of this project is to explore and implement a server side solution that mitigates the _request waterfall_ problem associated with resolving es module graphs in the browser.

For now the implementation is in node but eventually I hope to have this working in a Cloudflare worker and paired with the client side component running in a service worker.

Initial inspiration came from https://docs.google.com/document/d/11t4Ix2bvF1_ZCV9HKfafGfWu82zbOD7aUhZ_FyDAgmA/edit#

## General Approach

Previously I have used and witnessed `es-module-shims` take an entry point to a module and (from within the browser) at runtime, fetch a file, parse it for import statements and recursivley create object urls from blobs for all the dependencies in a graph, essentially mimicing how modern browsers handle dependency resolution (which makes sense as the library was developed as a polyfill of sorts for such tasks).

Being able to mimic the import and dependency resolution of browsers is great but doing this in a modern browser doesn't get you very much. The browser still has to fetch and parse each dependency which generates network resuests recursively.. introducting the _waterfall problem_.

> But what if we could do all the dependency resolution – fetching, parsing, linking – on the server?

A high level overview of the steps involved to do dependency resolution on the server:

1. Resolve dependency graph for a file at a given location using fetch on the server
2. Create blobs as files (rather then url objects) for every dependency in the dependency graph
3. Rewrite import paths for every file in the dependency graph to point at the corresponding blob
4. Create a bundle object which consists of a mapping between blob key and source code for each dependency

Now the server has all the code that the module needs to respond to the request, something like:

```js
const bundle = {
  a: `
    import b from 'b';
    import c from 'c';

    console.log(b + c); // => 6
  `,
  b: `export default 2`,
  c: `export default 3`,
};
```

Notice that the contents of each file hasn't just been squashed into one big file like you might expect; only the import paths have been rewritten and modules now reference each other using blob keys instead of file paths.

All that is left to do by the browser is to execute the code at the bundle root.

But there are two problems here:

- You can't import plain text as the browser requires explicitly a `text/javascript` mimetype.
- You can't import bare module specifiers like `a` as the browser doesn't know where to find them

So what is required is for the browser to unpack the bundle. Essentially this involves:

1. Creating an object url for each module included the bundle
2. Rewrite the imports of every module in the graph to point at the newly created blob

This is done in a recursive fashion so that all imports in a module get rewritten before creating a blob for it.

```js
const toURL = (code, type = 'application/javascript') =>
    URL.createObjectURL(new Blob([code], { type }));

const blob = (file, mapping = {}) => {
    for (const i of imports(bundle[file])) {
    if (!mapping[i]) mapping[i] = blob(i, mapping);
        bundle[file] = bundle[file].replace(i, mapping[i]);
    }
    return toURL(bundle[file]);
}

const bundle = Object.fromEntries(${JSON.stringify(bundle)});
import(blob("kbkb23u4u3h324kb23k4bjk23n4"));
```

Now the base blob can be passed to `import` (static or dynamic) for evaluation. The bundle root after this process has taken place would look something like this:

```js
import b from 'blob:http://localhost:1337/431f34f34-389fy893y-iu3gfiugi3g-i3u4ifuh3ih';
import c from 'blob:http://localhost:1337/431f34f34-389fy893y-iu3gfiugi3g-i3u4ifuh3ih';

console.log(b + c); // => 6
```

The main advantage of this approach over a traditional bundler is that the scripts in the bundle haven't been hoisted into one big module scope then, which means, in theory, they can be reused by subsequently loaded modules. That is, the browser could communicate to the server what it has already received and make sure those recouses aren't sent down as part of future bundles.

Another benefit of this approach is that import maps can be supported at a server level so for example:

```json
{
  "preact": "https://unpkg.com/browse/preact@10.4.1/dist/preact.module.js"
}
```

This would tell the bundler that whenever it encounters the bare module specifier `preact` then it should use the file that exists at `https://unpkg.com/browse/preact@10.4.1/dist/preact.module.js`. Every resource that gets seen by the server can be cached both in memory or as a blob file making second and subsequent requests almost instantaneous.

Some of the aforementioned behaviours have been implmented currently and should _just work_ but this project is still a work in progress, some thing might be impossible (or never get implemented) but keep checking back for updates!

## Initial Findings

Although this project is far from production ready, initial tests have rendered promising results. You can expect to see a 4-5x speedup between loading an unbundled and bundled module over a simulated "Slow 3G" connection and 6x CPU slowdown for an entry point with a dependency graph that includes just a few files.

<details>
<summary>Small Module (~25 files)</summary>
<br>

#### Bundled

![Small Module Bundled](https://user-images.githubusercontent.com/1457604/81104321-3df2f900-8f0a-11ea-8b2e-6258e6b0b26a.png)

#### Unbundled

![Small Module not Bundled](https://user-images.githubusercontent.com/1457604/81104333-40555300-8f0a-11ea-894c-06ec7a5b0ad9.png)

</details>

<details>
<summary>Large Module (~85 files)</summary>
<br>

#### Bundled

![Large Module Bundled](https://user-images.githubusercontent.com/1457604/81104592-a93ccb00-8f0a-11ea-9727-6e0663fadabf.png)

#### Unbundled

![Large Module not Bundled](https://user-images.githubusercontent.com/1457604/81104599-ac37bb80-8f0a-11ea-8c84-19bcca8e239e.png)

</details>

## Local Development

To develop the project locally, first clone the project then run the following command at the project root. This will start a service on `http://localhost:8080` that accepts requests for a file from a referrer:

```
npm start
```

> This script invokes nodemon that restarts the process when files change (excluding `blob/*` and `test/*`)

To test the service, you will need to make a request from another server that has access to the file you want to run Blub on. This can be done by running the following command at the project root:

```
npm test
```

A browser window should open that serves `/test/index.html` which can be edited to point at a specific test:

```html
<script type="module">
  import './two/index.js'; // unbundled
  import 'http://localhost:8080/two/index.js'; // bundled
</script>
```

> Live reload is enabled on the tests directory so when files change the browser will refresh automatically

- To load a test case **unbundled** point to the index file with a relative path like `./two/index.js`
- To load a test case **bundled** prefix the path with the url of the Blub server `http://localhost:8080/two/index.js`

There are currently three tests aptly names test `one`, `two` and `three`. Test `one` is the simplest, a hand made dummy modules that just imports local files and outputs console logs. Tests `two` and `three` and auto generated dummy projects that require modules from unpkg as well as local files, these tests render themselves to the `<main></main>` element.

## Contributing

As always if you have any ideas then please feel free to create an issue or PR to discuss the idea further. I have a lot on my plate but will try to respond with comments at least in a timely manner.

Thisngs I would like to work on include:

- Make the server component run as a cloudflare worker
- Make the client side linking happen in a service worker
- Invalidating the blub server cache if files change (useful for development potentially not required if only intended for use in production with immutable releases like on npm or unpkg).
- Enabling import maps on the server (should be possible with the code that exists just haven't had time to wire it all up yet)
- Implementing a way of the browser communicating to the server what resources have already been received (potentially in headers or query string which will require a more invlolved client component)
