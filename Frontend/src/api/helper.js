let BASE_URL = "http://localhost:4000/api";

switch (process.env.NODE_ENV) {
  case "production":
    BASE_URL = "https://fina-nbnq.onrender.com/api";
    break;
  case "development":
  default:
    BASE_URL = "http://localhost:4000/api";
}

export default BASE_URL;
