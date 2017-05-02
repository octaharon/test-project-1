import restful, {fetchBackend} from 'restful.js';
import config from '../config.json';

let url = config.apiBaseUrl;
if (typeof ENV_TEST !== 'undefined' && ENV_TEST) {
    url = config.apiBaseUrl_test;
    console.warn(`API is in test mode, resolving to ${url}`);
}
let instance = restful(url, fetchBackend(fetch));

export default instance;