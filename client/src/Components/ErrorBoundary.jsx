import React, { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to render fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You can also log the error to an error reporting service
    console.error("Error in component:", error);
    console.error("Error info:", info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      // You can render any fallback UI here
      return (
        <div>
          <h2>Something went wrong with the registration process.</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
