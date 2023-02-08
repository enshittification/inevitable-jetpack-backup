<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Module Name: Brute force protection
 * Module Description: Enabling brute force protection will prevent bots and hackers from attempting to log in to your website with common username and password combinations.
 * Sort Order: 1
 * Recommendation Order: 4
 * First Introduced: 3.4
 * Requires Connection: Yes
 * Requires User Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Recommended
 * Feature: Security
 * Additional Search Queries: security, jetpack protect, secure, protection, botnet, brute force, protect, login, bot, password, passwords, strong passwords, strong password, wp-login.php,  protect admin
 */

use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection;

$brute_force_protection = Brute_Force_Protection::instance();

global $pagenow;
if ( isset( $pagenow ) && 'wp-login.php' === $pagenow ) {
	$brute_force_protection->check_login_ability();
}
