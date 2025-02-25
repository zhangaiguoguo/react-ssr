import React, { useState, use, Suspense } from "react"
import ReactDOM from "react-dom/client"
import BBB from "./src/components/bbb.tsx"
let a;

function ab() {
    if (a) {
        return a;
    }
    return a = new Promise((resolve, reject) => {
        setTimeout(() => {
            Math.random() > 0 ? resolve('success') : reject('error')
        }, 1000)

    })
}

function App() {
    const [num, setNum] = useState(1)
    console.log(use(ab()))
    return <>
        <div>
            app12
            <button onClick={() => setNum(num + 1)}>点击 - {num}</button>
            <B />
            <BBB />
        </div>
    </>
}

function B() {

    return <div>B</div>
}

ReactDOM.createRoot(document.getElementById("app")).render(<>
    <Suspense fallback={<p>加载中...</p>} error={<p>失败了</p>}>
        <App />
    </Suspense>
</>)

console.log(import.meta.hot)

import.meta.hot.on("vite:beforeUpdate", (...args) => {
    console.log(args);
});

if (import.meta.hot) {
    import.meta.hot.accept("./src/components/bbb.tsx", (newModule) => {
        if (newModule) {
            //  当语法错误发生时，newModule 是 undefined
            console.log('updated: count is now ', newModule.count)
        }
    })
    import.meta.hot.dispose((data) => {
      // 清理副作用
      console.log(data)
    })
}