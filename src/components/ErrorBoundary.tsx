import React from "react";

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode}, { hasError: boolean }> {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return null;
        }

        return this.props.children;
    }
}
