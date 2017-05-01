import React from 'react';
import restful, {fetchBackend} from 'restful.js';

let instance = null;
//Stateless service
class API {
    constructor() {
        if (!instance) {
            this.api = restful('http://104.196.12.181', fetchBackend(fetch));
            instance = this;
        }
        return instance;
    }
}

let apiSingleton = new API();
let api = apiSingleton.api;

export default api;