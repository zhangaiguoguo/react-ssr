import { delay } from "../utils"
import BBB from "../components/bbb"
import React, { Suspense, useState } from "react"

const AAA = React.lazy(async () => {
    await delay(1000);
    return await import("../components/bbb")
})

export default async function User(params) {

    await delay()

    return (
        <div>
            user
            {new Array(10).fill(1).map((_, i) => {
                return (<>
                    <BBB key={i + 1} />
                </>)
            })}
            <BBB />
            <Suspense fallback={<p>加载中...</p>}>
                <AAA />
            </Suspense>
        </div>
    )
}