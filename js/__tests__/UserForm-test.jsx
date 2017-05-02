import React from 'react';
import expect from 'expect';
import ReactTestUtils from 'react-dom/test-utils';
import ConsoleHelper from './console-helper';
import UserForm from '../UserForm';
import config from '../../config.json';
import fetchMock from 'fetch-mock';

describe("UserForm", function () {

    let customUUID = "abcdef12-3456-7890-abcd-ef1234567890";
    let mockData = {
        "email": "email@example.com",
        "firstName": "Name",
        "lastName": "Surname"
    };

    beforeEach(() => {
        ConsoleHelper.watchConsole();
        //fetchMock.setImplementations(require('whatwg-fetch'));
        fetchMock.put(config.apiBaseUrl + '/userconfig/info/' + customUUID, {
            status: 204,
            body: '',
            sendAsJson: false
        }, {name: 'saveRequest'}).get(config.apiBaseUrl + '/userconfig/info/' + customUUID, {
            status: 200,
            body: mockData
        }, {name: 'loadRequest'}).get('*', {
            status: 200,
            body: {email: 'wrong@call.com'}
        }).catch(503);
    });
    let validateConsoleErrors = true;

    let hooks = {
        onSignup: value => value,
    };

    it("renders without errors", function () {
        let subject = ReactTestUtils.renderIntoDocument(
            <UserForm/>
        );
        expect(subject).toExist();
    });

    it("contains all elements (not logged in)", function () {
        let subject = ReactTestUtils.renderIntoDocument(
            <UserForm/>
        );
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

    it(" generates an uid", function () {
        let subject = ReactTestUtils.renderIntoDocument(
            <UserForm/>
        );
        let uuid = subject.getUUID();
        expect(/^[0-9a-z]{8}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{12}$/.test(uuid)).toEqual(true);
    });

    it("validates errors on submit (with input, button submit)", function () {
        let hookSpy = expect.spyOn(hooks, 'onSignup').andCallThrough();
        let subject = ReactTestUtils.renderIntoDocument(
            <UserForm onSignup={hooks.onSignup}/>
        );
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
        expect(errors[2].textContent).toEqual("Last name can't be empty")
        expect(hookSpy.calls).toEqual(0);
        expect(saveSpy.calls).toEqual(0);
    });

    it("validates errors on submit (no input, enter submit)", function () {
        let hookSpy = expect.spyOn(hooks, 'onSignup').andCallThrough();
        let subject = ReactTestUtils.renderIntoDocument(
            <UserForm onSignup={hooks.onSignup}/>
        );
        let saveSpy = expect.spyOn(subject, 'apiSave').andCallThrough();
        let uuidSpy = expect.spyOn(subject, 'getUUID').andReturn(customUUID);
        let form = ReactTestUtils.findRenderedDOMComponentWithTag(subject, 'form');
        let fields = ReactTestUtils.scryRenderedDOMComponentsWithClass(subject, 'user-field');

        let inputs = ReactTestUtils.scryRenderedDOMComponentsWithTag(subject, 'input');
        ReactTestUtils.Simulate.keyDown(inputs[1], {key: "Enter", keyCode: 13, which: 13});

        let errors = form.querySelectorAll('.error');
        expect(errors.length).toEqual(3);
        expect(errors[0].tagName).toEqual('SPAN');
        expect(errors[1].parentNode).toEqual(fields[1]);
        expect(errors[0].textContent).toEqual("Invalid e-mail");
        expect(errors[1].textContent).toEqual("First name can't be empty");
        expect(errors[2].textContent).toEqual("Last name can't be empty")
        expect(hookSpy.calls).toEqual(0);
        expect(saveSpy.calls).toEqual(0);
    });

    it("creates a user", function () {
        let hookSpy = expect.spyOn(hooks, 'onSignup').andCallThrough();
        let subject = ReactTestUtils.renderIntoDocument(
            <UserForm onSignup={hooks.onSignup}/>
        );
        let saveSpy = expect.spyOn(subject, 'apiSave').andCallThrough();
        let uuidSpy = expect.spyOn(subject, 'getUUID').andReturn(customUUID);
        let form = ReactTestUtils.findRenderedDOMComponentWithTag(subject, 'form');
        let inputs = ReactTestUtils.scryRenderedDOMComponentsWithTag(subject, 'input');
        let fields = ReactTestUtils.scryRenderedDOMComponentsWithClass(subject, 'user-field');

        inputs[0].value = 'valid@email.com';
        ReactTestUtils.Simulate.change(inputs[0]);
        inputs[1].value = 'Some name';
        ReactTestUtils.Simulate.change(inputs[1]);
        inputs[2].value = 'Some last name';
        ReactTestUtils.Simulate.change(inputs[2]);


        let btn = fields[3].querySelector('div.button');
        ReactTestUtils.Simulate.click(btn);

        let errors = form.querySelectorAll('.error');
        expect(errors.length).toEqual(0);
        expect(saveSpy.calls.length).toEqual(1);
        expect(saveSpy).toHaveBeenCalledWith(customUUID);
        expect(uuidSpy.calls.length).toEqual(1);
        expect(hookSpy).toHaveBeenCalledWith(customUUID);

    });

    it("displays user data", function () {
        let subject = ReactTestUtils.renderIntoDocument(
            <UserForm onSignup={hooks.onSignup} UUID={customUUID}/>
        );
        let form = ReactTestUtils.findRenderedDOMComponentWithTag(subject, 'form');
        let inputs = ReactTestUtils.scryRenderedDOMComponentsWithTag(subject, 'input');
        let fields = ReactTestUtils.scryRenderedDOMComponentsWithClass(subject, 'user-field');

        console.warn(fetchMock.called());
        expect(inputs[0].value).toEqual(mockData.email);
        expect(inputs[1].value).toEqual(mockData.name);
        expect(inputs[2].value).toEqual(mockData.surname);

    });


    afterEach(() => {
        let propWarns = ConsoleHelper.getErrors();
        if (validateConsoleErrors)
            expect(propWarns.length).toEqual(0);
        fetchMock.restore();
        expect.restoreSpies();
    });
});