const errorHandler = (err, req, res, next) => {
  console.error("=== ERROR HANDLER CAUGHT ===");
  console.error("Error name:", err.name);
  console.error("Error message:", err.message);
  console.error("Error stack:", err.stack?.substring(0, 500));
  
  // Special handling for specific error types
  if (err.message && err.message.includes('image input')) {
    console.error("IMAGE ERROR DETECTED - This might be a data corruption issue");
    console.error("Full error:", err);
  }

  // Determine appropriate status code
  const status = err.status || err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === "development";

  const response = {
    message: err.message || "Internal server error",
  };

  // Include error details in development mode only
  if (isDevelopment) {
    response.error = {
      status,
      name: err.name,
      stack: err.stack,
    };
  }

  res.status(status).json(response);
};

module.exports = errorHandler;