import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import { StyledEngineProvider } from '@mui/material/styles';

ReactDOM.render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst></StyledEngineProvider>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
