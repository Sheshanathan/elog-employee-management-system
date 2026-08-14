require("dotenv").config();
const express=require("express");
const cors=require("cors");
const logger=require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const employeeRoutes=require("./routes/employeeRoutes");
const authRoutes=require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const designationRoutes = require("./routes/designationRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const correctionRoutes = require("./routes/correctionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const jwt=require("jsonwebtoken");
const app=express();
const connectDB=require("./config/db");
const path=require("path");
const swaggerUI=require("swagger-ui-express");
const swaggerSpec=require("./config/swagger");
app.use(cors({ origin: process.env.FRONTEND_URL || true }));
app.use(express.json());
app.use(logger);
app.use(authRoutes);
app.use(employeeRoutes);
app.use(userRoutes);
app.use(departmentRoutes);
app.use(designationRoutes);
app.use(attendanceRoutes);
app.use(leaveRoutes);
app.use(correctionRoutes);
app.use(notificationRoutes);
app.use(errorHandler);
app.use(
    "/uploads",
    express.static(path.join(__dirname,"uploads"))
);
const PORT=process.env.PORT;
app.get("/",function(req,res){
    res.send("Welcome to Employee Management System API");
})
app.get("/about",function(req,res){
    res.send("Employee Management System Version 1.0");
})
app.listen(PORT,function(){
    console.log(`Server is running on port ${PORT}`);
});
app.use(
    "/api-docs",
    swaggerUI.serve,
    swaggerUI.setup(swaggerSpec)
);
connectDB();
