import {
	getScoreLetter,
	requestSpeedScores,
	calculateDaysSince,
} from '@automattic/jetpack-boost-score-api';
import { Spinner, BoostScoreBar } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback, useEffect, useState } from 'react';
import useAnalytics from '../../../hooks/use-analytics';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import type { FC } from 'react';

import './style.scss';

const BoostSpeedScore: FC = () => {
	const { recordEvent } = useAnalytics();
	const [ isLoading, setIsLoading ] = useState( false );
	const [ speedLetterGrade, setSpeedLetterGrade ] = useState( '' );
	const [ daysSinceTested, setDaysSinceTested ] = useState( 1 );
	const [ averageSpeedScore, setAverageSpeedScore ] = useState( 0 );
	const [ isSpeedScoreError, setIsSpeedScoreError ] = useState( false );
	const [ isTooltipVisible, setIsTooltipVisible ] = useState( false );
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	const { siteSuffix: siteUrl = '', latestBoostSpeedScores } = window?.myJetpackInitialState ?? {};
	const { apiRoot, apiNonce, isSiteConnected } = useMyJetpackConnection();

	const getAverageSpeedScore = ( mobileScore, desktopScore ) => {
		return Math.round( ( mobileScore + desktopScore ) / 2 );
	};

	const setScoresFromCache = cachedSpeedScores => {
		setAverageSpeedScore(
			getAverageSpeedScore( cachedSpeedScores.scores.mobile, cachedSpeedScores.scores.desktop )
		);
		setSpeedLetterGrade(
			getScoreLetter( cachedSpeedScores.scores.mobile, cachedSpeedScores.scores.desktop )
		);
		setDaysSinceTested( calculateDaysSince( cachedSpeedScores.timestamp * 1000 ) );
	};

	const getSpeedScores = async () => {
		if ( ! isSiteConnected ) {
			setIsSpeedScoreError( true );
			return;
		}

		setIsLoading( true );
		try {
			const scores = await requestSpeedScores( true, apiRoot, siteUrl, apiNonce );
			const scoreLetter = getScoreLetter( scores.current.mobile, scores.current.desktop );
			setSpeedLetterGrade( scoreLetter );
			setAverageSpeedScore( getAverageSpeedScore( scores.current.mobile, scores.current.desktop ) );
			setDaysSinceTested( 0 );
			setIsLoading( false );
		} catch ( err ) {
			recordEvent( 'jetpack_boost_speed_score_error', {
				feature: 'jetpack-boost',
				position: 'my-jetpack',
				error: err,
			} );

			// If error, use cached speed scores if they exist
			if ( latestBoostSpeedScores && latestBoostSpeedScores.scores ) {
				setScoresFromCache( latestBoostSpeedScores );
			} else {
				// Hide score bars if error and no cached scores
				setIsSpeedScoreError( true );
			}

			setIsLoading( false );
		}
	};

	// Maybe we'll use this in a follup PR? In the tooltip? TODO: remove me.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const getSinceTestedText = useCallback( () => {
		switch ( daysSinceTested ) {
			case 0:
				return __( 'Your site was tested in the last 24 hours', 'jetpack-my-jetpack' );
			case 1:
				return __( 'Your site was tested yesterday', 'jetpack-my-jetpack' );
			default:
				return sprintf(
					// translators: %s is the number of days since the site was last tested.
					__( 'Your site was tested %s days ago', 'jetpack-my-jetpack' ),
					daysSinceTested
				);
		}
	}, [ daysSinceTested ] );

	const handleTooltipMouseEnter = useCallback( () => {
		setIsTooltipVisible( true );
	}, [ setIsTooltipVisible ] );

	const handleTooltipMouseLeave = useCallback( () => {
		setIsTooltipVisible( false );
	}, [ setIsTooltipVisible ] );

	useEffect( () => {
		// Use cache scores if they are less than 21 days old.
		if (
			latestBoostSpeedScores &&
			calculateDaysSince( latestBoostSpeedScores.timestamp * 1000 ) < 21
		) {
			setScoresFromCache( latestBoostSpeedScores );
		} else {
			getSpeedScores();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return (
		! isSpeedScoreError && (
			<div className="mj-boost-speed-score">
				{ isLoading ? (
					<Spinner color="#23282d" size={ 16 } />
				) : (
					<>
						<div className="mj-boost-speed-score__grade">
							<span>{ __( 'Your website’s overall speed score:', 'jetpack-my-jetpack' ) }</span>
							<span className="mj-boost-speed-score__grade--letter">
								<button
									onMouseEnter={ handleTooltipMouseEnter }
									onFocus={ handleTooltipMouseEnter }
									onMouseLeave={ handleTooltipMouseLeave }
									onBlur={ handleTooltipMouseLeave }
								>
									{ speedLetterGrade }
									{ isTooltipVisible && (
										<Popover
											placement={ isMobileViewport ? 'top-end' : 'right' }
											noArrow={ false }
											offset={ 10 }
										>
											<p className={ 'boost-score-tooltip__heading' }>
												{ /* Add the `&nbsp;` at the end to prevent widows. */ }
												{ __( 'Site speed performance:', 'jetpack-my-jetpack' ) }&nbsp;
												{ speedLetterGrade }
											</p>
											<p className={ 'boost-score-tooltip__content' }>
												{ __(
													'You are one step away from making your site blazing fast. A one-second ' +
														'improvement in loading times can increase your site traffic by 10%.',
													'jetpack-my-jetpack'
												) }
											</p>
										</Popover>
									) }
								</button>
							</span>
						</div>
						<div className="mj-boost-speed-score__bar">
							<BoostScoreBar
								score={ averageSpeedScore }
								active={ averageSpeedScore > 0 }
								isLoading={ isLoading }
								showPrevScores={ false }
								scoreBarType="desktop"
								noBoostScoreTooltip={ null }
							/>
						</div>
					</>
				) }
			</div>
		)
	);
};

export default BoostSpeedScore;
