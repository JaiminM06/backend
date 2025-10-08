import { NavLink, Outlet } from 'react-router-dom'; 

function Home() {
  return (
    <div>
      <h1>🏠 Home Page</h1>
      <p>Welcome! Use the links above to navigate.</p>
      <li>
        <NavLink
        to='/Register'>Register</NavLink>
      </li>
      <li>
        <NavLink to='/Login'>Login</NavLink>
      </li>
    </div>
    
  );
}

export default Home;
