import { hydrateRoot } from "react-dom/client"
import React from "react";
import { render } from "./entry-server"

let app;

window.addEventListener("popstate", function (event) {
    to(location.pathname)
})

window.addEventListener('load', function () {
    to(location.pathname)
})

function to(path) {
    render(path, false).then((App) => {
        const app2 = app
        if (typeof App === "function") {

        } else {
            const PrevApp = App
            App = () => PrevApp
        }
        app = app || hydrateRoot(document.querySelector("#app"), (<App />))
        app2 && app.render(<App />)
    })
}

(function () {
    var originalPushState = history.pushState;
    var originalReplaceState = history.replaceState;

    function emitEvent(type) {
        var event = new Event(type);
        window.dispatchEvent(event);
    }

    history.pushState = function (state, title, url) {
        originalPushState.apply(history, arguments);
        emitEvent('pushstate');
    };

    history.replaceState = function (state, title, url) {
        originalReplaceState.apply(history, arguments);
        emitEvent('replacestate');
    };
})();

// 监听自定义事件
window.addEventListener('pushstate', function () {
    to(location.pathname)
});

window.addEventListener('replacestate', function () {
    to(location.pathname)
});