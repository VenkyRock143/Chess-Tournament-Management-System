// Error handling middleware
function errorHandler(error, req, res, next) {
  console.log("Error:", error.message);

  let status = 500;
  let message = "Internal server error";

  if (error.status) {
    status = error.status;
    message = error.message;
  }

  res.status(status).json({
    error: message,
  });
}

module.exports = errorHandler;
