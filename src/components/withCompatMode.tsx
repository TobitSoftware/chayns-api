/* eslint-disable react/jsx-props-no-spreading */

import React, { PureComponent, RefObject } from 'react';
import ReactDOM from 'react-dom';
import ErrorBoundary from './ErrorBoundary';
let ReactDOMClient;
try {
    ReactDOMClient = require('react-dom/client');
} catch (e) {
    // do nothing
}

type Props = {
    innerRef?: RefObject<unknown>,
} & object;

export const withCompatMode = <P extends Props>(Component: React.ComponentType<P>) => {
    class CompatComponent extends PureComponent<P> {
        ref: RefObject<HTMLDivElement>;
        root;
        timeout?: ReturnType<typeof setTimeout>;

        constructor(props: P) {
            super(props);
            this.ref = React.createRef();
        }

        componentDidMount() {
            const { innerRef } = this.props;

            const component = <ErrorBoundary><Component {...this.props} ref={innerRef}/></ErrorBoundary>;
            if (typeof ReactDOMClient?.createRoot === 'function') {
                this.root = ReactDOMClient.createRoot(this.ref.current);
                this.root.render(component);
            } else {
                ReactDOM.render(component, this.ref.current);
            }
        }

        componentDidUpdate() {
            const { innerRef } = this.props;

            const component = <ErrorBoundary><Component {...this.props} ref={innerRef}/></ErrorBoundary>;
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                if (this.root) {
                    this.root.render(component);
                } else {
                    ReactDOM.render(component, this.ref.current);
                }
            }, 0);
        }

        componentWillUnmount() {
            if (this.root) {
                this.root.unmount();
            } else {
                ReactDOM.render(<></>, this.ref.current);
            }
        }

        render() {
            return <div ref={this.ref}/>;
        }
    }

    return {
        Component: React.forwardRef((props, ref) => <div><Component {...props as P} innerRef={ref}/></div>),
        CompatComponent: React.forwardRef((props, ref) => <CompatComponent {...props as P} innerRef={ref}/>),
        // @ts-expect-error will be set by chayns-toolkit via DefinePlugin
        requiredVersion: __REQUIRED_REACT_VERSION__,
        environment: process.env.NODE_ENV,
        buildEnv: process.env.BUILD_ENV || process.env.NODE_ENV,
        appVersion: process.env.VERSION,
        version: 2,
    };
};

