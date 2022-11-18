/* eslint-disable react/jsx-props-no-spreading */

import React, { PureComponent, RefObject } from 'react';
import ReactDOM from 'react-dom';

type Props = {
    innerRef?: RefObject<unknown>,
} & object;

export const withCompatMode = <P extends Props>(Component: React.ComponentType<P>) => {
    class CompatComponent extends PureComponent<P> {
        ref: RefObject<HTMLDivElement>;

        constructor(props: P) {
            super(props);
            this.ref = React.createRef();
        }

        componentDidMount() {
            const { innerRef } = this.props;
            ReactDOM.render(<Component {...this.props} ref={innerRef}/>, this.ref.current);
        }

        componentDidUpdate() {
            const { innerRef } = this.props;
            ReactDOM.render(<Component {...this.props} ref={innerRef}/>, this.ref.current);
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

