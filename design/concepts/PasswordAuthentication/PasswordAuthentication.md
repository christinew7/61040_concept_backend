# Concept: PasswordAuthentication

- **concept**: PasswordAuthentication
- **purpose**: limit access to known users
- **principle** after a user registers with a username and password, <br>they can authenticate with that same username and password <br>and be treated each time as the same user
- **state**
	- a set of `Users` with
		- a `username` String
		- a `password` String
- **actions**
	- `register (username: String, password: String): (user: User)`
		- **requires** this `username` doesn't already exist, this username is not empty
		- **effects** creates a new User with this `username` and this `password`
	- `authenticate (username: String, password: String): (user: User)`
		- **requires** this `username` exists in the Users set, input `password` matches username's preexisting password
		- **effects** User is successfully authenticated and returns the User
