import expect from 'expect';

class ConsoleHelper {

    constructor() {
        this.watchConsole = this.watchConsole.bind(this);
        this.release = this.release.bind(this);
        this.getErrors = this.getErrors.bind(this);
        this.getPropWarnings = this.getPropWarnings.bind(this);
        this.getLog = this.getLog.bind(this);
    }


    watchConsole() {
        this.consoleErrors = expect.spyOn(console, 'error').andCallThrough();

        this.consoleWarns = expect.spyOn(console, 'warn').andCallThrough();

        this.consoleLog = expect.spyOn(console, 'log').andCallThrough();
    }

    release() {
        if (this.consoleErrors && this.consoleErrors.restore)
            this.consoleErrors.restore();
        if (this.consoleWarns && this.consoleWarns.restore)
            this.consoleWarns.restore();
    }

    getErrors() {
        return this.consoleErrors.calls.map((c) => (c.arguments && c.arguments.length) ? c.arguments.toString() : null) || [];
    }

    getLog() {
        return this.consoleLog.calls.map((c) => (c.arguments && c.arguments.length) ? c.arguments.toString() : null) || [];
    }


    getPropWarnings() {
        let consoleErrors = [...this.consoleErrors.calls, ...this.consoleWarns.calls];

        consoleErrors = consoleErrors.filter((c) => {
            return (c.arguments &&
            c.arguments.length > 0 &&
            /(Invalid prop|failed prop type)/i.test(c.arguments[0]));
        });

        return consoleErrors.map((error) => {
            let text = error.arguments.toString();
            let match = text.match(/(the prop|invalid prop)\s+`(\w+)`/i);
            if (match && match.index)
                return match[2];
            return null;
        });
    }

}
let consoleHelper = new ConsoleHelper();
export default consoleHelper;