import {useState, useEffect} from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';

const BASE_URL = import.meta.env.VITE_API_URL;

function App(){
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    checkUser();
  }, [])
    
  async function checkUser() {
    const url= `${BASE_URL}/auth/me`
    try{
      const response = await fetch(url, {
      method: 'GET',                
      credentials: 'include'
      })
      if (!response.ok) {
        setUser(false); 
        return;
      }
      const data = await response.json();
      setUser(data.user)
    }catch(err){
      setError(err);
      setUser(null); 
    }
    finally{
      setAuthLoading(false);
    }
  }

  return (
    <BrowserRouter> 
      {error && <p className="error">{error.message || String(error)}</p>}
      <Routes>
        <Route 
          path='/' 
          element={<LandingPage setUser={setUser} />}
        />
          <Route 
          path='/dashboard' 
          element={authLoading ? <p>Loading...</p> : user ? <Dashboard user={user} setUser={setUser}/>: <Navigate to='/'/>}
        />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;