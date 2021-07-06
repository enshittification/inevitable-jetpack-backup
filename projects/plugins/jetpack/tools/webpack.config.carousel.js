/**
 * External dependencies
 */
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const {
	defaultRequestToExternal,
	defaultRequestToHandle,
} = require( '@wordpress/dependency-extraction-webpack-plugin/util' );
const path = require( 'path' );
const webpack = require( 'webpack' );

const isDevelopment = process.env.NODE_ENV !== 'production';

const baseWebpackConfig = getBaseWebpackConfig(
	{ WP: false },
	{
		entry: {
			main: path.join( __dirname, '../modules/carousel/src/index.js' ),
		},
		// 'output-chunk-filename': 'jp-search.chunk-[name]-[hash].js',
		'output-filename': 'jetpack-carousel.bundle.js',
		'output-path': path.join( __dirname, '../_inc/build/carousel' ),
	}
);

/**
 * Determines if the module import request should be externalized.
 *
 * @param {string} request - Requested module
 * @returns {(string|string[]|undefined)} Script global
 */
function requestToExternal( request ) {
	// Prevent React from being externalized. This ensures that React will be properly aliased to preact/compat.
	if ( request === 'react' || request === 'react-dom' ) {
		return;
	}
	return defaultRequestToExternal( request );
}

const moduleConfig = { ...baseWebpackConfig.module };

module.exports = {
	...baseWebpackConfig,
	module: moduleConfig,
	resolve: {
		...baseWebpackConfig.resolve,
		alias: {
			...baseWebpackConfig.resolve.alias,
			react: 'preact/compat',
			'react-dom/test-utils': 'preact/test-utils',
			'react-dom': 'preact/compat', // Must be aliased after test-utils
		},
		modules: [
			path.resolve( __dirname, '../_inc/client' ),
			path.resolve( __dirname, '../node_modules' ),
			'node_modules',
		],
		// We want the compiled version, not the "calypso:src" sources.
		mainFields: undefined,
	},
	node: {
		fs: 'empty',
	},
	devtool: isDevelopment ? 'source-map' : false,
	plugins: [
		new webpack.DefinePlugin( {
			// Replace palette colors as individual literals in the bundle.
			PALETTE: ( () => {
				const colors = require( '@automattic/color-studio' ).colors;
				const stringifiedColors = {};

				// DefinePlugin replaces the values as unescaped text.
				// We therefore need to double-quote each value, to ensure it ends up as a string.
				for ( const color in colors ) {
					stringifiedColors[ color ] = `"${ colors[ color ] }"`;
				}

				return stringifiedColors;
			} )(),
		} ),
		...baseWebpackConfig.plugins,
		new DependencyExtractionWebpackPlugin( {
			injectPolyfill: true,
			useDefaults: false,
			requestToExternal,
			requestToHandle: defaultRequestToHandle,
		} ),
	],
	optimization: {
		splitChunks: {
			cacheGroups: {
				vendors: false,
			},
		},
	},
};
