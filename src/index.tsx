import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/main.scss';


import Page from './pages/matrix-widget-room';
import reportWebVitals from './reportWebVitals';
import { I18nProvider } from './i18n/I18nContext'
import { store } from './store/store'
import { Provider } from 'react-redux'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>

      <I18nProvider>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content"
        ></meta>
        <Page />
      </I18nProvider>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
