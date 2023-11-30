module.exports = {
  apps: [
    {
      name: "vector", // Name of the application (you can choose any name)
      script:
        "MODE=bootstrap node --inspect=0.0.0.0:9999 --enable-source-maps /src/build/src/ee/_vector-sidecar/bootstrap.js && vector -w --config-dir /etc/vector/config",
      exec_interpreter: "none", // Don't use an interpreter
      instances: 1, // Number of instances to run (1 for a single instance)
      exec_mode: "fork", // Use "fork" as the execution mode
      log_date_format: "YYYY-MM-DD HH:mm:ss", // Log date format
      error_file: "logs/error.log", // Path to error log file
      out_file: "logs/out.log", // Path to standard output log file
      stop_exit_codes: [0], // Stop on exit code 0
    },
    {
      name: "sidecar", // Name of the application (you can choose any name)
      script: "node", // Use the "node" command
      args: [
        "--inspect=0.0.0.0",
        "--enable-source-maps",
        "/src/build/src/ee/_vector-sidecar/index.js", // Path to your Node.js application script
      ],
      stop_exit_codes: [0], // Stop on exit code 0
      instances: 1, // Number of instances to run (1 for a single instance)
      exec_mode: "fork", // Use "fork" as the execution mode
      log_date_format: "YYYY-MM-DD HH:mm:ss", // Log date format
      error_file: "logs/error.log", // Path to error log file
      out_file: "logs/out.log", // Path to standard output log file
    },
  ],
};
