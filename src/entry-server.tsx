import { renderToPipeableStream } from "react-dom/server";
import React, { Suspense, use } from "react";
import ErrorComponent from "./page/error";

const components = {}

let pageContent = null

for (let ci in (pageContent = import.meta.glob("./page/*.tsx"))) {

  for (var si = ci.length - 1; si >= 0; si--) {
    if (ci[si] === ".") {
      break
    }
  }
  const kci = ci.slice(0, si)
  components[kci] = {
    promise: new Promise((reslove) => {
      return pageContent[ci]().then((r) => {
        components[kci].modules = r;
        reslove(r)
      })
    }),
  }
}

export async function render(url, isSSR = true, options) {
  let Component = null
  await new Promise((reslove, reject) => {
    const currentComponent = components["./page" + url];
    if (currentComponent) {
      reslove(currentComponent)
    } else {
      reject()
    }
  }).then(async (r) => {
    while (!r.modules) {
      await r.promise
    }
    Component = r.modules.default
  }).catch((r) => {
    Component = ErrorComponent
  })

  const Jsx = (<App Component={Component} />)

  return isSSR ? renderToPipeableStream(Jsx, options) : Jsx;
}

export function App({ Component: Children }) {
  const Component = React.lazy(async () => {
    const jsx = await Children()
    return Promise.resolve({
      default: () => jsx
    })
  })
  return (
    <>
      <div>
        <h1>ssr-render-app</h1>
        <Suspense fallback={<p>加载中...</p>}>
          <Component />
        </Suspense>
      </div>
    </>
  );
}


const patchUserCaches = new Map()

function patchUse(fn) {
  if (!patchUserCaches.has(fn)) {
    const jsx = fn()
    let l;
    (l = Promise.resolve(jsx)).then((r) => {
      patchUserCaches.set(fn, r)
    })
    use(l);
  }
  return patchUserCaches.get(fn)
}