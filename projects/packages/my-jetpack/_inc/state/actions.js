import apiFetch from '@wordpress/api-fetch';
import { REST_API_SITE_DISMISS_BANNER } from './constants';

/*
 * Action constants
 */
const SET_AVAILABLE_LICENSES_IS_FETCHING = 'SET_AVAILABLE_LICENSES_IS_FETCHING';
const FETCH_AVAILABLE_LICENSES = 'FETCH_AVAILABLE_LICENSES';
const SET_AVAILABLE_LICENSES = 'SET_AVAILABLE_LICENSES';
const SET_CHAT_AVAILABILITY_IS_FETCHING = 'SET_CHAT_AVAILABILITY_IS_FETCHING';
const SET_CHAT_AVAILABILITY = 'SET_CHAT_AVAILABILITY';
const SET_CHAT_AUTHENTICATION_IS_FETCHING = 'SET_CHAT_AUTHENTICATION_IS_FETCHING';
const SET_CHAT_AUTHENTICATION = 'SET_CHAT_AUTHENTICATION';
const SET_STATS_COUNTS_IS_FETCHING = 'SET_STATS_COUNTS_IS_FETCHING';
const SET_STATS_COUNTS = 'SET_STATS_COUNTS';
const SET_DISMISSED_WELCOME_BANNER_IS_FETCHING = 'SET_DISMISSED_WELCOME_BANNER_IS_FETCHING';
const SET_DISMISSED_WELCOME_BANNER = 'SET_DISMISSED_WELCOME_BANNER';

const SET_BACKUP_REWINDABLE_EVENTS_IS_FETCHING = 'SET_BACKUP_REWINDABLE_EVENTS_IS_FETCHING';
const SET_BACKUP_REWINDABLE_EVENTS = 'SET_BACKUP_REWINDABLE_EVENTS';

const SET_COUNT_BACKUP_ITEMS = 'SET_COUNT_BACKUP_ITEMS';
const SET_COUNT_BACKUP_ITEMS_IS_FETCHING = 'SET_COUNT_BACKUP_ITEMS_IS_FETCHING';

const SET_GLOBAL_NOTICE = 'SET_GLOBAL_NOTICE';
const CLEAN_GLOBAL_NOTICE = 'CLEAN_GLOBAL_NOTICE';

const setChatAvailabilityIsFetching = isFetching => {
	return { type: SET_CHAT_AVAILABILITY_IS_FETCHING, isFetching };
};

const setChatAuthenticationIsFetching = isFetching => {
	return { type: SET_CHAT_AUTHENTICATION_IS_FETCHING, isFetching };
};

const setBackupRewindableEventsIsFetching = isFetching => {
	return { type: SET_BACKUP_REWINDABLE_EVENTS_IS_FETCHING, isFetching };
};

const setCountBackupItemsIsFetching = isFetching => {
	return { type: SET_COUNT_BACKUP_ITEMS_IS_FETCHING, isFetching };
};

const setStatsCountsIsFetching = isFetching => {
	return { type: SET_STATS_COUNTS_IS_FETCHING, isFetching };
};

const setChatAvailability = chatAvailability => {
	return { type: SET_CHAT_AVAILABILITY, chatAvailability };
};

const setChatAuthentication = chatAuthentication => {
	return { type: SET_CHAT_AUTHENTICATION, chatAuthentication };
};

const setAvailableLicensesIsFetching = isFetching => {
	return { type: SET_AVAILABLE_LICENSES_IS_FETCHING, isFetching };
};

const fetchAvailableLicenses = () => {
	return { type: FETCH_AVAILABLE_LICENSES };
};

const setAvailableLicenses = availableLicenses => {
	return { type: SET_AVAILABLE_LICENSES, availableLicenses };
};

const setBackupRewindableEvents = rewindableEvents => ( {
	type: SET_BACKUP_REWINDABLE_EVENTS,
	rewindableEvents,
} );

const setCountBackupItems = backupItems => ( {
	type: SET_COUNT_BACKUP_ITEMS,
	backupItems,
} );

const setStatsCounts = statsCounts => ( { type: SET_STATS_COUNTS, statsCounts } );

const setDismissedWelcomeBannerIsFetching = isFetching => {
	return { type: SET_DISMISSED_WELCOME_BANNER_IS_FETCHING, isFetching };
};

const setDismissedWelcomeBanner = hasBeenDismissed => {
	return { type: SET_DISMISSED_WELCOME_BANNER, hasBeenDismissed };
};

const setGlobalNotice = ( message, options ) => ( {
	type: 'SET_GLOBAL_NOTICE',
	message,
	options,
} );

const cleanGlobalNotice = () => ( { type: 'CLEAN_GLOBAL_NOTICE' } );

/**
 * Request to set the welcome banner as dismissed
 *
 * @returns {Promise} - Promise which resolves when the banner is dismissed.
 */
const dismissWelcomeBanner = () => async store => {
	const { dispatch } = store;

	dispatch( setDismissedWelcomeBannerIsFetching( true ) );

	return apiFetch( {
		path: REST_API_SITE_DISMISS_BANNER,
		method: 'POST',
	} )
		.then( () => {
			dispatch( setDismissedWelcomeBanner( true ) );
		} )
		.finally( () => {
			dispatch( setDismissedWelcomeBannerIsFetching( false ) );
		} );
};

const noticeActions = {
	setGlobalNotice,
	cleanGlobalNotice,
};

const actions = {
	setChatAvailabilityIsFetching,
	setChatAuthenticationIsFetching,
	setChatAvailability,
	setChatAuthentication,
	setAvailableLicensesIsFetching,
	fetchAvailableLicenses,
	setAvailableLicenses,
	setBackupRewindableEvents,
	setBackupRewindableEventsIsFetching,
	setCountBackupItems,
	setCountBackupItemsIsFetching,
	setStatsCounts,
	setStatsCountsIsFetching,
	dismissWelcomeBanner,
	...noticeActions,
};

export {
	SET_AVAILABLE_LICENSES_IS_FETCHING,
	FETCH_AVAILABLE_LICENSES,
	SET_AVAILABLE_LICENSES,
	SET_GLOBAL_NOTICE,
	CLEAN_GLOBAL_NOTICE,
	SET_CHAT_AVAILABILITY,
	SET_CHAT_AVAILABILITY_IS_FETCHING,
	SET_CHAT_AUTHENTICATION,
	SET_CHAT_AUTHENTICATION_IS_FETCHING,
	SET_BACKUP_REWINDABLE_EVENTS_IS_FETCHING,
	SET_BACKUP_REWINDABLE_EVENTS,
	SET_COUNT_BACKUP_ITEMS_IS_FETCHING,
	SET_COUNT_BACKUP_ITEMS,
	SET_STATS_COUNTS_IS_FETCHING,
	SET_STATS_COUNTS,
	SET_DISMISSED_WELCOME_BANNER_IS_FETCHING,
	SET_DISMISSED_WELCOME_BANNER,
	actions as default,
};
