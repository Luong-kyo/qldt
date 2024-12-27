const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config({path:"./.env "})

const bodyParser = require("body-parser");
const auth = require("./routes/auth");
const lop = require("./routes/class");
const PORT = 3000;
// const db = require("./config/config");

// Configure dotenv

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Middlewares
app.use(express.json());

// Routes
app.use("/auth", auth);
app.use("/class", lop);



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

});
