import Navbar from "../components/Navbar";

function Home() {
  return (
    <>
      <Navbar />

      <div className="hero">
        <h1>Manage Your Expenses Easily</h1>

        <p>
          Track your income and expenses with ease.
        </p>

        <button>Get Started</button>

        <h3 style={{ marginTop: "40px" }}>
          Welcome to Expense Tracker 🚀
        </h3>
      </div>
    </>
  );
}

export default Home;