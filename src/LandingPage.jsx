import {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm.jsx';
import RegisterForm from './RegisterForm.jsx';



function LandingPage({setUser}){
    const [mode, setMode] = useState(null)

    const navigate = useNavigate();
    async function guestLogin(){
        try{
            const url = `${import.meta.env.VITE_API_URL}/auth/guest`
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {"Content-Type": "application/json"},
            })
            if (!response.ok) throw new Error(`Response status: ${response.status}`);
            const data = await response.json();
            setUser(data.user);
            navigate('/dashboard');
        }catch(err){
            console.error(err.message);
        }
    }

    return (
        <div className='landing-page'>
            <p className={`${mode ? 'small' : ''}`}>Welcome to</p>
            <h1 className={`${mode ? 'small' : ''}`} onClick={()=>{if(mode) setMode(null)}}>Client Intake System</h1>

            {mode==='login'&& <LoginForm setUser={setUser}/>}
            {mode==='register'&& <RegisterForm setUser={setUser}/>}

            <div className='mode-buttons'>            
                {mode!=='login' && 
                    <button onClick={()=>{
                    setMode('login')}}>Login</button>}
                <button onClick={()=>guestLogin()}>Login as guest</button>
                {mode!=='register'&&
                <button onClick={()=>setMode('register')}>Sign Up</button>}
            </div>

        </div>
    )
};

export default LandingPage;