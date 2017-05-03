import React from 'react';
import expect from 'expect';
import ReactTestUtils from 'react-dom/test-utils';
import ConsoleHelper from './console-helper';
import TestHelper from './test-helpers';
import MatchGroup from '../MatchGroup';
import ItemList from '../ItemList';




describe("MatchGroup", function () {

    let validateConsoleErrors = false;

    let hooks = {
        onChange: expect.createSpy(),
        onDelete: expect.createSpy()
    };
    TestHelper.stubComponent(ItemList);

    describe("propTypes validation", function () {
        it("to pass", function () {
            validateConsoleErrors = false;
            ConsoleHelper.watchConsole();
            let subject = ReactTestUtils.renderIntoDocument(
                <MatchGroup/>
            );
            let propWarns = ConsoleHelper.getPropWarnings();
            expect(propWarns).toInclude('name').toInclude('onDelete').toInclude('onChange');
            expect(subject).toExist();
            expect.restoreSpies();
        });
    });


    let mockName = 'Sample group';
    let confirmSpy;
    let autosaveSpy;
    let allowDelete = true;
    let subject;

    let mockLists = {
        ig: [],
        tw: [],
        kw: []
    };



    beforeEach(() => {
        validateConsoleErrors = true;
        hooks = {
            onChange: expect.createSpy().andReturn(true),
            onDelete: expect.createSpy()
        };
        confirmSpy = expect.spyOn(window, 'confirm').andCall(() => {
            return allowDelete;
        });
        ConsoleHelper.watchConsole();
        subject = ReactTestUtils.renderIntoDocument(<MatchGroup
            onChange={hooks.onChange}
            onDelete={hooks.onDelete}
            name={mockName}
            twitterList={mockLists.tw}
            instagramList={mockLists.ig}
            keywords={mockLists.kw}
        />);
        autosaveSpy = expect.spyOn(subject, 'autosave').andCallThrough();
        expect(subject).toExist();
    });

    describe("lists handling", function () {

        let mockFill = function (component) {
            component.addToKeywords('kw1');
            component.addToKeywords('kw2');
            component.addToInstagram('ig1');
            component.addToInstagram('ig2');
            component.addToTwitter('tw1');
        };


        it("renders correctly", function () {
            let lists = ReactTestUtils.scryRenderedComponentsWithType(subject, ItemList);
            expect(lists.length).toEqual(3);
            let field = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'match-group-title');
            expect(field).toExist();
            let input = field.querySelector('input');
            expect(input).toExist();
            let buttons = field.querySelectorAll('a.fa');
            expect(buttons.length).toEqual(2);
        });

        it("adds to list and saves", function () {
            let component = subject;
            mockFill(component);
            expect(component.state).toInclude({twInfluencers: ['tw1']}).toInclude({igInfluencers: ['ig1', 'ig2']}).toInclude({keywords: ['kw1', 'kw2']});
            expect(autosaveSpy.calls.length).toEqual(5);
            expect(hooks.onChange.calls.length).toEqual(5);
            expect(hooks.onChange).toHaveBeenCalledWith(component.state);
        });

        it("removes from list and saves", function () {
            let component = subject;
            mockFill(component);
            component.removeFromTwitter('tw1');
            component.removeFromInstagram('ig1');
            component.removeFromKeywords('kw2');
            expect(component.state).toInclude({twInfluencers: []}).toInclude({igInfluencers: ['ig2']}).toInclude({keywords: ['kw1']});
            expect(autosaveSpy.calls.length).toEqual(8);
            expect(hooks.onChange.calls.length).toEqual(8);
            expect(hooks.onChange).toHaveBeenCalledWith(component.state);
        });

        it("on removal of the last influencer deletes", function () {
            let component = subject;
            mockFill(component);
            allowDelete = true;
            component.removeFromTwitter('tw1');
            component.removeFromInstagram('ig1');
            component.removeFromInstagram('ig2');
            expect(component.state).toInclude({twInfluencers: []}).toInclude({igInfluencers: ['ig2']}).toInclude({keywords: ['kw1', 'kw2']});
            expect(autosaveSpy.calls.length).toEqual(7);
            expect(hooks.onChange.calls.length).toEqual(7);
            expect(confirmSpy).toHaveBeenCalled();
            expect(hooks.onChange).toHaveBeenCalledWith(component.state);
            expect(hooks.onDelete).toHaveBeenCalled();
        });

        it("on removal of the last influencer accepts user cancel", function () {
            let component = subject;
            allowDelete = false;
            mockFill(component);
            component.removeFromTwitter('tw1');
            component.removeFromInstagram('ig1');
            component.removeFromInstagram('ig2');
            expect(component.state).toInclude({twInfluencers: []}).toInclude({igInfluencers: ['ig2']}).toInclude({keywords: ['kw1', 'kw2']});
            expect(autosaveSpy.calls.length).toEqual(7);
            expect(hooks.onChange.calls.length).toEqual(7);
            expect(confirmSpy).toHaveBeenCalled();
            expect(hooks.onChange).toHaveBeenCalledWith(component.state);
            expect(hooks.onDelete).toNotHaveBeenCalled();
        });

        it("validation", function () {
            let component = subject;
            mockFill(component);
            expect(component.validateKeywords('kw1')).toEqual(false);
            expect(component.validateTwitter('tw1')).toEqual(false);
            expect(component.validateInstagram('ig1')).toEqual(false);
            component.addToTwitter('tw1');
            component.addToInstagram('ig1');
            component.addToInstagram('ig2');
            expect(autosaveSpy.calls.length).toEqual(5);
            expect(hooks.onChange.calls.length).toEqual(5);
        });
    });

    describe("field control group", function () {

        it("displays name", function () {
            let field = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'match-group-title');
            let input = field.querySelector('input');
            expect(subject.state).toInclude({
                revalidate: false,
                invalid: false
            });
            expect(input.value).toEqual(mockName);
        });

        it("validates empty name", function () {
            let field = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'match-group-title');
            let input = field.querySelector('input');
            hooks.onChange = expect.createSpy().andReturn(false);
            input.value = '     ';
            ReactTestUtils.Simulate.change(input);
            expect(subject.state).toInclude({
                revalidate: true,
                invalid: true,
                name: ''
            });
            expect(input.className).toInclude('error');
            ReactTestUtils.Simulate.blur(input);
            ReactTestUtils.Simulate.keyDown(input, {key: "Enter", keyCode: 13, which: 13});
            expect(autosaveSpy.calls.length).toEqual(2);
            expect(hooks.onChange.calls.length).toEqual(0);
        });

        it("revalidates valid name and saves", function () {
            let field = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'match-group-title');
            let input = field.querySelector('input');

            input.value = '  another new   name      ';
            ReactTestUtils.Simulate.change(input);

            expect(subject.state).toInclude({
                revalidate: true,
                invalid: false
            });
            expect(input.className).toExclude('error');

            ReactTestUtils.Simulate.keyDown(input, {key: "Enter", keyCode: 13, which: 13});

            expect(autosaveSpy.calls.length).toEqual(1);
            expect(hooks.onChange.calls.length).toEqual(1);

            expect(subject.state).toInclude({
                revalidate: false,
                invalid: false,
                name: 'another new   name'
            });


            ReactTestUtils.Simulate.blur(input);

            expect(autosaveSpy.calls.length).toEqual(2);
            expect(hooks.onChange.calls.length).toEqual(1);

        });

        it('expands and collapses list', function () {
            let field = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'match-group-title');
            let list = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'match-group-items');
            let buttons = field.querySelectorAll('a.fa');

            subject.setState({expanded: true});
            expect(buttons[1].className).toInclude('fa-folder-open');
            expect(list.style.display).toEqual('');

            ReactTestUtils.Simulate.click(buttons[1]);

            expect(subject.state).toInclude({expanded: false});
            expect(buttons[1].className).toInclude('fa-folder');
            expect(list.style.display).toEqual('none');

            ReactTestUtils.Simulate.click(buttons[1]);
            expect(subject.state).toInclude({expanded: true});

        });

        it('deletes group', function () {
            let field = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'match-group-title');
            let list = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'match-group-items');
            let buttons = field.querySelectorAll('a.fa');
            allowDelete = true;

            ReactTestUtils.Simulate.click(buttons[0]);

            expect(confirmSpy).toHaveBeenCalled();
            expect(hooks.onDelete).toHaveBeenCalled();

        });
    });

    afterEach(() => {
        let propWarns = ConsoleHelper.getErrors();
        if (validateConsoleErrors)
            expect(propWarns.length).toEqual(0);
        expect.restoreSpies();
    });
});