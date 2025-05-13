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

const ZERO_SERVER = process.env.BUN_PUBLIC_ZERO_CACHE_SERVER;
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
        <App />
      </ZeroProvider>
    </StrictMode>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);
