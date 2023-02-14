/* eslint-disable react/jsx-props-no-spreading */

import React, { PureComponent, RefObject } from 'react';
const ReactDOM = React.version >= '18' ? require('react-dom/client') : require('react-dom');

type Props = {
    innerRef?: RefObject<unknown>,
} & object;

export const withCompatMode = <P extends Props>(Component: React.ComponentType<P>) => {
    class CompatComponent extends PureComponent<P> {
        ref: RefObject<HTMLDivElement>;
        root;

        constructor(props: P) {
            super(props);
            this.ref = React.createRef();
        }

        componentDidMount() {
            const { innerRef } = this.props;
            if (React.version >= '18') {
                this.root = ReactDOM.createRoot(this.ref.current);
                this.root.render(<Component {...this.props} ref={innerRef}/>);
            } else {
                ReactDOM.render(<Component {...this.props} ref={innerRef}/>, this.ref.current);
            }
        }

        componentDidUpdate() {
            const { innerRef } = this.props;
            if (React.version >= '18') {
                this.root.render(<Component {...this.props} ref={innerRef}/>);
            } else {
                ReactDOM.render(<Component {...this.props} ref={innerRef}/>, this.ref.current);
            }
        }

        componentWillUnmount() {
            if (React.version >= '18') {
                this.root.render(<></>);
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
    };
};

