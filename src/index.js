import React from 'react';
import ReactDOM from 'react-dom/client';
import './scss/index.scss';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import App from './pages/App';
import { ThemeProvider } from './theme/ThemeContext';

gsap.registerPlugin(ScrollTrigger);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);