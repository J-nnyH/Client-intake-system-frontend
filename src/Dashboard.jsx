import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPenToSquare} from '@fortawesome/free-solid-svg-icons';

const BASE_URL = import.meta.env.VITE_API_URL;

function Dashboard({user, setUser}) {
// ===== STATE =====
  // --- Data State ---
  const [clients, setClients] = useState([]);
  const [error, setError] = useState(null);

  // --- Form State ---
  const [newName, setNewName] = useState("");
  const [newSurname, setNewSurname] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [editing, setEditing] = useState('');

  // --- UI State ---
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [deleteClientId, setDeleteClientId] = useState(null)
  const [loading, setLoading] = useState(true);
  const [openClient, setOpenClient] = useState('');
  const [invalidError, setInvalidError] = useState({})

  // ===== REFS =====
  const formRef = useRef(null);

  // ===== DERIVED VALUES =====
  const clientToDelete = clients.find(c => c._id === deleteClientId);

 // ===== FILTER & SEARCH =====
 const query = search.toLowerCase()

 const filteredClients = clients.filter((client)=> {
   if(!filter) return true;
   if(filter === 'client') return client.status=== 'client';
   if(filter === 'lead') return (client.status || "").includes('lead');
   return true; // fallback
 })

 const searchedClients = filteredClients.filter((client)=>{
   const email = client.email || ""
   const emailName = email.split("@")[0]
   const text = [client.name, client.surname, emailName]
     .filter(Boolean) // entfernt null/undefined/"" automatisch
     .join(' ')
     .toLowerCase()
   return text.includes(query)}
 )

 // ===== HELPER FUNCTIONS =====
 function validateEmail(email) {
   if (!email) return "Email required." 
 
   const clean = email.trim().toLowerCase()
   const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)
 
   if (!valid) return "Invalid email format"
 
   if (clients.some(c => c.email?.toLowerCase() === clean && c._id !== editing)) {
     return "Email already exists"
   }
 
   return null
 }

 function fieldError(field, message){
   setInvalidError(prev=> {
     const copy = {...prev};
     if (message) copy[field]= message 
     else delete copy[field]
     return copy
   })
 }
 function formatName(str = "") {
   return str
     .trim()
     .toLowerCase()
     .replace(/\b\w/g, c => c.toUpperCase());
 }
 function formReset(){
   setNewSurname('');
   setNewName('');
   setNewEmail('');
   setNewStatus('');
   setNewNote('');
   setEditing('');
   setInvalidError({});
 }

 // const isFormInvalid =
 // !newEmail.trim() ||
 // !newStatus ||
 // Object.keys(invalidError).length > 0;

 // ===== API FUNCTIONS =====
 async function findClients() {
   const url = `${BASE_URL}/`;
   try {
     const response = await fetch(url, {
        credentials: 'include'
     });
     if (!response.ok) throw new Error(`Response status: ${response.status}`);
     const result = await response.json();
     setError(null);
     return result;
   } catch (err) {
     console.error(err.message);
     setError(err.message);
   }
 }

 async function addClientDB(client) {
   const url = `${BASE_URL}/create`;
   try {
     const response = await fetch(url, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(client),
       credentials: 'include'
     });
     if (!response.ok) throw new Error(`Response status: ${response.status}`);
     const result = await response.json();
     formReset()
     setError(null);
     return result; // für frontend add
   } catch (err) {
     console.error(err.message);
     setError(err.message);
   }
 }

 async function updateClient(client){
   const clientid = editing
   const url= `${BASE_URL}/update/${clientid}`
   // optimistic  ui update
   setClients(prev => prev.map(c=> c._id === clientid ? {...c, ...client} : c))
   try{
     const response = await fetch (url, {
       method: 'PUT',
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(client),
       credentials: 'include'
     })
     const data = await response.json()
     if (!response.ok) throw new Error(data?.message ||`Response status: ${response.status}`);
     setError(null);
     formReset()
   } catch (err){
     console.error(err.message);
     setError(err.message);
     // 'rollback' to DB 
     loadClients();
   }
 }
 async function deleteClient(clientid) {
   setDeleteClientId(null)

   const prevClients = clients;

   const deletedClient = clients.find(c => c._id === clientid);

   if (!deletedClient) return;

   // optimistic  ui update
   setClients(c=>c.filter(client => client._id !== clientid))

   const url = `${BASE_URL}/delete/${clientid}`;

   try {
     const response = await fetch(url, {
       method: "DELETE",
       credentials: 'include'
     });
     const data = await response.json()
     if (!response.ok) throw new Error(data?.message || `Response status: ${response.status}`);
     setError(null);
   } catch (err) {
     console.error(err.message);
     setError(err.message);
     setClients(prevClients);
   }
  }
  async function loadClients() {
    setLoading(true);
    const data = await findClients();
    if (data) setClients(data);
    setLoading(false);
  }

  async function handleLogout(){
    const url = `${BASE_URL}/auth/logout`;
    try {
      const response = await fetch(url, {
        method:'POST',
        credentials:'include'
      })
      if(!response.ok) throw new Error(`Response status: ${response.status}`);
      setError(null)
      setUser(null)
    }catch(err){
      console.log(err.message)
      setError(err.message)
    }
  }
  
 // ===== EFFECTS =====
 useEffect(() => {
   loadClients();
 }, []);

 // ===== UI FUNCTIONS =====
 async function handleSubmit() {
   let hasError = false;
   
   if (!newStatus) { fieldError("status", "Status required");  hasError = true; }

   const emailMsg = validateEmail(newEmail);
   if (emailMsg) { fieldError("email", emailMsg); hasError = true; }

   if (hasError) return;

   const formClient = {
     surname: formatName(newSurname),
     name: formatName(newName),
     email: newEmail.trim().toLowerCase(),
     status: newStatus,
     note: newNote
   };
   if (!editing){
     const clientCreated = await addClientDB(formClient);
     if (clientCreated) setClients(prev=> [clientCreated, ...prev]);
   } else {
     updateClient(formClient);
   }
 }

 function editClient(client){
   setNewSurname(client.surname);
   setNewName(client.name);
   setNewEmail(client.email);
   setNewStatus(client.status);
   setNewNote(client.note);
   setEditing(client._id);
   setInvalidError({});

   const isMobile = window.matchMedia("(max-width: 768px)").matches;

   if (isMobile) {
     setTimeout(() => {
       formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
     }, 50);
   }
 }

// ===== JSX =====
 return (
  <div className="dashboard">
    <div className="top-bar">       
        <h1>Client Intake System</h1>
        <div className="user-section">
        <div>        
          <div className="avatar">
          {user?.name?.[0]?.toUpperCase()}
          </div>
          <span>Hello {user?.name || 'you'}!</span>
        </div>

        <button onClick={handleLogout}>Logout</button>
      </div></div>
   <div className="app-container">
     {/* --- Client List --- */}
     <div> 
      


       <div className="header-row">        
         <h2>Client List:</h2>
         <div className="search">    
           <form onSubmit={(e) => e.preventDefault()}>
             <input 
             type="search"
             placeholder="Search clients.." 
             value={search} id="search" 
             onChange={(e)=> setSearch(e.target.value)} />
             {/* <button type="submit">
               <FontAwesomeIcon icon={faMagnifyingGlass} />
             </button> */}
           </form>
         </div>
       </div>

       <div className="filter">
         <span>Contacts : {searchedClients.length}</span>
         <div className="filter-options">
           <button onClick={()=> setFilter('')}>All</button>
           <button onClick={()=> setFilter('client')}>Clients</button>
           <button onClick={()=> setFilter('lead')}>Leads</button>
         </div>
       </div>
       
       <ul className="client-list">
         {loading && <p><span className="loader"></span> Loading...</p>}
         {error && <p className="error">{error}</p>}
         {!error && !loading && clients.length === 0 && <p>No clients yet</p>}
         {!loading && clients.length > 0 && searchedClients.length === 0 && (
           <p>No matching clients</p>
         )}
         {searchedClients.map(client => (
           <li 
           className={openClient === client._id ? 'active' : ''}
           onClick={ () =>setOpenClient(prev => prev === client._id ? '' : client._id)} 
           key={client._id}>
             <div className="preview">
               <span className="chevron">
                 {openClient === client._id ? '⌄' : '›'}
               </span>
               {client.name} {client.surname}
               <div className="client-buttons">
                 <button title= 'Edit' onClick={(e)=>{
                   e.stopPropagation();
                   editClient(client);
                   setOpenClient(client._id)}}>
                   <FontAwesomeIcon icon={faPenToSquare} />
                 </button>

                 <button className="delete" title= 'Delete' onClick={(e)=>{
                   e.stopPropagation();
                   setDeleteClientId(client._id)}}>					
                 <FontAwesomeIcon icon={faTrash}/>
                 </button>
               </div> 
             </div> 
               {openClient=== client._id && (<div className="client-details">
                 mail: {client.email} <br />
                 status: {client.status} <br />
                 <span className={`status-tag ${client.status.toLowerCase().replace(/\s+/g, '')}`}>
                 {client.status}
                 </span>
                 {client.note && <div className="note">“{client.note}”</div>}
                 </div>)}
           </li>
         ))}
       </ul>
     </div>

     {/* --- Form --- */}
     <form ref={formRef} className="client-form" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
       <h2> {(editing) ? 'Edit Client' : 'Add Client'}</h2>

       <div className="form-group">
         <label htmlFor="name">First name</label>
         <input
           id="name"
           type="text"
           placeholder="First name"
           value={newName}
           onChange={e => setNewName(e.target.value)}
         />
       </div>

       <div className="form-group">
         <label htmlFor="surname">Surname</label>
         <input
           id="surname"
           type="text"
           placeholder="Surname"
           value={newSurname}
           onChange={e => setNewSurname(e.target.value)}
         />
       </div>

       <div className="form-group">
         <label htmlFor="email">Email*</label>
         <input
           id="email"
           type="email"
           placeholder="Email"
           value={newEmail}
           onChange={e => {setNewEmail(e.target.value)
              if(invalidError.email &&!validateEmail(e.target.value)) fieldError('email')}}
           onBlur= {()=>{
             const errorMsg = validateEmail(newEmail);
             if(errorMsg) fieldError('email', errorMsg);
           }}
         />
         {invalidError.email && (<span>{invalidError.email}</span>)}
       </div>

       <div className="form-group">
         <label htmlFor="status">Status*</label>
         <select
           id="status"
           name="status"
           value={newStatus}
           onChange={e => {
             setNewStatus(e.target.value); 
             fieldError('status');
           }}
           onBlur={()=>{if (!newStatus) fieldError('status','Status required')}}
         >
           <option value="" disabled>Choose status</option>
           <option value="client">Client</option>
           <option value="warm lead">Warm Lead</option>
           <option value="cold lead">Cold Lead</option>
         </select>
         {invalidError.status && (<span>{invalidError.status}</span>)}
       </div>

       <div className="form-group">
         <label htmlFor="note">Note</label>
         <input
           id="note"
           type="text"
           placeholder="Note"
           value={newNote}
           onChange={e => setNewNote(e.target.value)}
         />
       </div>
       <div className="formButtons">
         {editing && (<button className='cancelButton'onClick={()=> { 
           setEditing(''); 
           formReset()
           setOpenClient('')}}>Cancel X
           </button>)
           }
         <button type="submit">{(editing) ? 'Edit Client ✓' : 'Add'}</button>
         </div>

     </form>
         
     {/* Delete Modal */}
     {deleteClientId && clientToDelete && (
       <div className="modal-overlay" onClick={()=>setDeleteClientId(null)}>
       <div className="modal-box" onClick={(e)=>e.stopPropagation()}>
         <p>Delete {clientToDelete.name} {clientToDelete.surname}?</p>
         <button className="confirm-delete" onClick={()=> deleteClient(deleteClientId)}>Yes</button>
         <button onClick={()=> setDeleteClientId(null)}>Cancel</button>
       </div>
       </div>)}
   </div></div>
 );
}

export default Dashboard;
