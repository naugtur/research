
- log in to libraries.io with github
- go to settings
- copy the API key to a .env file
- .env should be gitignored

```sh
node fetch.js
node cleanup.js
node flatten.js
```

note fetch has two modes: by dependents_count and by rank