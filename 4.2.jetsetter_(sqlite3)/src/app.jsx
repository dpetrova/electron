import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Application from './components/Application.jsx';
import database from './database';

const renderApplication = async () => {
    //require a fresh version of the Application, which requires all the other modules in our application when rendering
    const { default: Application } = await import('./components/Application.jsx');

    ReactDOM.render(
      <AppContainer>
        {/* pass database into the Application component as a property */}
        <Application database={database} />
      </AppContainer>,
      document.getElementById('application')
    );
  };
  
  renderApplication();
  
  //if hot module reloading is enabled, renders the application again whenever we receive a message that the components have changed
  if (module.hot) { module.hot.accept(renderApplication); }
