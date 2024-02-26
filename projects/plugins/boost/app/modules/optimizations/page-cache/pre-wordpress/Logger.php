<?php
/*
 * This file may be called before WordPress is fully initialized. See the README file for info.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress;

/**
 * A utility that manages logging for the boost cache.
 */
class Logger {
	/**
	 * The singleton instance of the logger.
	 */
	private static $instance = null;

	/**
	 * The header to place on top of every log file.
	 */
	const LOG_HEADER = "<?php die(); // This file is not intended to be accessed directly. ?>\n\n";

	/**
	 * The directory where log files are stored.
	 */
	const LOG_DIRECTORY = WP_CONTENT_DIR . '/boost-cache/logs';

	/**
	 * Get the singleton instance of the logger.
	 *
	 * @throws \Exception
	 */
	public static function get_instance() {
		if ( self::$instance !== null ) {
			return self::$instance;
		}

		$instance = new Logger();
		$instance->prepare_file();
		self::$instance = $instance;
		return $instance;
	}

	/**
	 * Ensure that the log file exists, and if not, create it.
	 *
	 * @throws \Exception
	 */
	private function prepare_file() {
		$log_file = $this->get_log_file();
		if ( file_exists( $log_file ) ) {
			return;
		}

		$directory = dirname( $log_file );
		if ( ! Filesystem_Utils::create_directory( $directory ) ) {
			throw new \Exception( 'Failed to create boost-cache log directory' );
		}

		Filesystem_Utils::write_to_file( $log_file, self::LOG_HEADER );
	}

	/**
	 * Add a debug message to the log file after doing necessary checks.
	 */
	public static function debug( $message ) {
		$settings = Boost_Cache_Settings::get_instance();
		if ( ! $settings->get_logging() ) {
			return;
		}

		try {
			$logger = self::get_instance();
			$logger->log( $message );
		} catch ( \Exception $exception ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'Could not write to boost-cache debug log: ' . $exception->getMessage() );
		}
	}

	/**
	 * Writes a message to the log file.
	 *
	 * @param string $message - The message to write to the log file.
	 */
	public function log( $message ) {
		$request     = Request::current();
		$request_uri = htmlspecialchars( $request->get_uri(), ENT_QUOTES, 'UTF-8' );
		$line        = gmdate( 'H:i:s' ) . ' ' . getmypid() . "\t{$request_uri}\t\t{$message}" . PHP_EOL;
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( $line, 3, $this->get_log_file() );
	}

	/**
	 * Reads the log file and returns the contents.
	 *
	 * @return string
	 */
	public function read() {
		$log_file = $this->get_log_file();

		if ( ! file_exists( $log_file ) ) {
			return '';
		}

		// Get the content after skipping the LOG_HEADER.
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		return file_get_contents( $log_file, false, null, strlen( self::LOG_HEADER ) ) ?? '';
	}

	/**
	 * Returns the path to the log file.
	 *
	 * @return string
	 */
	private static function get_log_file() {
		$today = gmdate( 'Y-m-d' );
		return self::LOG_DIRECTORY . "/log-{$today}.log.php";
	}

	public static function delete_old_logs() {
		Filesystem_Utils::delete_expired_files( self::LOG_DIRECTORY, 24 * 60 * 60 );
	}
}
