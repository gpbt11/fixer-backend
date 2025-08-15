const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send({ message: 'Hello from the Fixer backend!' });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
