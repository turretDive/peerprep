"use client";
import {
  ReactNode,
  createContext,
  useEffect,
  useState,
  useContext,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCookies } from "next-client-cookies";
import { login, signup, validateToken } from "../app/actions/auth";

import Modal from "../components/common/modal";
import Button from "../components/common/button";

interface AuthResponse {
  success: boolean;
  error?: string;
}

interface TAuthContext {
  token: string | null;
  username: string | null;
  login: (username: string, password: string) => Promise<AuthResponse>;
  signup: (
    username: string,
    password: string,
    email: string
  ) => Promise<AuthResponse>;
  logout: () => void;
}

export const AuthContext = createContext<TAuthContext>({
  token: null,
  username: null,
  login: async () => ({ success: false, error: "An error occurred" }),
  signup: async () => ({ success: false, error: "An error occurred" }),
  logout: () => {},
});

interface Props {
  children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const cookies = useCookies();

  const RedirectModal = () => {
    return (
      <Modal isOpen={isRedirectModalOpen} title="" isCloseable={false}>
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-semibold mb-4">{modalMessage}</h1>
          <Button
            text="Log In"
            onClick={() => {
              setIsRedirectModalOpen(false);
              router.push("/");
            }}
          />
        </div>
      </Modal>
    );
  };

  const updateToken = (token: string) => {
    const expireDate = new Date();
    expireDate.setTime(expireDate.getTime() + 1000 * 60 * 60 * 12);
    cookies.set("token", token, {
      sameSite: "strict",
      secure: true,
      expires: expireDate,
    });
    setToken(token);
  };

  const deleteToken = () => {
    cookies.remove("token");
    setToken(null);
  };

  const onAuthenticateTokenSuccess = () => {
    setIsRedirectModalOpen(false);

    if (pathname === "/") {
      router.push("/home");
    }
  };

  const onAuthenticateTokenFailure = () => {
    if (pathname.includes("/passwordReset")) {
      return;
    }
    if (pathname != "/") {
      if (token) {
        setModalMessage("Session expired. Please log in again.");
      } else {
        setModalMessage("Unauthorized. Please log in.");
      }
      setIsRedirectModalOpen(true);
      return;
    } else {
      setIsRedirectModalOpen(false);
    }
    deleteToken();
  };

  const handleLogin = async (username: string, password: string) => {
    const result = await login(username, password);

    if (typeof result === "string") {
      return { success: false, error: result };
    }

    if (result.token) {
      updateToken(result.token);
      router.push("/home");
      return { success: true };
    }

    return {
      success: false,
      error: "An error occurred while attempting to log in",
    };
  };

  const handleSignup = async (
    username: string,
    password: string,
    email: string
  ) => {
    const result = await signup(username, password, email);
    if (typeof result === "string") {
      return { success: false, error: result };
    }

    if (result.token) {
      updateToken(result.token);
      router.push("/home");
      return { success: true };
    }

    return {
      success: false,
      error: "An error occurred while attempting to log in",
    };
  };

  const logout = () => {
    router.push("/");
    deleteToken();
  };

  // Loads token from cookies on mount
  useEffect(() => {
    const token = cookies.get("token");
    if (token) {
      setToken(token);
    }
  }, [cookies]);

  // Checks if token is valid on page load
  useEffect(() => {
    const authenticateToken = async () => {
      let success = false;
      if (token) {
        const response = await validateToken(token);
        if (response) {
          success = true;
        }
      }
      return success;
    };
    authenticateToken().then((success) => {
      if (success) {
        onAuthenticateTokenSuccess();
      } else {
        onAuthenticateTokenFailure();
      }
    });
  }, [token, pathname]);

  // Updates username when token changes
  useEffect(() => {
    if (token) {
      // Decode the token to get the username
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        const decodedUsername = decodedToken.username;
        setUsername(decodedUsername);
        cookies.set("username", decodedUsername);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    } else {
      setUsername(null);
      cookies.remove("username");
    }
  }, [cookies, token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        login: handleLogin,
        signup: handleSignup,
        logout,
      }}
    >
      {!isRedirectModalOpen && children}
      <RedirectModal />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
