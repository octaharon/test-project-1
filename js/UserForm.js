require('../sass/UserForm.scss');

import React from 'react';
import API from './API';
import PropTypes from 'prop-types';


const propTypes = {
    onSignup: PropTypes.func,
    UUID: PropTypes.string
};

/**
 * @property UUID
 * @property onSignup
 */
class UserForm extends React.Component {


    constructor(props) {
        super(props);
        this.state = {
            firstName: '',
            lastName: '',
            email: '',
            revalidate: false
        };
        this.api = API.custom('userconfig');
        this.autosave = this.autosave.bind(this);
    }

    loadData(UUID) {
        this.api.one('info', UUID).get().then((response) => {
            let state = response.body().data();
            state.revalidate = false;
            this.setState(state);
        }).catch((err) => {
            console.log(err);
            alert("Connection error");
        });
    }

    componentDidMount() {
        if (this.props.UUID)
            this.loadData(this.props.UUID);
    }

    componentWillReceiveProps(nextProps) {
        let UUID = nextProps.UUID;
        if (UUID && UUID != this.props.UUID)
            this.loadData(UUID);
    }


    isEmail(value) {
        let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(value);
    }

    isValidField(value) {
        if (this.state[value] !== undefined) {
            if (value == 'email')
                return this.isEmail(this.state.email);
            return this.state[value].length;
        }
        return false;
    }


    isValidForm() {
        this.setState({revalidate: true});
        for (let item of ['firstName', 'lastName', 'email']) {
            if (!this.isValidField(item))
                return false;
        }
        this.setState({revalidate: false});
        return true;
    }

    // rfc4122, version 4 form
    getUUID() {
        let chars = '0123456789abcdef', uuid = [], i, r;
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random() * 16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }

        return uuid.join('').toLowerCase();
    }

    apiSave(UUID) {
        let {revalidate, ...request}=this.state;
        return this.api.one('info', UUID).put(request);
    }

    autosave() {
        if (!this.props.UUID || !this.state.revalidate || !this.isValidForm())
            return false;
        this.apiSave(this.props.UUID).then(function (response) {
            console.log('saved');
        }.bind(this)).catch((err) => {
            console.log(err);
            alert("Connection error");
        });
    }


    onFirstNameChange(e) {
        this.setState({
            firstName: e.target.value.trim().replace(/\s+/, ' ')
        });
        if (this.props.UUID)
            this.setState({revalidate: true});
    }

    onLastNameChange(e) {
        this.setState({
            lastName: e.target.value.trim().replace(/\s+/, ' '),
        });
        if (this.props.UUID)
            this.setState({revalidate: true});
    }

    onEmailChange(e) {
        this.setState({
            email: e.target.value.trim().replace(/\s+/, ''),
        });
        if (this.props.UUID)
            this.setState({revalidate: true});
    }

    signUp(e) {
        if (this.props.UUID)
            return false;
        if (this.isValidForm()) {
            {
                let UUID = this.getUUID();
                let {revalidate, ...request}=this.state;
                this.apiSave(UUID).then(function (response) {
                    if (this.props.onSignup instanceof Function)
                        this.props.onSignup(UUID);
                }.bind(this)).catch((err) => {
                    console.log(err);
                    alert("Connection error");
                });
                return
            }
        }
        return false;
    }

    signOut(e) {
        if (!this.props.UUID)
            return false;
        this.setState({
            firstName: '',
            lastName: '',
            email: '',
            revalidate: false
        });
        if (this.props.onSignup instanceof Function) {
            return this.props.onSignup(null);
        }
        return true;
    }

    keyHandler(e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            if (this.props.UUID)
                this.autosave(e);
            else
                this.signUp(e);
        }
    }

    render() {
        return (
            <form onKeyDown={this.keyHandler.bind(this)}>
                <div className="user-form">

                    <div className="user-field">
                        <label htmlFor="user-email">E-Mail</label>
                        <input type="text" id="user-email" value={this.state.email}
                               onChange={this.onEmailChange.bind(this)} onBlur={this.autosave}/>
                        {this.state.revalidate && !this.isValidField('email') &&
                        <span className='error'>Invalid e-mail</span>
                        }
                    </div>
                    <div className="user-field">
                        <label htmlFor="user-firstname">First name</label>
                        <input type="text" id="user-firstname" value={this.state.firstName}
                               onChange={this.onFirstNameChange.bind(this)} onBlur={this.autosave}/>
                        {this.state.revalidate && !this.isValidField('firstName') &&
                        <span className='error'>First name can't be empty</span>
                        }
                    </div>
                    <div className="user-field">
                        <label htmlFor="user-firstname">Last name</label>
                        <input type="text" id="user-lastname" value={this.state.lastName}
                               onChange={this.onLastNameChange.bind(this)} onBlur={this.autosave}/>
                        {this.state.revalidate && !this.isValidField('lastName') &&
                        <span className='error'>Last name can't be empty</span>
                        }
                    </div>

                    <div className="user-field collapse">
                        {!this.props.UUID ? (
                                <div className="button" onClick={this.signUp.bind(this)}>Sign up</div>
                            ) : (
                                <a href="javascript:;" onClick={this.signOut.bind(this)}>
                                    <i className="fa fa-user">&nbsp;</i>Sign out
                                </a>
                            )
                        }
                    </div>
                </div>
            </form>

        );
    }
}

UserForm.propTypes = propTypes;

export default UserForm;

