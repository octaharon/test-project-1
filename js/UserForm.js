require('../sass/UserForm.scss');
import React from 'react';

class UserForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            firstName: props.firstName || '',
            lastName: props.lastName || '',
            email: props.email || '',
            revalidate: false
        };
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
        for (key of Object.keys(this.state)) {
            if (!this.isValidField(key))
                return false;
        }
        this.setState({revalidate: false});
        return true;
    }

    render() {
        return (
            <div className="user-form">
                <div className="user-field">
                    <label for="user-email">E-Mail</label>
                    <input type="text" id="user-email" value={this.state.email}
                           onChange={this.onEmailChange.bind(this)}/>
                    {this.state.revalidate && !isValidField('email') &&
                    <span className='error'>Invalid e-mail</span>
                    }
                </div>
                <div className="user-field">
                    <label for="user-firstname">First name</label>
                    <input type="text" id="user-firstname" value={this.state.firstName}
                           onChange={this.onFirstNameChange.bind(this)}/>
                    {this.state.revalidate && !isValidField('firstName') &&
                    <span className='error'>First name can't be empty</span>
                    }
                </div>
                <div className="user-field">
                    <label for="user-firstname">Last name</label>
                    <input type="text" id="user-lastname" value={this.state.lastName}
                           onChange={this.onLastNameChange.bind(this)}/>
                    {this.state.revalidate && !isValidField('lastName') &&
                    <span className='error'>Last name can't be empty</span>
                    }
                </div>
                {this.props.app && !this.props.app.state.UUID &&
                <div className="user-field">
                    <div className="button" onClick={this.signUp.bind(this)}>Sign up</div>
                </div>
                }
            </div>
        );
    }

    onFirstNameChange(e) {
        this.setState({
            firstName: e.target.value.trim().replace(/\s+/, ' '),
            revalidate: true
        });
    }

    onLastNameChange(e) {
        this.setState({
            lastName: e.target.value.trim().replace(/\s+/, ' '),
            revalidate: true
        });
    }

    onEmailChange(e) {
        this.setState({
            email: e.target.value.trim().replace(/\s+/, ''),
            revalidate: true
        });
    }

    signUp(e) {
        if (this.isValidForm() && this.props.app) {
            this.props.app.signUp(this.state);
        }
    }
}

export default UserForm;

