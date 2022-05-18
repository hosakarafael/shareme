import { UserProvider } from "../../context/userContext";
import "./App.css";
import "../Form/Form.css";
import AppRoutes from "./AppRoutes";
function App() {
  return (
    <>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </>
  );
}

export default App;
