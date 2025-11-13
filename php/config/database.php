<?php
class Database {
    private $host;
    private $username;
    private $password;
    private $database;
    private $connection;

    public function __construct() {
        // Load environment variables
        $envFile = __DIR__ . '/.env';
        if (file_exists($envFile)) {
            $env = parse_ini_file($envFile);
        } else {
            // Default values for development
            $env = [
                'DB_HOST' => 'localhost',
                'DB_USERNAME' => 'root',
                'DB_PASSWORD' => '',
                'DB_NAME' => 'attendance'
            ];
        }
        
        $this->host = $env['DB_HOST'];
        $this->username = $env['DB_USERNAME'];
        $this->password = $env['DB_PASSWORD'];
        $this->database = $env['DB_NAME'];
    }

    public function connect() {
        try {
            $this->connection = new PDO(
                "mysql:host={$this->host};dbname={$this->database}", 
                $this->username, 
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
            return $this->connection;
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed. Please try again later.");
        }
    }

    public function getConnection() {
        if (!$this->connection) {
            $this->connect();
        }
        return $this->connection;
    }
}
?>