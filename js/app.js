require('../sass/app.scss');

import 'font-awesome/scss/font-awesome.scss';
import React from 'react';
import ReactDOM from 'react-dom';
import Cookies from 'universal-cookie';
import ReactSpinner from 'react-spinjs';
import UserForm from './UserForm';
import API from './API';
import GroupList from './GroupList'

const AuthExpirationTime = 24 * 60 * 60 * 1000; //ms
const cookies = new Cookies();

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            UUID: null
        };
        API.on('request', function () {
            this.setState({loading: true});
        }.bind(this));
        API.on('response', function () {
            this.setState({loading: false});
        }.bind(this));
        API.on('error', function () {
            this.setState({loading: false});
        }.bind(this));

    }

    componentDidMount() {
        this.setState({loading: false});
        let UUID = cookies.get('UUID');
        if (UUID) {
            this.setState({UUID});
        }
    }

    signUp(UUID) {
        if (UUID === null) //Clear authentication
        {
            cookies.remove('UUID', {path: '/'});
            this.setState({UUID: null});
            return true;
        }
        cookies.set('UUID', UUID, {path: '/', expires: new Date(Date.now() + AuthExpirationTime)});
        this.setState({UUID});
    }


    render() {
        return (
            <div className="wrapper">
                <div id="modal-backdrop" style={this.state.loading ? {} : {display: 'none'}}>
                    <ReactSpinner />
                </div>
                <UserForm UUID={this.state.UUID} onSignup={this.signUp.bind(this)}/>
                {this.state.UUID != null &&
                <GroupList UUID={this.state.UUID}/>
                }
            </div>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('app'));




