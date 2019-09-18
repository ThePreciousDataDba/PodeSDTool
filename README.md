# PowerShell Service Desk Tool

> A PowerShell tool utilizing <a href="https://github.com/Badgerati/Pode" target="_blank">**Pode**</a> to create a web interface for common service desk duties.

<img src="https://i.imgur.com/myk0JCK.png" title="Profile View" alt="Profile View">

## Project Background

> The goal of this project is to create a single tool for all the common daily service desk tasks. My current role requires me to use at least 4 different tools which can be replaced with this. The project is very early in development. Current functionality is limited to fetching data and has partial integration for ActiveDirectory and ServiceDesk+.

** Planned Features **

- Integration with ManageEngine ServiceDesk+
- Quick-actions to automate or simplify multi-step processes
- Skype integration
- Enhanced search functionality for Active Directory

** Partially Implemented Features **

- Live-searching of AD objects
	- Searches employeeID, email, all name attributes, and more
	- Utilizes the Typeahed library for super fast search results
	- <img src="https://i.imgur.com/AO5CDta.png" title="Search Bar" alt="Search Bar">
- DataTables for cached AD data
	- Allows for super fast searching of AD data
	- Select which columns to show and generate .csv documents for simple reports
- ServiceDesk+ ticket list
	- View tickets and conversations
	- Quick links to target user profiles
- Profile page which pulls data from AD, SDP+, and local notes
	- Persistent notes on user profiles which are saved locally. Supports images and @Mentions for AD users
	- List of recent support requests that the user created, were created for, or on behalf of.
	- User information from AD like job title, location, other basics
	- Recursive member-of list for all groups the user is in.