import React, { useState } from "react"

export default function BBB() {
    const [num, setNum] = useState(1)
    return <>
        <div>
            bbb1223332
            <button onClick={() => setNum(num + 1)}>点击 - {num}</button>
        </div>2
    </>
}


export const count = 2