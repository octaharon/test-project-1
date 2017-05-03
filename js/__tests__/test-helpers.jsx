import expect from 'expect';

//prototypeJS-style function interception
Object.assign(Function.prototype, {
    wrap: function (wrapper) {
        let __method = this;
        if (!wrapper instanceof Function)
            return this;
        return function () {
            return wrapper.apply(this, [__method.bind(this), ...arguments]);
        }
    }
});


let stubComponent = function (componentClass, callbacks) {
    let originalPropTypes;

    let fields = ['render',
        'componentWillMount',
        'componentDidMount',
        'componentWillReceiveProps',
        'shouldComponentUpdate',
        'componentWillUpdate',
        'componentDidUpdate',
        'componentWillUpdate'
    ];

    beforeEach(function () {
        originalPropTypes = componentClass.propTypes;

        componentClass.propTypes = {};

        fields.forEach((key) => {
            if (componentClass.prototype[key] instanceof Function) {
                let spy = expect.spyOn(componentClass.prototype, key).andReturn(null);
                if (callbacks && callbacks[key])
                    spy.andCall(callbacks[key]);
            }
        });
    });

    afterEach(function () {
        expect.restoreSpies();
        componentClass.propTypes = originalPropTypes;
    });
};

export default {
    stubComponent: stubComponent
};