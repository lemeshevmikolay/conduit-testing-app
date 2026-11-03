# Settings

1. The "Settings" screen allows registered users to edit their profile information.  
     
2. Logged-in users can reach the Settings page from the header between "New Post" and the User's profile tabs.

3. If not logged-in users try reaching this form by link, the system should automatically redirect them to the Sign In form.

4. The main fields on the page are: "Username", "Email", and optional fields are "URL of profile picture", "Short bio about you", and "New password".

| Feature | Description |
| :---- | :---- |
| URL of profile picture | Optional field;  Users can enter only one link into this field;  If the input is not a link, the "URL of profile picture is invalid" error message appears;  |
| Username | Described in [this](https://docs.google.com/document/d/163l8WmwPZJCYqd1PWzwDLpjvfdcAyw3kSrrXFeqS0xE/edit#heading=h.954wbz3l70rb) section. |
| Short bio about you | Optional field;  Max 9000 symbols;  Accepts letters, numbers, special characters, and spaces (can't be first, last, and few in a row). |
| Email | Described in [this](https://docs.google.com/document/d/163l8WmwPZJCYqd1PWzwDLpjvfdcAyw3kSrrXFeqS0xE/edit#heading=h.nu1txo814wx5) section. |
| New password | Optional field;  Can't be the same as the previous password; 8-30 symbols;  Accept letters, numbers, special characters;  Should contain at least one symbol, one integer, one capital letter;  The input is covered by the password mask (\*\*\*\*). |

5. The \[Update Settings\] button validates all mandatory fields and (if they are filled with valid values) updates the information about the user.

6. If the "URL of profile picture" field was updated, the new profile picture appears near the username in the upper right corner of the page.

7. If the "Username" field was updated, the new username appears in the upper right corner of the page.

8. If the "Short bio about you" field was updated, the new bio appears under the username on the user page.

9. If the "Email" field is updated, the user can log in with the new email.  
10. If the "Email" field is updated, the user can’t log in with the old email.

11. If the "Password" field is updated, the user can log in with the new password.  
12. If the "Password" field is updated, the user cannot log in with the old password.

13. The "Or click here to logout"  button should be present under the fields and the "Update Settings" button.

14. A user is redirected to the [Home page](https://docs.google.com/document/d/1un0SQNzBD8yBbL_fsVytxWJTmcjqBvXekWG00Hk5Jrk/edit#heading=h.k8e1eevh74nu) and is logged out after clicking the "Or click here to logout" button.