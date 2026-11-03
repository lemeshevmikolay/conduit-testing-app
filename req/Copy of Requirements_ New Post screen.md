# New Article

1. The "New Article" form allows registered users to create new articles.   
     
2. Logged-in users can reach this page from the header section between the "Home" and "Settings" links.  
     
3. If not logged-in users try to reach this page by direct link, they should be redirected to the Sign In (Login) form.  
     
4. The main fields on the page are "Article Title", "What's this article about?" and "Write your article", the optional field is "Enter tags".

| Feature | Description |
| :---- | :---- |
| Article title | **Required field**, if empty "Title of the article can't be empty (minimum 5 symbols)" error message appears;  If a user tries to create an article with a non-unique title, the warning message should appear: “Article with a similar Title already exists. Do you want to continue?” Min 5 symbols;  Max 240 symbols;  Accepts letters, numbers, special characters, and spaces (can't be first, last, and few in a row).  |
| What's this article about? | **Required field**, if empty "Description of the article can't be empty (minimum 5 symbols)" error message appears;  Short description of the article;  Min 5 symbols; Max 240 symbols; Accepts letters, numbers, special characters, and spaces (can't be first, last, and few in a row).  |
| Write your article | **Required field**, if empty "Body of article can't be blank." error message appears.  Min 20 symbols;  Max 9000 symbols;  The field doesn’t accept any attachments;  The user should be able to slide down the right corner of the text area to change its size;  Accepts letters, numbers, special characters, and spaces (can't be first, last, and few in a row).  |
| Enter tags | **Optional field**;  The user should be able to create tags for his article for future sorting;  The Tag contains 2-30 symbols (only letters and numbers, and the “\#” symbol at the beginning);  An article can contain 1-10 tags;  Each tag should start with the "\#" symbol;  Tags are not case-sensitive. |

5. Users should be able to create an article by clicking on the \[Publish Article\] button or pressing the Enter button.  
     
6. Validation messages for the empty fields should be shown immediately under the field.  
     
7. If a user leaves the "New Article" screen without publication, all entered info vanishes.  
     
8. After the successful article publishing, the user should be redirected to the [Article page](https://docs.google.com/document/d/1yr_SlQU3JBbYc4Vuff8fPMbikE0WAp3ShcC-GJfD8sg/edit#).

