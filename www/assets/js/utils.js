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

const postJSON = (url) => {
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
        xhr.send();
    })
};


const getPriceData = (symbol) => {
    return getJSON(`/data/analysis/${symbol}.json`)
}
const getChangeData = (symbol) => {
    return getJSON(`/data/analysis/${symbol}-change.json`);
}

export default {
    getJSON,
    postJSON,
    getPriceData,
    getChangeData,
}