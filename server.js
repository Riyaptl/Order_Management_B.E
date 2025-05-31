const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const fs = require('fs')
const path = require("path")
const {connection} = require("./config/db")
const authRoute = require("./routes/authRoute")
const authenticateUser = require("./middlewares/JwtAuth");
const areaRoute = require('./routes/areaRoute')
const shopRoute = require('./routes/shopRoute')
const orderRoute = require('./routes/orderRoute')
const userRoute = require('./routes/userRoute')
const cors = require('cors');


// Express app
dotenv.config()
const app = express()
app.use(express.json())

// https://order-management-f-e-mk4n-ptmev3v3f.vercel.app/

// CORS
// app.use(cors({
//   origin: 'http://localhost:3000',
//   credentials: true,  // if you use cookies or auth headers
// }));
app.options("*", cors());

// DB connection
connection()
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})

// Auth Route
app.use("/api/auth", authRoute)

// //Authenticate
// app.use(authenticateUser);

// Routes
app.use("/api/area", areaRoute)
app.use("/api/shop", shopRoute)
app.use("/api/order", orderRoute)
app.use("/api/user", userRoute)

