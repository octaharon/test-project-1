require('../sass/app.scss');

import 'font-awesome/scss/font-awesome.scss';
import restful, {fetchBackend} from 'restful.js';
import React from 'react';
import ReactDOM from 'react-dom';
import cookie from 'react-cookie';
import ReactSpinner from 'react-spinjs';
import UserForm from './UserForm';
import GroupList from './GroupList'

/**
 * Prototype.js is back!
 */
var $ = id => document.getElementById(id);
Element.prototype.hide = function () {
    this.style.visibility = 'hidden';
};
Element.prototype.show = function () {
    this.style.visibility = 'visible';
};

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            UUID: null

        };
        this.api = restful('http://104.196.12.181', fetchBackend(fetch));
    }

    componentDidMount() {
        $('modal-backdrop').hide();
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
            <div className="wrapper">
                <div id="modal-backdrop">
                    <ReactSpinner />
                </div>
                <UserForm app={this}/>
                <GroupList uuid={this.state.UUID}/>
            </div>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('app'));




