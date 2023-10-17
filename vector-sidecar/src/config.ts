const config = {
  configPath: "/etc/vector/config",
  vectorAPIPort: +(process.env.VECTOR_API_PORT || "8686"),
  port: +(process.env.PORT || "3003"),
};

export default config;
