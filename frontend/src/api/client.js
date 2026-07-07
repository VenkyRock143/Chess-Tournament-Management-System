// API URL
const BASE_URL = (import.meta.env.VITE_API_URL || "") + "/api";

// Send request to backend
async function request(path, options) {
  let requestOptions = {};

  if (options) {
    requestOptions = options;
  }

  const response = await fetch(BASE_URL + path, {
    headers: {
      "Content-Type": "application/json",
    },

    ...requestOptions,
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.error) {
      throw new Error(data.error);
    }

    throw new Error("Something went wrong");
  }

  return data;
}

export default request;
