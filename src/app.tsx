import * as React from 'react';
import * as ReactDomServer from 'react-dom/server';

export function App() {
    React.use(function(){})
    return <>
        <h1>esbuild</h1>
    </>
}

console.log(ReactDomServer.renderToString(<App />))