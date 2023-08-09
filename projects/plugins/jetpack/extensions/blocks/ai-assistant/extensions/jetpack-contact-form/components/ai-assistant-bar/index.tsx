/**
 * External dependencies
 */
import { useAiContext, AIControl } from '@automattic/jetpack-ai-client';
import { serialize } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { useContext, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import UpgradePrompt from '../../../../components/upgrade-prompt';
import useAIFeature from '../../../../hooks/use-ai-feature';
import { PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT, getPrompt } from '../../../../lib/prompt';
import { AiAssistantUiContext } from '../../ui-handler/context';
import './style.scss';

/**
 * Return the serialized content of a block.
 *
 * @param {string} clientId - The block client ID.
 * @returns {string}          The serialized content.
 */
function getSerializedContentFromBlock( clientId: string ): string {
	if ( ! clientId?.length ) {
		return '';
	}

	const block = select( 'core/block-editor' ).getBlock( clientId );
	if ( ! block ) {
		return '';
	}

	return serialize( block );
}

export default function AiAssistantBar( { clientId } ) {
	const { requireUpgrade } = useAIFeature();

	const { inputValue, setInputValue } = useContext( AiAssistantUiContext );

	const { requestSuggestion, requestingState } = useAiContext();

	const isLoading = requestingState === 'requesting' || requestingState === 'suggesting';

	const placeholder = __( 'Ask Jetpack AI to create your form', 'jetpack' );

	const loadingPlaceholder = __( 'Creating your form. Please wait a few moments.', 'jetpack' );

	const onStop = () => {
		// TODO: Implement onStop
	};

	const onSend = useCallback( () => {
		const prompt = getPrompt( PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT, {
			request: inputValue,
			content: getSerializedContentFromBlock( clientId ),
		} );

		requestSuggestion( prompt, { feature: 'jetpack-form-ai-extension' } );
	}, [ clientId, inputValue, requestSuggestion ] );

	return (
		<div className="jetpack-ai-assistant__bar">
			{ requireUpgrade && <UpgradePrompt /> }
			<AIControl
				disabled={ requireUpgrade }
				value={ isLoading ? undefined : inputValue }
				placeholder={ isLoading ? loadingPlaceholder : placeholder }
				onChange={ setInputValue }
				onSend={ onSend }
				onStop={ onStop }
				state={ requestingState }
				isOpaque={ requireUpgrade }
			/>
		</div>
	);
}
