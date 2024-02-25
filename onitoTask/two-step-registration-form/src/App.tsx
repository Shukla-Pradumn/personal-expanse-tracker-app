import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import FirstForm from './components/firstForm';
import SecondForm from './components/secondForm';
import MyDataTableComponent from './components/dataTables';

const App: React.FC = () => {
  const onSubmit = async (data: any) => {
    console.log(data);
  };

  return (
    <div className="App">
      <Router>
        <div>
          <Routes>
            <Route path="/" element={<FirstForm onSubmit={onSubmit} />} />
            <Route
              path="/secondForm"
              element={<SecondForm onSubmit={onSubmit} />}
            />
          </Routes>
        </div>
      </Router>
    </div>
  );
};

export default App;
