import React from 'react';
import expect from 'expect';
import ReactTestUtils from 'react-dom/test-utils';
import ConsoleHelper from './console-helper';
import ItemList from '../ItemList';


describe("ItemList", function () {

    beforeEach(ConsoleHelper.watchConsole);
    let validateConsoleErrors = false; //dirty hacks start here

    let hooks = {
        onAddToList: value => value,
        onRemoveFromList: value => value,
        onValidate: value => value.length > 0
    };

    it("validates required PropTypes", function () {
        let subject = ReactTestUtils.renderIntoDocument(
            <ItemList/>
        );
        let propWarns = ConsoleHelper.getPropWarnings();
        expect(propWarns).toInclude('list').toInclude('onAddToList').toInclude('onRemoveFromList').toInclude('onValidate');
        expect(subject).toExist();
    });

    it("loads without errors and shows empty list", function () {
        validateConsoleErrors = true;
        let subject = ReactTestUtils.renderIntoDocument(
            <ItemList
                list={[]}
                onAddToList={hooks.onAddToList}
                onRemoveFromList={hooks.onRemoveFromList}
                onValidate={hooks.onValidate}
            />
        );

        let span = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'empty');
        expect(span.tagName).toEqual("SPAN");
        expect(span.textContent).toEqual("List is empty");
    });

    it("displays list and title", function () {
        let subject = ReactTestUtils.renderIntoDocument(
            <ItemList
                list={['foo', 'bar']}
                title="Hello"
                onAddToList={hooks.onAddToList}
                onRemoveFromList={hooks.onRemoveFromList}
                onValidate={hooks.onValidate}
            />
        );
        let list = ReactTestUtils.findRenderedDOMComponentWithTag(subject, 'ul');
        let listItems = ReactTestUtils.scryRenderedDOMComponentsWithTag(subject, 'li');
        let header = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'item-list-title');
        expect(header.tagName).toEqual('DIV');
        expect(header.textContent).toEqual('Hello');
        expect(list).toExist();
        expect(listItems.length).toEqual(2);
        expect(listItems[0].className).toEqual('tag');
        expect(listItems[0].parentNode).toEqual(list);
        expect(listItems[0].querySelector('span').textContent).toEqual('foo');
        expect(listItems[1].querySelector('span').textContent).toEqual('bar');
    });

    it("removes from list", function () {
        let hookSpy = expect.spyOn(hooks, 'onRemoveFromList');
        let subject = ReactTestUtils.renderIntoDocument(
            <ItemList
                list={['foo', 'bar']}
                onAddToList={hooks.onAddToList}
                onRemoveFromList={hooks.onRemoveFromList}
                onValidate={hooks.onValidate}
            />
        );
        let listItems = ReactTestUtils.scryRenderedDOMComponentsWithTag(subject, 'li');
        let removeBtn = listItems[1].querySelector('a');
        expect(removeBtn).toExist();
        ReactTestUtils.Simulate.click(removeBtn);
        expect(hookSpy.calls.length).toEqual(1);
        expect(hookSpy).toHaveBeenCalledWith('bar');
    });

    it("validates input and shows Add button", function () {
        let hookSpy = expect.spyOn(hooks, 'onValidate').andCallThrough();
        let subject = ReactTestUtils.renderIntoDocument(
            <ItemList
                list={['foo', 'bar']}
                onAddToList={hooks.onAddToList}
                onRemoveFromList={hooks.onRemoveFromList}
                onValidate={hooks.onValidate}
            />
        );
        let inputBar = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'item-list-add');
        expect(inputBar).toExist();
        let inputCtrl = inputBar.querySelector('input');
        expect(inputCtrl).toExist();

        inputCtrl.value = 'qux';
        ReactTestUtils.Simulate.change(inputCtrl);
        expect(hookSpy).toHaveBeenCalledWith('qux');
        expect(subject.state.newValue).toEqual('qux');
        let addBtn = inputBar.querySelector('a.fa-plus');
        expect(addBtn).toExist();

        inputCtrl.value = '';
        ReactTestUtils.Simulate.change(inputCtrl);
        addBtn = inputBar.querySelector('a.fa-plus');
        expect(addBtn).toBe(null);

        expect(hookSpy.calls.length).toEqual(2);
    });

    it("adds with button and Enter", function () {
        let hookSpy = expect.spyOn(hooks, 'onAddToList').andCallThrough();
        let subject = ReactTestUtils.renderIntoDocument(
            <ItemList
                list={['foo', 'bar']}
                onAddToList={hooks.onAddToList}
                onRemoveFromList={hooks.onRemoveFromList}
                onValidate={hooks.onValidate}
            />
        );
        let inputBar = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'item-list-add');
        let inputCtrl = inputBar.querySelector('input');

        inputCtrl.value = 'qux';
        ReactTestUtils.Simulate.change(inputCtrl);
        expect(subject.state.newValue).toEqual('qux')
        let addBtn = inputBar.querySelector('a.fa-plus');
        ReactTestUtils.Simulate.click(addBtn);
        expect(subject.state.newValue).toEqual('');

        inputCtrl.value = ' baz   ';
        ReactTestUtils.Simulate.change(inputCtrl);
        ReactTestUtils.Simulate.keyDown(inputCtrl, {key: "Enter", keyCode: 13, which: 13});
        expect(subject.state.newValue).toEqual('');
        expect(hookSpy.calls.length).toEqual(2);
        expect(hookSpy).toHaveBeenCalledWith('qux');
        expect(hookSpy).toHaveBeenCalledWith('baz');
    });

    it(" correctly handles `spacesAllowed`", function () {
        let subject = ReactTestUtils.renderIntoDocument(
            <ItemList
                list={['foo', 'bar']}
                spacesAllowed={false}
                onAddToList={hooks.onAddToList}
                onRemoveFromList={hooks.onRemoveFromList}
                onValidate={hooks.onValidate}
            />
        );
        let subject2 = ReactTestUtils.renderIntoDocument(
            <ItemList
                list={['foo', 'bar']}
                onAddToList={hooks.onAddToList}
                onRemoveFromList={hooks.onRemoveFromList}
                onValidate={hooks.onValidate}
            />
        );
        let inputBar = ReactTestUtils.findRenderedDOMComponentWithClass(subject, 'item-list-add');
        let inputCtrl = inputBar.querySelector('input');
        inputCtrl.value = ' qux      baz  ';
        ReactTestUtils.Simulate.change(inputCtrl);
        expect(subject.state.newValue).toEqual('quxbaz');

        inputBar = ReactTestUtils.findRenderedDOMComponentWithClass(subject2, 'item-list-add');
        inputCtrl = inputBar.querySelector('input');
        inputCtrl.value = ' qux   baz    ';
        ReactTestUtils.Simulate.change(inputCtrl);
        expect(subject2.state.newValue).toEqual('qux baz ');

    });


    afterEach(() => {
        let propWarns = ConsoleHelper.getErrors();
        if (validateConsoleErrors)
            expect(propWarns.length).toEqual(0);
        expect.restoreSpies();
    });
});