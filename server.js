const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();
const csv = require("csv-parser");

const PORT = process.env.PORT;
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let csvData = [];

const parseCsvFile = (filename = "auto-mpg.csv") => {
  return new Promise((resolve, reject) => {
    const results = [];
    const filePath = path.join(__dirname, filename);
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      reject(new Error(`CSV file not found: ${filename}`));
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        console.log("Successfully parsed CSV file.");
        resolve(results);
      })
      .on("error", (error) => reject(error));
  });
};

const initializeData = async () => {
  try {
    csvData = await parseCsvFile();
  } catch (error) {
    console.error("Error loading CSV data:", error.message);
  }
};

router.get("/data", (req, res) => {
  if (csvData.length === 0) {
    return res.status(404).json({
      error: "No CSV data.",
    });
  }
  res.json({ data: csvData });
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.message });
  }
  res.status(500).json({ error: error.message });
});

// Routes
app.use("/api", router);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use(
  cors({
    origin: "https://fuel-data-app.onrender.com",
  })
);
app.options("*", cors());

// Start server
initializeData().finally(() => {
  app.listen(PORT, () => {
    console.log(`CSV Parser API server running on port ${PORT}`);
    console.log(`API endpoints: http://localhost:${PORT}/api`);
  });
});

module.exports = app;
