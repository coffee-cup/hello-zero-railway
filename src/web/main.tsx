import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ZeroProvider } from "@rocicorp/zero/react";
import { Zero } from "@rocicorp/zero";
import { schema } from "../zero/zero-schema.gen.ts";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";

const encodedJWT = Cookies.get("jwt");
const decodedJWT = encodedJWT && decodeJwt(encodedJWT);
const userID = decodedJWT?.sub ? (decodedJWT.sub as string) : "anon";

const ZERO_SERVER = import.meta.env.VITE_ZERO_CACHE_SERVER;
if (!ZERO_SERVER) {
  throw new Error("ZERO_SERVER is not set");
}

const z = new Zero({
  userID,
  auth: () => encodedJWT,
  server: ZERO_SERVER,
  schema,
  kvStore: "idb",
  logLevel: "debug",
});

const Root = () => {
  return (
    <StrictMode>
      <ZeroProvider zero={z}>
        <h1 className="text-4xl mb-4 font-bold text-blue-500">hello</h1>

        <App />
      </ZeroProvider>
    </StrictMode>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);
