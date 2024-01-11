import { Container, Col, Text, Title, getIconBySlug, Button } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import React, { useState } from 'react';
import useProtectData from '../../hooks/use-protect-data';
import { STORE_ID } from '../../state/store';
import Notice from '../notice';
import OnboardingPopover from '../onboarding-popover';
import styles from './styles.module.scss';

const Summary = () => {
	const { numThreats, lastChecked, hasRequiredPlan } = useProtectData();
	const notice = useSelect( select => select( STORE_ID ).getNotice() );
	const scanIsEnqueuing = useSelect( select => select( STORE_ID ).getScanIsEnqueuing() );
	const { scan } = useDispatch( STORE_ID );
	const Icon = getIconBySlug( 'protect' );

	const [ scanResultsAnchor, setScanResultsAnchor ] = useState( null );
	const [ dailyManualScansAnchor, setDailyManualScansAnchor ] = useState( null );

	const handleScanClick = () => {
		return event => {
			event.preventDefault();
			scan();
		};
	};

	return (
		<Container fluid>
			<Col>
				<div className={ styles.summary }>
					<div>
						<Title size="small" className={ styles.summary__title }>
							<Icon size={ 32 } className={ styles.summary__icon } />
							<div ref={ setScanResultsAnchor }>
								{ sprintf(
									/* translators: %s: Latest check date  */
									__( 'Latest results as of %s', 'jetpack-protect' ),
									dateI18n( 'F jS', lastChecked )
								) }
							</div>
							<OnboardingPopover
								id="daily-scans"
								position="middle right"
								anchor={ scanResultsAnchor }
							/>
						</Title>
						{ numThreats > 0 && (
							<Text variant="headline-small" component="h1">
								{ sprintf(
									/* translators: %s: Total number of threats  */
									__( '%1$s %2$s found', 'jetpack-protect' ),
									numThreats,
									numThreats === 1 ? 'threat' : 'threats'
								) }
							</Text>
						) }
					</div>
					<div className={ styles.summary__notice }>
						{ notice && notice.message && <Notice { ...notice } /> }
					</div>
					{ hasRequiredPlan && numThreats === 0 && (
						<>
							<Button
								ref={ setDailyManualScansAnchor }
								variant="secondary"
								className={ styles[ 'summary__scan-button' ] }
								isLoading={ scanIsEnqueuing }
								onClick={ handleScanClick() }
							>
								{ __( 'Scan now', 'jetpack-protect' ) }
							</Button>
							<OnboardingPopover
								id="daily-and-manual-scans"
								position="middle left"
								anchor={ dailyManualScansAnchor }
							/>
						</>
					) }
				</div>
			</Col>
		</Container>
	);
};

export default Summary;
