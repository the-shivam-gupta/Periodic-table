import React from 'react';
import ReactDOM from 'react-dom/client';
import './scss/index.scss';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import App from './pages/App';

gsap.registerPlugin(ScrollTrigger);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);