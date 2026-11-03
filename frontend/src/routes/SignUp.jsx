import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthPageContainer from "../components/AuthPageContainer";
import SignUpForm from "../components/SignUpForm";

function SignUp() {
  const [errorMessage, setErrorMessage] = useState();
  const { isAuth, loggedUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuth) navigate(`/profile/${loggedUser.username}`, { replace: true });
  }, [isAuth, loggedUser.username, navigate]);

  const handleError = (error) => {
    setErrorMessage(error);
  };

  return (
    <AuthPageContainer
      error={errorMessage}
      path="/login"
      text="Have an account? Sign in"
      title="Sign up"
    >
      {!isAuth && <SignUpForm onError={handleError} />}
    </AuthPageContainer>
  );
}

export default SignUp;
