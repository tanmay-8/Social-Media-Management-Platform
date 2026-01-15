const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// Trust proxy (needed for rate limiting behind reverse proxy)
app.set("trust proxy", 1);

// CORS Configuration
const corsOptions = {
    origin: process.env.CORS_ALLOWED_ORIGIN || "http://localhost:5173",
    credentials: true,
    optionsSuccessStatus: 200,
};

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/subscriptions", require("./routes/subscriptions"));
app.use("/api/festivals", require("./routes/festivals"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/compose", require("./routes/compose"));
app.use("/api/scheduled", require("./routes/scheduled"));
app.use("/api/social", require("./routes/social"));

// Swagger setup
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Social Media Management Platform API",
            version: "1.0.0",
            description: "API docs for backend",
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date() });
});

// Database connection
const PORT = process.env.PORT || 3000;
const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/social-media-platform";

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        if (
            !process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ) {
            console.warn(
                "Cloudinary not configured. Image upload endpoints will fail until CLOUDINARY_* env vars are set."
            );
        }
        if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
            console.warn(
                "⚠️  Meta API not configured. Social media posting will not work until META_APP_ID and META_APP_SECRET are set."
            );
        }
        console.log("Connected to MongoDB");

        // Start auto-posting scheduler
        const { startScheduler } = require("./utils/autoPostScheduler");
        startScheduler();

        // Start festival auto-scheduling
        const {
            startFestivalScheduler,
        } = require("./utils/autoScheduleFestivals");
        startFestivalScheduler();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API Documentation: http://localhost:${PORT}/api/docs`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });
