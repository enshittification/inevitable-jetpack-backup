/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import {
	REST_API_REWINDABLE_BACKUP_EVENTS_ENDPOINT,
	REST_API_CHAT_AVAILABILITY_ENDPOINT,
	REST_API_CHAT_AUTHENTICATION_ENDPOINT,
	getStatsHighlightsEndpoint,
	REST_API_COUNT_BACKUP_ITEMS_ENDPOINT,
} from './constants';

const myJetpackResolvers = {
	getChatAvailability:
		() =>
		async ( { dispatch } ) => {
			dispatch.setChatAvailabilityIsFetching( true );

			try {
				dispatch.setChatAvailability(
					await apiFetch( { path: REST_API_CHAT_AVAILABILITY_ENDPOINT } )
				);
				dispatch.setChatAvailabilityIsFetching( false );
			} catch ( error ) {
				dispatch.setChatAvailabilityIsFetching( false );
			}
		},

	getChatAuthentication:
		() =>
		async ( { dispatch } ) => {
			dispatch.setChatAuthenticationIsFetching( true );

			try {
				dispatch.setChatAuthentication(
					await apiFetch( { path: REST_API_CHAT_AUTHENTICATION_ENDPOINT } )
				);
				dispatch.setChatAuthenticationIsFetching( false );
			} catch ( error ) {
				dispatch.setChatAuthenticationIsFetching( false );
			}
		},

	getAvailableLicenses:
		() =>
		async ( { dispatch } ) => {
			dispatch.setAvailableLicensesIsFetching( true );

			try {
				const { apiRoot, apiNonce } = window?.myJetpackRest || {};
				restApi.setApiRoot( apiRoot );
				restApi.setApiNonce( apiNonce );
				const result = await restApi.getUserLicenses();

				if ( result && result.items ) {
					dispatch.setAvailableLicenses(
						result.items.filter(
							( { attached_at, revoked_at } ) => attached_at === null && revoked_at === null
						)
					);
				} else {
					dispatch.setAvailableLicenses( [] );
				}
			} catch ( error ) {
				dispatch.setAvailableLicenses( [] );
			} finally {
				dispatch.setAvailableLicensesIsFetching( false );
			}
		},

	getBackupRewindableEvents: () => {
		return async ( { dispatch } ) => {
			dispatch.setBackupRewindableEventsIsFetching( true );

			try {
				dispatch.setBackupRewindableEvents(
					await apiFetch( { path: REST_API_REWINDABLE_BACKUP_EVENTS_ENDPOINT } )
				);
				dispatch.setBackupRewindableEventsIsFetching( false );
			} catch ( error ) {
				dispatch.setBackupRewindableEventsIsFetching( false );
			}
		};
	},

	getCountBackupItems: () => {
		return async ( { dispatch } ) => {
			dispatch.setCountBackupItemsIsFetching( true );

			try {
				dispatch.setCountBackupItems(
					await apiFetch( { path: REST_API_COUNT_BACKUP_ITEMS_ENDPOINT } )
				);
				dispatch.setCountBackupItemsIsFetching( false );
			} catch ( error ) {
				dispatch.setCountBackupItemsIsFetching( false );
			}
		};
	},

	getStatsCounts: () => async props => {
		const { dispatch, registry } = props;

		dispatch.setStatsCountsIsFetching( true );

		const blogId = registry.select( CONNECTION_STORE_ID ).getBlogId();

		try {
			dispatch.setStatsCounts( await apiFetch( { path: getStatsHighlightsEndpoint( blogId ) } ) );
			dispatch.setStatsCountsIsFetching( false );
		} catch ( error ) {
			dispatch.setStatsCountsIsFetching( false );
		}
	},
};

export default {
	...myJetpackResolvers,
};
