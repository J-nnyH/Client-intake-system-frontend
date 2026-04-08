import {useState} from 'react';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL;


function LoginForm({setUser}){
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [error, setError] = useState('')
    
    const navigate = useNavigate();

    async function handleLogin(email, password){
        try {
        const logged = {
            email: email,
            password: password
        };
        const url = `${BASE_URL}/auth/login`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(logged),
            credentials: 'include'
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || `Response status: ${response.status}`);

        setUser(data.user); 
        setError(null);
        navigate('/dashboard');
    } catch (err) {
        setError(err.message);
    }
    }

    return(<form onSubmit={(e)=>{
        e.preventDefault();
        handleLogin(email, password)}}>
        <h2>Login</h2>
        <input id='email' placeholder="Email" type="email" value={email} onChange={(e)=> setEmail(e.target.value)}></input>
        <input id='password' placeholder="Password" type="password" value={password} onChange={(e)=> setPassword(e.target.value)}></input>
        {error && <p className='form-error'>{error}</p>}
        <button>Login</button>

    </form>
    )
};

export default LoginForm;