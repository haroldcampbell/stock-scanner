const getJSON = (url) => {
    return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'json';

        xhr.onload = function () {
            const status = xhr.status;

            if (status >= 200 && status < 300) {
                resolve(xhr.response);
            } else {
                reject({ status: status, statusText: xhr.response });
            }
        };
        xhr.onerror = function () {
            reject({
                status: xhr.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    })
};

const postJSON = (url, formDataCallback = undefined) => {
    return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open('Post', url, true);
        xhr.responseType = 'json';

        xhr.onload = function () {
            const status = xhr.status;

            if (status >= 200 && status < 300) {
                resolve(xhr.response);
            } else {
                reject({ status: status, statusText: xhr.response });
            }
        };
        xhr.onerror = function () {
            reject({
                status: xhr.status,
                statusText: xhr.statusText
            });
        };

        let formData = undefined;
        if (formDataCallback !== undefined) {
            formData = formDataCallback();
        }

        xhr.send(formData);
    })
};


const getPriceData = (symbol) => {
    return getJSON(`/data/analysis/${symbol}.json`)
}
const getChangeData = (symbol) => {
    return getJSON(`/data/analysis/${symbol}-change.json`);
}

function postURLAction(postURL, actionCallback, formDataCallback = undefined) {
    return (btn, $event) => {
        postJSON(postURL, formDataCallback)
            .then(data => {
                if (actionCallback !== undefined) {
                    actionCallback(data)
                }
            });
    }
}

function wireButtonByID(buttonID, actionCallback) {
    const btn = document.getElementById(buttonID);

    if (btn === null) {
        console.warn("[wireButtonByID] Button not found: ", buttonID, postURL);
        return;
    }
    btn.onclick = (e) => {
        actionCallback(btn, e)
    }
}

function createButton(container, text, postURL, actionCallback, formDataCallback = undefined) {
    let child = document.createElement("button");
    child.innerText = text;
    child.onclick = (e) => {
        postJSON(postURL, formDataCallback)
            .then(data => {
                if (actionCallback !== undefined) {
                    actionCallback(data)
                }
            });
    }
    container.appendChild(child);
}

export default {
    getJSON,
    postJSON,
    getPriceData,
    getChangeData,
    wireButtonByID,
    postURLAction,
    createButton,
}