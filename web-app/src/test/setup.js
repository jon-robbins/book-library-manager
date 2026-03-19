import React from 'react';
import '@testing-library/jest-dom/vitest';

// Some JSX test files rely on classic React-in-scope behavior.
globalThis.React = React;
