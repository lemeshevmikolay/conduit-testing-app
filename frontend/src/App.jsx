import { Outlet } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import QaKnowledgeSidebar from "./components/QaKnowledgeSidebar/QaKnowledgeSidebar";

function App() {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main>
        <Outlet />
      </main>
      <QaKnowledgeSidebar />
      <footer className="community-footer">
        <Footer />
      </footer>
    </>
  );
}

export default App;
