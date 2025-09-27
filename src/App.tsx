import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <RouterProvider router={router} />
      </div>
    </AuthProvider>
  );
}

export default App;
