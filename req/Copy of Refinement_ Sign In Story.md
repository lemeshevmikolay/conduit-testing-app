# Sign In form

[General requirements](#general-requirements)

[Requirements for the fields](#requirements-for-the-fields)

[Validation Messages](#validation-messages)

# General requirements {#general-requirements}

1. Users should be able to open the Sign In page after clicking on the “Sign in” link in the Conduit navigation bar. The page should contain a form with two text fields \- one for entering an email or username, and one for entering a password, and the \[Sign in\] button.  
     
2. The Sign In page should have the “Need an account?” link which redirects to the “Sign up” page, and the “Forgot the password?” link which redirects to the “Forgot password” page.  
   Users should be able to log in by clicking on the \[Sign In\] button or pressing an Enter button.

# Requirements for the fields {#requirements-for-the-fields}

3. The “Sign In” form should contain the following fields:

| Field | Requirements |
| :---- | :---- |
| 3.1. Email or Username | Required field; Should accept email and username as valid credentials to log in; Should contain a placeholder: Enter your username or email; It is not a case-sensitive field. |
| 3.2. Password | Required field; Asterisks should cover input; User s shouldn’t be able to copy or cut values from the field; Users should be able to paste data into the field. |

# Validation Messages {#validation-messages}

4. The next validation messages should be shown to the user:

4.1. Validation messages for the empty fields should be shown immediately under the field. Validation messages list:

* “Email or Username: can’t be blank”;  
* “Password: can’t be blank”.

4.2. Validation after request to the server:  
4.2.1. For the invalid email: “User with such email or username not registered.”  
4.2.2. For the invalid password: “Entered Invalid password\! Check your keyboard layout or Caps Lock. Send a one-time password to your email?”  
4.2.2.1. Click on the “Send one-time password” link in the message should redirect users to the “Forgot password” page.

5. If logged-in users are trying to reach this page by direct link, they should be redirected to the personal account page.