import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#f87171', fontFamily: 'IBM Plex Mono, monospace' }}>
          <h2 style={{ marginBottom: 8, fontSize: '1.1rem' }}>Render Error</h2>
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error)}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
