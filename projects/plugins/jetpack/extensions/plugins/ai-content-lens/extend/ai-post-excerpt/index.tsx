/**
 * External dependencies
 */
import {
	useAiSuggestions,
	AI_MODEL_GPT_4,
	ERROR_QUOTA_EXCEEDED,
} from '@automattic/jetpack-ai-client';
import {
	isAtomicSite,
	isSimpleSite,
	useAnalytics,
} from '@automattic/jetpack-shared-extension-utils';
import { TextareaControl, ExternalLink, Button, Notice, BaseControl } from '@wordpress/components';
import { dispatch, useDispatch, useSelect } from '@wordpress/data';
import {
	PluginDocumentSettingPanel,
	// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
	__experimentalPluginPostExcerpt as PluginPostExcerpt,
} from '@wordpress/edit-post';
import { store as editorStore, PostTypeSupportCheck } from '@wordpress/editor';
import { createInterpolateElement, useState, useEffect, useCallback } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { count } from '@wordpress/wordcount';
/**
 * Internal dependencies
 */
import UpgradePrompt from '../../../../blocks/ai-assistant/components/upgrade-prompt';
import useAiFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import { isBetaExtension } from '../../../../editor';
import { AiExcerptControl } from '../../components/ai-excerpt-control';
/**
 * Types and constants
 */
import type { LanguageProp } from '../../../../blocks/ai-assistant/components/i18n-dropdown-control';
import type { ToneProp } from '../../../../blocks/ai-assistant/components/tone-dropdown-control';
import type { AiModelTypeProp, PromptProp } from '@automattic/jetpack-ai-client';

import './style.scss';

type ContentLensMessageContextProps = {
	type: 'ai-content-lens';
	contentType: 'post-excerpt';
	postId: number;
	words?: number;
	request?: string;
	content?: string;
	language?: LanguageProp;
	tone?: ToneProp;
	model?: AiModelTypeProp;
};

function AiPostExcerpt() {
	const { excerpt, postId } = useSelect( select => {
		const { getEditedPostAttribute, getCurrentPostId } = select( editorStore );

		return {
			excerpt: getEditedPostAttribute( 'excerpt' ) ?? '',
			postId: getCurrentPostId() ?? 0,
		};
	}, [] );

	const { tracks } = useAnalytics();

	const { editPost } = useDispatch( 'core/editor' );

	const { dequeueAiAssistantFeatureAyncRequest, increaseAiAssistantRequestsCount } =
		useDispatch( 'wordpress-com/plans' );

	// Post excerpt words number
	const [ excerptWordsNumber, setExcerptWordsNumber ] = useState( 50 );

	const [ reenable, setReenable ] = useState( false );
	const [ language, setLanguage ] = useState< LanguageProp >();
	const [ tone, setTone ] = useState< ToneProp >();
	const [ model, setModel ] = useState< AiModelTypeProp >( null );

	const { request, stopSuggestion, suggestion, requestingState, error, reset } = useAiSuggestions( {
		onDone: useCallback( () => {
			/*
			 * Increase the AI Suggestion counter.
			 * @todo: move this at store level.
			 */
			increaseAiAssistantRequestsCount();
		}, [ increaseAiAssistantRequestsCount ] ),
		onError: useCallback(
			suggestionError => {
				/*
				 * Incrses AI Suggestion counter
				 * only for valid errors.
				 * @todo: move this at store level.
				 */
				if (
					suggestionError.code === 'error_network' ||
					suggestionError.code === 'error_quota_exceeded'
				) {
					return;
				}

				// Increase the AI Suggestion counter.
				increaseAiAssistantRequestsCount();
			},
			[ increaseAiAssistantRequestsCount ]
		),
	} );

	// Cancel and reset AI suggestion when the component is unmounted
	useEffect( () => {
		return () => {
			stopSuggestion();
			reset();
		};
	}, [ stopSuggestion, reset ] );

	// Pick raw post content
	const postContent = useSelect(
		select => {
			const content = select( editorStore ).getEditedPostContent();
			if ( ! content ) {
				return '';
			}

			// return turndownService.turndown( content );
			const document = new window.DOMParser().parseFromString( content, 'text/html' );

			const documentRawText = document.body.textContent || document.body.innerText || '';

			// Keep only one break line (\n) between blocks.
			return documentRawText.replace( /\n{2,}/g, '\n' ).trim();
		},
		[ postId ]
	);

	// Show custom prompt number of words
	const currentExcerpt = suggestion || excerpt;
	const numberOfWords = count( currentExcerpt, 'words' );
	const helpNumberOfWords = sprintf(
		// Translators: %1$s is the number of words in the excerpt.
		_n( '%1$s word', '%1$s words', numberOfWords, 'jetpack' ),
		numberOfWords
	);

	const isGenerateButtonDisabled =
		requestingState === 'requesting' ||
		requestingState === 'suggesting' ||
		( requestingState === 'done' && ! reenable );

	const isBusy = requestingState === 'requesting' || requestingState === 'suggesting';
	const isTextAreaDisabled = isBusy || requestingState === 'done';

	/**
	 * Request AI for a new excerpt.
	 *
	 * @returns {void}
	 */
	function requestExcerpt(): void {
		// Enable Generate button
		setReenable( false );

		// Reset suggestion state
		reset();

		const messageContext: ContentLensMessageContextProps = {
			type: 'ai-content-lens',
			contentType: 'post-excerpt',
			postId,
			words: excerptWordsNumber,
			language,
			tone,
			content: `Post content:
${ postContent }
`,
		};

		const prompt: PromptProp = [
			{
				role: 'jetpack-ai',
				context: messageContext,
			},
		];

		/*
		 * Always dequeue/cancel the AI Assistant feature async request,
		 * in case there is one pending,
		 * when performing a new AI suggestion request.
		 */
		dequeueAiAssistantFeatureAyncRequest();

		request( prompt, { feature: 'jetpack-ai-content-lens', model } );
		tracks.recordEvent( 'jetpack_ai_assistant_block_generate', {
			feature: 'jetpack-ai-content-lens',
		} );
	}

	function setExcerpt() {
		editPost( { excerpt: suggestion } );
		tracks.recordEvent( 'jetpack_ai_assistant_block_accept', {
			feature: 'jetpack-ai-content-lens',
		} );
		reset();
	}

	function discardExcerpt() {
		editPost( { excerpt: excerpt } );
		tracks.recordEvent( 'jetpack_ai_assistant_block_discard', {
			feature: 'jetpack-ai-content-lens',
		} );
		reset();
	}

	const { requireUpgrade, isOverLimit } = useAiFeature();

	// Set the docs link depending on the site type
	const docsLink =
		isAtomicSite() || isSimpleSite()
			? __( 'https://wordpress.com/support/excerpts/', 'jetpack' )
			: __( 'https://jetpack.com/support/create-better-post-excerpts-with-ai/', 'jetpack' );

	return (
		<div className="jetpack-ai-post-excerpt">
			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Write an excerpt (optional)', 'jetpack' ) }
				onChange={ value => editPost( { excerpt: value } ) }
				help={ numberOfWords ? helpNumberOfWords : null }
				value={ currentExcerpt }
				disabled={ isTextAreaDisabled }
			/>

			<ExternalLink href={ docsLink }>
				{ __( 'Learn more about manual excerpts', 'jetpack' ) }
			</ExternalLink>

			<div className="jetpack-generated-excerpt__ai-container">
				{ error?.code && error.code !== 'error_quota_exceeded' && (
					<Notice
						status={ error.severity }
						isDismissible={ false }
						className="jetpack-ai-assistant__error"
					>
						{ error.message }
					</Notice>
				) }

				{ isOverLimit && <UpgradePrompt placement="excerpt-panel" /> }

				<AiExcerptControl
					words={ excerptWordsNumber }
					onWordsNumberChange={ wordsNumber => {
						setExcerptWordsNumber( wordsNumber );
						setReenable( true );
					} }
					language={ language }
					onLanguageChange={ newLang => {
						setLanguage( newLang );
						setReenable( true );
					} }
					tone={ tone }
					onToneChange={ newTone => {
						setTone( newTone );
						setReenable( true );
					} }
					model={ model }
					onModelChange={ newModel => {
						setModel( newModel );
						setReenable( true );
					} }
					disabled={ isBusy || requireUpgrade }
				/>

				<BaseControl
					help={
						! postContent?.length ? __( 'Add content to generate an excerpt.', 'jetpack' ) : null
					}
				>
					<div className="jetpack-generated-excerpt__generate-buttons-container">
						<Button
							onClick={ discardExcerpt }
							variant="secondary"
							isDestructive
							disabled={ requestingState !== 'done' || requireUpgrade }
						>
							{ __( 'Discard', 'jetpack' ) }
						</Button>
						<Button
							onClick={ setExcerpt }
							variant="secondary"
							disabled={ requestingState !== 'done' || requireUpgrade }
						>
							{ __( 'Accept', 'jetpack' ) }
						</Button>
						<Button
							onClick={ requestExcerpt }
							variant="secondary"
							isBusy={ isBusy }
							disabled={ isGenerateButtonDisabled || requireUpgrade || ! postContent }
						>
							{ __( 'Generate', 'jetpack' ) }
						</Button>
					</div>
				</BaseControl>
			</div>
		</div>
	);
}

function PostExcerptAiExtension() {
	const { excerpt, postId } = useSelect( select => {
		const { getEditedPostAttribute, getCurrentPostId } = select( editorStore );

		return {
			excerpt: getEditedPostAttribute( 'excerpt' ) ?? '',
			postId: getCurrentPostId() ?? 0,
		};
	}, [] );

	const { editPost } = useDispatch( 'core/editor' );

	// Post excerpt words number
	const [ excerptWordsNumber, setExcerptWordsNumber ] = useState( 50 );

	const [ language, setLanguage ] = useState< LanguageProp >();
	const [ tone, setTone ] = useState< ToneProp >();
	const [ model, setModel ] = useState< AiModelTypeProp >( AI_MODEL_GPT_4 );

	const { request, stopSuggestion, requestingState, error, reset } = useAiSuggestions( {
		onSuggestion: freshExcerpt => {
			editPost( { excerpt: freshExcerpt } );
		},
	} );

	// Cancel and reset AI suggestion when the component is unmounted
	useEffect( () => {
		return () => {
			stopSuggestion();
			reset();
		};
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Pick raw post content
	const postContent = useSelect(
		select => {
			const content = select( editorStore ).getEditedPostContent();
			if ( ! content ) {
				return '';
			}

			// return turndownService.turndown( content );
			const document = new window.DOMParser().parseFromString( content, 'text/html' );

			const documentRawText = document.body.textContent || document.body.innerText || '';

			// Keep only one break line (\n) between blocks.
			return documentRawText.replace( /\n{2,}/g, '\n' ).trim();
		},
		[ postId ]
	);

	// Show custom prompt number of words
	const currentExcerpt = excerpt;
	const numberOfWords = count( currentExcerpt, 'words' );
	const help = createInterpolateElement(
		sprintf(
			// Translators: %1$s is the number of words in the excerpt.
			_n(
				'The actual length may vary as the AI strives to generate coherent and meaningful content. Current length: <strong>%1$s</strong> word',
				'The actual length may vary as the AI strives to generate coherent and meaningful content. Current length: <strong>%1$s</strong> words',
				numberOfWords,
				'jetpack'
			),
			numberOfWords
		),
		{
			strong: <strong />,
		}
	);

	const isGenerateButtonDisabled =
		requestingState === 'requesting' || requestingState === 'suggesting';

	const isBusy = requestingState === 'requesting' || requestingState === 'suggesting';

	/**
	 * Request AI for a new excerpt.
	 *
	 * @returns {void}
	 */
	function requestExcerpt(): void {
		// Reset suggestion state
		reset();

		const messageContext: ContentLensMessageContextProps = {
			type: 'ai-content-lens',
			contentType: 'post-excerpt',
			postId,
			words: excerptWordsNumber,
			language,
			tone,
			content: `Post content:
${ postContent }
`,
		};

		const prompt = [
			{
				role: 'jetpack-ai',
				context: messageContext,
			},
		];

		request( prompt, { feature: 'jetpack-ai-content-lens', model } );
	}
	const isQuotaExceeded = error?.code === ERROR_QUOTA_EXCEEDED;

	// Set the docs link depending on the site type
	const docsLink =
		isAtomicSite() || isSimpleSite()
			? __( 'https://wordpress.com/support/excerpts/', 'jetpack' )
			: __( 'https://jetpack.com/support/create-better-post-excerpts-with-ai/', 'jetpack' );

	return (
		<div className="jetpack-ai-post-excerpt">
			<div className="jetpack-generated-excerpt__ai-container">
				{ error?.code && error.code !== 'error_quota_exceeded' && (
					<Notice
						status={ error.severity }
						isDismissible={ false }
						className="jetpack-ai-assistant__error"
					>
						{ error.message }
					</Notice>
				) }

				{ isQuotaExceeded && <UpgradePrompt /> }

				<AiExcerptControl
					words={ excerptWordsNumber }
					onWordsNumberChange={ wordsNumber => {
						setExcerptWordsNumber( wordsNumber );
					} }
					language={ language }
					onLanguageChange={ newLang => {
						setLanguage( newLang );
					} }
					tone={ tone }
					onToneChange={ newTone => {
						setTone( newTone );
					} }
					model={ model }
					onModelChange={ newModel => {
						setModel( newModel );
					} }
					disabled={ isBusy || isQuotaExceeded }
					help={ help }
				/>

				<BaseControl
					help={
						! postContent?.length ? __( 'Add content to generate an excerpt.', 'jetpack' ) : null
					}
				>
					<div className="jetpack-generated-excerpt__generate-buttons-container">
						<Button
							onClick={ requestExcerpt }
							variant="secondary"
							isBusy={ isBusy }
							disabled={ isGenerateButtonDisabled || isQuotaExceeded || ! postContent }
						>
							{ __( 'Generate', 'jetpack' ) }
						</Button>
					</div>
				</BaseControl>

				<ExternalLink href={ docsLink }>
					{ __( 'AI excerpts documentation', 'jetpack' ) }
				</ExternalLink>
			</div>
		</div>
	);
}

export const PluginDocumentSettingPanelAiExcerpt = () => {
	// Check if PluginPostExcerpt Slot is available.
	if ( typeof PluginPostExcerpt !== 'undefined' ) {
		return (
			<PluginPostExcerpt>
				<PostExcerptAiExtension />
			</PluginPostExcerpt>
		);
	}

	/*
	 * The following implementation should be removed
	 * once the PluginPostExcerpt Slot is available in core.
	 */

	// Remove the excerpt panel by dispatching an action.
	dispatch( 'core/edit-post' )?.removeEditorPanel( 'post-excerpt' );

	return (
		<PostTypeSupportCheck supportKeys="excerpt">
			<PluginDocumentSettingPanel
				className={ isBetaExtension( 'ai-content-lens' ) ? 'is-beta-extension inset-shadow' : '' }
				name="ai-content-lens-plugin"
				title={ __( 'Excerpt', 'jetpack' ) }
			>
				<AiPostExcerpt />
			</PluginDocumentSettingPanel>
		</PostTypeSupportCheck>
	);
};
