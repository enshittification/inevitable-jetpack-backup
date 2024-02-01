<?php

class WPcom_Global_Nav {

	public function __construct() {
		add_action( 'admin_bar_init', array( $this, 'init' ) );
	}

	public function init() {
		add_action( 'wp_before_admin_bar_render', array( $this, 'replace_core_masterbar' ), 99999 );
	}

	public function replace_core_masterbar() {
		global $wp_admin_bar;

		if ( ! is_object( $wp_admin_bar ) ) {
			return false;
		}

		$nodes = array();

		// First, lets gather all nodes and remove them.
		foreach ( $wp_admin_bar->get_nodes() as $node ) {
			$nodes[ $node->id ] = $node;
			$wp_admin_bar->remove_node( $node->id );
		}

		// Add custom groups and menus here

		// Re-add original nodes
		foreach ( $nodes as $id => $node ) {
			$wp_admin_bar->add_node( $node );
		}
	}

	// temporary because sometimes console goo is easier to read than an error log.
	public function console_log( $output, $with_script_tags = true ) {
		$js_code = 'console.log(' . json_encode( $output, JSON_HEX_TAG ) .
		');';
		if ( $with_script_tags ) {
			$js_code = '<script>' . $js_code . '</script>';
		}
		echo $js_code;
	}
}
