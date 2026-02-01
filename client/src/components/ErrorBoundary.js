import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("🔥 REACT CRASH:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: '#fff0f0', color: '#d00' }}>
          <h2>🔥 Something crashed the App</h2>
          <h3>{this.state.error && this.state.error.toString()}</h3>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: 20 }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <br />
          <button 
            onClick={() => window.location.href = '/'}
            style={{ padding: 10, background: '#333', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Go to Dashboard
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;