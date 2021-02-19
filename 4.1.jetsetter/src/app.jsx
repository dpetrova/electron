import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Application from './components/Application.jsx';

// function render() {
//   ReactDOM.render(<Application />, document.getElementById('application'));
// }

// render();

const renderApplication = async () => {
    //require a fresh version of the Application, which requires all the other modules in our application when rendering    
    const Application = require('./components/Application.jsx').default;
    //const { default: Application } = require('./components/Application.jsx');
    //const { default: Application } = await import('./components/Application.jsx');
    ReactDOM.render(
      <AppContainer>
        <Application />
      </AppContainer>,
      document.getElementById('application')
    );
  };
  
  renderApplication();
  
  //if hot module reloading is enabled, renders the application again whenever we receive a message that the components have changed
  if (module.hot) { module.hot.accept(renderApplication); }
