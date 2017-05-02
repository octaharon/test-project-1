import restful, {fetchBackend} from 'restful.js';
import config from '../config.json';

let instance = restful(config.apiBaseUrl, fetchBackend(fetch));

export default instance;