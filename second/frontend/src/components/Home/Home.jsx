import { NavLink, Outlet } from "react-router-dom";



function Home() {
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-700 flex flex-col items-center justify-center text-white">
      <div className="bg-white text-gray-800 shadow-2xl rounded-2xl p-10 w-full max-w-lg text-center">
        <h1 className="text-4xl font-bold text-indigo-700 mb-3">🏠 Home Page</h1>
        <p className="text-gray-600 mb-8">
          Welcome! Use the links below to navigate.
        </p>

        <ul className="flex flex-col space-y-4">
          <li>
            <NavLink
              to="/Register"
              className="block w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
            >
              Register
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/Login"
              className="block w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition duration-300"
            >
              Login
            </NavLink>
          </li>
        </ul>
      </div>
      <Outlet />
    </div>
  );
}

export default Home;
