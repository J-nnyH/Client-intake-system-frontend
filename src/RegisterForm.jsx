import {useState} from 'react';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL;


function RegisterForm({setUser}){
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    async function handleRegister(name, surname, email, password){
    const user = {
        name:name,
        surname: surname,
        email:email,
        password:password
    }
    try{
        const url = `${BASE_URL}/auth/register`;
        const response = await fetch(url,{
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(user),
            credentials: 'include'
        })
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || `Response status: ${response.status}`);
        setUser(data.user);
        navigate('/dashboard');
        setError(null);
    }catch(err){
        setError(err.message);
    }
}

    return (
        <form onSubmit={(e) => {
        e.preventDefault();
        handleRegister(name, surname, email, password);
        }}>
            <h2>Sign Up</h2>
            <div className='full-name'>
                <input placeholder="Name" type="text" value={name} onChange={(e)=> setName(e.target.value)}></input>
                <input placeholder="Surname" type="text" value={surname} onChange={(e)=> setSurname(e.target.value)}></input>
            </div>
            <input placeholder="Email" type="email" value={email} onChange={(e)=> setEmail(e.target.value)}></input>
            <input placeholder="Password" type="password" value={password} onChange={(e)=> setPassword(e.target.value)}></input>
            {error && <p className='form-error'>{error}</p>}
            <button type='submit' >Register</button>
            
        </form>
    )
}

export default RegisterForm;