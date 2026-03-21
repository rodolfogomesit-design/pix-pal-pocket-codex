import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "@/app/providers";
import { AppRoutes } from "@/app/routes";

const App = () => (
  <BrowserRouter>
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  </BrowserRouter>
);

export default App;
