function Navbar({ user, logout }) {
  return (
    <nav className="navbar navbar-dark bg-dark px-4">
      <span className="navbar-brand">
        💰 Expense Tracker
      </span>

      <div className="d-flex align-items-center">

        <span className="text-white me-3">
          Welcome, {user?.name}
        </span>

        <button
          className="btn btn-danger"
          onClick={logout}
        >
          Logout
        </button>

      </div>
    </nav>
  );
}

export default Navbar;