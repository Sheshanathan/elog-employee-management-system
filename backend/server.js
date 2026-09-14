require("dotenv").config();
const express = require("express");
const cors = require("cors");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const employeeRoutes = require("./routes/employeeRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const designationRoutes = require("./routes/designationRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const correctionRoutes = require("./routes/correctionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const connectDB = require("./config/db");
const swaggerUI = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const requiredEnvironmentVariables = [
    "MONGODB_URI",
    "JWT_SECRET",
    "EMAIL_USER",
    "BREVO_API_KEY",
    "FRONTEND_URL"
];
const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
    (name) => !process.env[name]
);

if (missingEnvironmentVariables.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missingEnvironmentVariables.join(", ")}`
    );
}

const app = express();
const frontendOrigin = process.env.FRONTEND_URL.replace(/\/$/, "");

app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: "1mb" }));
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

app.get("/", function(req, res) {
    res.send("Welcome to Employee Management System API");
});

app.get("/about", function(req, res) {
    res.send("Employee Management System Version 1.0");
});

if (process.env.NODE_ENV !== "production") {
    app.use(
        "/api-docs",
        swaggerUI.serve,
        swaggerUI.setup(swaggerSpec)
    );
}

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, function() {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.name || "UnknownError");
        process.exit(1);
    }
}

startServer();
