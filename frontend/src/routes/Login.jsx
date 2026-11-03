import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthPageContainer from "../components/AuthPageContainer";
import LoginForm from "../components/LoginForm";

function Login() {
  const [errorMessage, setErrorMessage] = useState();
  const { isAuth, loggedUser } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  useEffect(() => {
    if (isAuth) navigate(`/profile/${loggedUser.username}`, { replace: true });
  }, [isAuth, loggedUser.username, navigate]);

  const handleError = (error) => {
    setErrorMessage(error);
  };

  return (
    <AuthPageContainer
      error={errorMessage}
      path="/register"
      text="Need an account?"
      title="Sign in"
    >
      {!isAuth && <>
        {state?.message && <p role="status">{state.message}</p>}
        <LoginForm onError={handleError} />
      </>}
    </AuthPageContainer>
  );
}

export default Login;
