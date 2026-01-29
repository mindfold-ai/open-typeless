/**
 * Floating window entry point.
 * This file is loaded by the floating window HTML and renders the FloatingWindow component.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { FloatingWindow } from '../src/modules/asr';
import '../src/styles/components/floating-window.css';

// Get the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a div with id="root" in the HTML.');
}

// Create root and render
const root = createRoot(rootElement);
root.render(React.createElement(FloatingWindow));
