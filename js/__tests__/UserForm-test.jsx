import React from 'react';
import expect from 'expect';
import ReactTestUtils from 'react-dom/test-utils';
import ConsoleHelper from './console-helper';
import TestHelper from './test-helpers';
import UserForm from '../UserForm';


describe("UserForm", function () {

    let customUUID = "abcdef12-3456-7890-abcd-ef1234567890";
    let mockData = {
        "email": "email@example.com",
        "firstName": "Name",
        "lastName": "Surname"
    };
    let validateConsoleErrors = true;
    let mockApi = {
        one: (path, uuid) => {
            expect(path).toEqual('info');
            expect(uuid).toEqual(customUUID);
            return {
                put: (data) => {
                    expect(data).toEqual(mockData);
                    return Promise.resolve({
                        statusCode: () => 204,
                        body: () => {
                            return {
                                data: () => ''
                            }
                        },
                        headers: () => []
                    });
                },
                get: () => {
                    return Promise.resolve({
                        statusCode: () => 200,
                        body: () => {
                            return {
                                data: () => JSON.parse(JSON.stringify(mockData))
                            }
                        },
                        headers: () => []
                    });
                }
            }
        }
    };

    let hooks = {
        onSignup: expect.createSpy()
    };

    UserForm.prototype.componentDidMount = UserForm.prototype.componentDidMount.wrap(function (originalMethod) {
        this.api = mockApi;
        originalMethod();
    });

    UserForm.prototype.onApiLoad = UserForm.prototype.onApiLoad.wrap(function (originalMethod, response) {
        originalMethod(response);
        if (this.afterloadCallback instanceof Function)
            this.afterloadCallback(this);
    });

    UserForm.prototype.onApiUpdate = UserForm.prototype.onApiUpdate.wrap(function (originalMethod, response) {
        originalMethod(response);
        if (this.aftersaveCallback instanceof Function)
            this.aftersaveCallback(this);
    });

    class UserFormWrapper extends React.Component {
        constructor(props) {
            super(props);
        }

        cmpLoaded(component) {
            if (component) {
                component.afterloadCallback = this.props.loadCb;
                component.aftersaveCallback = this.props.saveCb;
            }
        }

        render() {
            if (this.props.withUUID)
                return <UserForm onSignup={hooks.onSignup} UUID={customUUID} ref={this.cmpLoaded.bind(this)}/>
            else
                return <UserForm onSignup={hooks.onSignup} ref={this.cmpLoaded.bind(this)}/>
        }
    }

    describe("without UUID", function () {
        let subject;

        beforeEach(() => {
            hooks.onSignup = expect.createSpy();
            ConsoleHelper.watchConsole();
            subject = ReactTestUtils.renderIntoDocument(<UserForm onSignup={hooks.onSignup}/>);
            expect(subject).toExist();
        });


        it("contains all elements", function () {
            let form = ReactTestUtils.findRenderedDOMComponentWithTag(subject, 'form');
            let fields = ReactTestUtils.scryRenderedDOMComponentsWithClass(subject, 'user-field');
            let inputs = ReactTestUtils.scryRenderedDOMComponentsWithTag(subject, 'input');
            expect(form).toExist();
            expect(fields.length).toEqual(4);
            expect(inputs.length).toEqual(3);
            expect(fields[0].tagName).toEqual('DIV');
            expect(fields[3].className.indexOf('collapse')).toBeGreaterThan(-1);
            expect(fields[3].querySelector('div.button')).toExist();
        });

        it("generates an uid", function () {
            let uuid = subject.getUUID();
            expect(/^[0-9a-z]{8}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{12}$/.test(uuid)).toEqual(true);
        });

        it("validates errors on submit (with input, button submit)", function () {
            let saveSpy = expect.spyOn(subject, 'apiSave').andCallThrough();
            let uuidSpy = expect.spyOn(subject, 'getUUID').andReturn(customUUID);
            let form = ReactTestUtils.findRenderedDOMComponentWithTag(subject, 'form');
            let fields = ReactTestUtils.scryRenderedDOMComponentsWithClass(subject, 'user-field');
            let inputs = ReactTestUtils.scryRenderedDOMComponentsWithTag(subject, 'input');


            inputs[0].value = 'not an e-mail';
            ReactTestUtils.Simulate.change(inputs[0]);

            let btn = fields[3].querySelector('div.button');
            ReactTestUtils.Simulate.click(btn);

            let errors = form.querySelectorAll('.error');
            expect(errors.length).toEqual(3);
            expect(errors[0].tagName).toEqual('SPAN');
            expect(errors[1].parentNode).toEqual(fields[1]);
            expect(errors[0].textContent).toEqual("Invalid e-mail");
            expect(errors[1].textContent).toEqual("First name can't be empty");
            expect(errors[2].textContent).toEqual("Last name can't be empty");
            expect(subject.isValidForm()).toEqual(false);
            expect(subject.state).toInclude({revalidate: true});
            expect(uuidSpy.calls.length).toEqual(0);
            expect(saveSpy.calls.length).toEqual(0);
        });

        it("validates errors on submit (no input, enter submit)", function () {
            let saveSpy = expect.spyOn(subject, 'apiSave').andCallThrough();
            let uuidSpy = expect.spyOn(subject, 'getUUID').andReturn(customUUID);
            let form = ReactTestUtils.findRenderedDOMComponentWithTag(subject, 'form');
            let fields = ReactTestUtils.scryRenderedDOMComponentsWithClass(subject, 'user-field');

            let inputs = ReactTestUtils.scryRenderedDOMComponentsWithTag(subject, 'input');
            ReactTestUtils.Simulate.keyDown(inputs[0], {key: "Enter", keyCode: 13, which: 13});
            ReactTestUtils.Simulate.keyDown(inputs[1], {key: "Enter", keyCode: 13, which: 13});
            ReactTestUtils.Simulate.keyDown(inputs[2], {key: "Enter", keyCode: 13, which: 13});

            let errors = form.querySelectorAll('.error');
            expect(errors.length).toEqual(3);
            expect(errors[0].tagName).toEqual('SPAN');
            expect(errors[1].parentNode).toEqual(fields[1]);
            expect(errors[0].textContent).toEqual("Invalid e-mail");
            expect(errors[1].textContent).toEqual("First name can't be empty");
            expect(errors[2].textContent).toEqual("Last name can't be empty");
            expect(subject.isValidForm()).toEqual(false);
            expect(subject.state).toInclude({revalidate: true});
            expect(uuidSpy.calls.length).toEqual(0);
            expect(saveSpy.calls.length).toEqual(0);
        });

        it("creates a user", function (done) {

            subject.onApiUpdate = subject.onApiUpdate.wrap((originalMethod, response) => {
                originalMethod.call(subject, response);
                expect(hooks.onSignup).toHaveBeenCalledWith(customUUID);
                done();
            });

            let saveSpy = expect.spyOn(subject, 'apiSave').andCallThrough();
            let uuidSpy = expect.spyOn(subject, 'getUUID').andReturn(customUUID);
            let form = ReactTestUtils.findRenderedDOMComponentWithTag(subject, 'form');
            let inputs = ReactTestUtils.scryRenderedDOMComponentsWithTag(subject, 'input');
            let fields = ReactTestUtils.scryRenderedDOMComponentsWithClass(subject, 'user-field');

            inputs[0].value = mockData.email;
            ReactTestUtils.Simulate.change(inputs[0]);
            inputs[1].value = mockData.firstName;
            ReactTestUtils.Simulate.change(inputs[1]);
            inputs[2].value = mockData.lastName;
            ReactTestUtils.Simulate.change(inputs[2]);


            let btn = fields[3].querySelector('div.button');
            ReactTestUtils.Simulate.click(btn);

            let errors = form.querySelectorAll('.error');
            expect(errors.length).toEqual(0);
            expect(saveSpy.calls.length).toEqual(1);
            expect(saveSpy).toHaveBeenCalledWith(customUUID);
            expect(uuidSpy.calls.length).toEqual(1);
        });
    });

    describe("with an UUID", function () {
        let subject;


        beforeEach((done) => {
            hooks.onSignup = expect.createSpy();
            hooks.onAfterLoad = (component) => {
                let expectedData = Object.assign({
                    revalidate: false
                }, mockData);
                expect(expectedData).toEqual(component.state);
                done();
            };
            hooks.onAfterSave = expect.createSpy();
            ConsoleHelper.watchConsole();
            subject = ReactTestUtils.renderIntoDocument(
                <UserFormWrapper withUUID={true} loadCb={hooks.onAfterLoad} saveCb={hooks.onAfterSave}/>
            );

            expect(subject).toExist();
        });

        it("displays user data", function () {
            let form = ReactTestUtils.findRenderedDOMComponentWithTag(subject, 'form');
            let inputs = ReactTestUtils.scryRenderedDOMComponentsWithTag(subject, 'input');
            let fields = ReactTestUtils.scryRenderedDOMComponentsWithClass(subject, 'user-field');
            let signOut = fields[3].querySelector('a');
            expect(inputs[0].value).toEqual(mockData.email);
            expect(inputs[1].value).toEqual(mockData.firstName);
            expect(inputs[2].value).toEqual(mockData.lastName);
            expect(fields.length).toEqual(4);
            expect(signOut).toExist();
            expect(signOut.textContent.trim()).toEqual('Sign out');
        });

        it("correctly revalidates from correct state and ignores submit", function () {
            let component = ReactTestUtils.findRenderedComponentWithType(subject, UserForm);
            let form = ReactTestUtils.findRenderedDOMComponentWithTag(subject, 'form');
            let inputs = ReactTestUtils.scryRenderedDOMComponentsWithTag(subject, 'input');
            let saveSpy = expect.spyOn(component, 'apiSave').andCallThrough();

            inputs[1].value = '';
            ReactTestUtils.Simulate.change(inputs[1]);
            inputs[0].value = 'not_a_email';
            ReactTestUtils.Simulate.change(inputs[0]);

            let errors = form.querySelectorAll('.error');
            let fields = ReactTestUtils.scryRenderedDOMComponentsWithClass(subject, 'user-field');

            expect(errors.length).toEqual(2);
            expect(errors[1].tagName).toEqual('SPAN');
            expect(errors[0].parentNode).toEqual(fields[0]);
            expect(errors[0].textContent).toEqual("Invalid e-mail");
            expect(errors[1].textContent).toEqual("First name can't be empty");

            ReactTestUtils.Simulate.keyDown(inputs[0], {key: "Enter", keyCode: 13, which: 13});
            ReactTestUtils.Simulate.keyDown(inputs[1], {key: "Enter", keyCode: 13, which: 13});
            ReactTestUtils.Simulate.keyDown(inputs[2], {key: "Enter", keyCode: 13, which: 13});

            ReactTestUtils.Simulate.blur(inputs[0]);
            ReactTestUtils.Simulate.blur(inputs[1]);
            ReactTestUtils.Simulate.blur(inputs[2]);

            expect(saveSpy.calls.length).toEqual(0);

            expect(component.state).toInclude({revalidate: true});

            component.isValidForm();

            expect(component.state).toInclude({revalidate: true});

        });

        it("correctly revalidates to correct state", function () {
            let component = ReactTestUtils.findRenderedComponentWithType(subject, UserForm);
            let form = ReactTestUtils.findRenderedDOMComponentWithTag(subject, 'form');
            let inputs = ReactTestUtils.scryRenderedDOMComponentsWithTag(subject, 'input');

            inputs[2].value = '';
            ReactTestUtils.Simulate.change(inputs[1]);
            inputs[0].value = 'not_a_email';
            ReactTestUtils.Simulate.change(inputs[0]);
            inputs[0].value = mockData.email;
            ReactTestUtils.Simulate.change(inputs[0]);
            inputs[1].value = mockData.firstName;
            ReactTestUtils.Simulate.change(inputs[1]);

            let errors = form.querySelectorAll('.error');

            expect(errors.length).toEqual(0);

            expect(component.state).toInclude({revalidate: true});

            expect(component.isValidForm()).toEqual(true);

            expect(component.state).toInclude({revalidate: false});

        });

        it("logs out", function () {
            let component = ReactTestUtils.findRenderedComponentWithType(subject, UserForm);
            let form = ReactTestUtils.findRenderedDOMComponentWithTag(subject, 'form');
            let inputs = ReactTestUtils.scryRenderedDOMComponentsWithTag(subject, 'input');
            let saveSpy = expect.spyOn(component, 'apiSave').andCallThrough();
            let fields = ReactTestUtils.scryRenderedDOMComponentsWithClass(subject, 'user-field');
            let signOut = fields[3].querySelector('a');

            ReactTestUtils.Simulate.click(signOut);

            expect(inputs[0].value).toEqual('');
            expect(inputs[1].value).toEqual('');
            expect(inputs[2].value).toEqual('');
            expect(component.state).toInclude({revalidate: false});

            expect(saveSpy.calls.length).toEqual(0);

            let errors = form.querySelectorAll('.error');
            expect(errors.length).toEqual(0);

            expect(hooks.onSignup).toHaveBeenCalledWith(null);

        });

        it("saves the modified data", function (done) {

            let component = ReactTestUtils.findRenderedComponentWithType(subject, UserForm);
            let form = ReactTestUtils.findRenderedDOMComponentWithTag(subject, 'form');
            let inputs = ReactTestUtils.scryRenderedDOMComponentsWithTag(subject, 'input');
            let saveSpy = expect.spyOn(component, 'apiSave').andCallThrough();
            let autosaveSpy = expect.spyOn(component, 'autosave').andCallThrough();

            mockData = {
                email: 'some_new_email@example.com',
                firstName: 'Another name',
                lastName: 'Another surname'
            };

            component.onApiUpdate = component.onApiUpdate.wrap((originalMethod, response) => {
                originalMethod.call(subject, response);
                expect(hooks.onAfterSave.calls.length).toEqual(1);
                done();
            });

            inputs[0].value = mockData.email;
            ReactTestUtils.Simulate.change(inputs[0]);
            inputs[1].value = mockData.firstName;
            ReactTestUtils.Simulate.change(inputs[1]);
            inputs[2].value = mockData.lastName;
            ReactTestUtils.Simulate.change(inputs[2]);

            let errors = form.querySelectorAll('.error');
            expect(errors.length).toEqual(0);

            expect(component.state).toInclude({revalidate: true});

            ReactTestUtils.Simulate.keyDown(inputs[0], {key: "Enter", keyCode: 13, which: 13});

            expect(component.state).toInclude({revalidate: false});

            ReactTestUtils.Simulate.keyDown(inputs[1], {key: "Enter", keyCode: 13, which: 13});
            ReactTestUtils.Simulate.keyDown(inputs[2], {key: "Enter", keyCode: 13, which: 13});

            ReactTestUtils.Simulate.blur(inputs[0]);
            ReactTestUtils.Simulate.blur(inputs[1]);
            ReactTestUtils.Simulate.blur(inputs[2]);

            expect(saveSpy.calls.length).toEqual(1);
            expect(autosaveSpy.calls.length).toEqual(6);

        });
    });


    afterEach(() => {
        let propWarns = ConsoleHelper.getErrors();
        if (validateConsoleErrors)
            expect(propWarns.length).toEqual(0);
        expect.restoreSpies();
    });
});