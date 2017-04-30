require('../sass/app.scss');

import restful, {fetchBackend} from 'restful.js';
import React from 'react';
import ReactDom from 'react-dom';
import UserForm from './UserForm';

class app extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            UUID: null

        };
        this.api = restful('http://104.196.12.181', fetchBackend(fetch));
    }

    autoSave() {
        console.log('saving');
    }

    signUp(data) {
        console.log(data);
        this.setState({
            UUID: this.getUUID()
        });
        this.autoSave();
    }

    // rfc4122, version 4 form
    getUUID() {
        let chars = '0123456789ABCDEF', uuid = [], i, r;
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random() * 16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }

        return uuid.join('');
    }

    render() {
        return (
            <UserForm app={this}/>
        );
    }
}

ReactDOM.render(<app />, document.getElementById('app'));




