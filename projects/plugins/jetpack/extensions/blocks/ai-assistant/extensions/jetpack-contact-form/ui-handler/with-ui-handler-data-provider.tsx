/**
 * External dependencies
 */
import { ERROR_QUOTA_EXCEEDED, useAiContext } from '@automattic/jetpack-ai-client';
import { createBlock } from '@wordpress/blocks';
import { KeyboardShortcuts } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect, dispatch } from '@wordpress/data';
import { useState, useMemo, useCallback, useEffect, useRef } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { jsonrepair } from 'jsonrepair';
/**
 * Internal dependencies
 */
import { isPossibleToExtendJetpackFormBlock } from '..';
import { AiAssistantUiContextProvider } from './context';
/**
 * Types
 */
import type { RequestingErrorProps } from '@automattic/jetpack-ai-client';
type blockName = string;
type BlockData = [ blockName, Record< string, unknown >, Array< BlockData > | undefined ];

// An identifier to use on the extension error notices,
export const AI_ASSISTANT_JETPACK_FORM_NOTICE_ID = 'ai-assistant';

function parseBlocksFromJson( jsonContent: Array< BlockData > | BlockData ): Array< BlockData > {
	/*
	 * JsonContent can be an array of blocks or a single block (array)
	 * If it's a single block, we need to wrap it in an array.
	 *
	 * Array of blocks:
	 * [
	 * 		[ 'core/paragraph', { content: 'Hello World!' } ],
	 * 		[ 'core/paragraph', { content: 'Hello World!' } ],...
	 * ]
	 *
	 * Single block:
	 * [ 'core/paragraph', { content: 'Hello World!' } ]
	 *
	 * When it's a single block,
	 * the first eement of the array is the block name (string),
	 * so let's check if the first element is a string.
	 * Is so, wrap the array in another array.
	 */
	if ( typeof jsonContent[ 0 ] === 'string' ) {
		console.warn( 'Single block detected. Wrapping in an array.' ); // eslint-disable-line no-console
		jsonContent = [ jsonContent ];
		console.warn( 'jsonContent: ', jsonContent ); // eslint-disable-line no-console
	}

	const blocks = [];
	for ( let i = 0; i < jsonContent.length; i++ ) {
		const blockData = jsonContent[ i ];
		const [ name, attributes, innerBlocks ] = blockData;

		let block;

		try {
			if ( innerBlocks?.length ) {
				const parsedInnerBlocks = parseBlocksFromJson( innerBlocks );
				block = createBlock( name, attributes, parsedInnerBlocks );
			} else {
				block = createBlock( name, attributes );
			}

			blocks.push( block );
		} catch ( e ) {
			console.error( 'Create block error: ', e ); // eslint-disable-line no-console
			console.warn( 'Block data: ', blockData ); // eslint-disable-line no-console
		}
	}

	return blocks;
}

const withUiHandlerDataProvider = createHigherOrderComponent( BlockListBlock => {
	return props => {
		const { clientId, isSelected } = props;

		// AI Assistant input value
		const [ inputValue, setInputValue ] = useState(
			'In three columns, put in the first one a large article about Jorge Luis Borge. In next one, about Mariana Enriquez. And in the third one, a form to buy books. Please add all fields you consider appropriate.'
		);

		// const [ inputValue, setInputValue ] = useState(
		// 	'Write a complete article about the CZSpectrum, split in three columns. In the first one, create an introductory content. In the second one, talk about the most important companies around it. In the third one, create a list with the best ten games of it.'
		// );

		// const [ inputValue, setInputValue ] = useState(
		// 	'Write a large article about Johannes Gutenberg. Please organize the content in three columns. Feel free to add Headers, Lists, quotes, etc.'
		// );

		// const [ inputValue, setInputValue ] = useState(
		// 	'Create a content about Mariana Enriquez. Please add a background image to the composition. And please, in Spanish.'
		// );

		// AI Assistant component visibility
		const [ isVisible, setAssistantVisibility ] = useState( false );

		// AI Assistant component is-fixed state
		const [ isFixed, setAssistantFixed ] = useState( false );

		const [ assistantAnchor, setAssistantAnchor ] = useState< HTMLElement | null >( null );

		const { replaceInnerBlocks, insertBlocks } = useDispatch( 'core/block-editor' );
		const coreEditorSelect = useSelect( select => select( 'core/editor' ), [] ) as {
			getCurrentPostId: () => number;
		};
		const postId = coreEditorSelect.getCurrentPostId();

		/**
		 * Show the AI Assistant
		 *
		 * @returns {void}
		 */
		const show = useCallback( () => {
			setAssistantVisibility( true );
		}, [] );

		/**
		 * Hide the AI Assistant
		 *
		 * @returns {void}
		 */
		const hide = useCallback( () => {
			setAssistantVisibility( false );
		}, [] );

		/**
		 * Toggle the AI Assistant visibility
		 *
		 * @returns {void}
		 */
		const toggle = useCallback( () => {
			setAssistantVisibility( ! isVisible );
		}, [ isVisible ] );

		/**
		 * Set the AI Assistant anchor
		 *
		 * @param {HTMLElement} anchor
		 */
		const setAnchor = useCallback( ( anchor: HTMLElement | null ) => {
			setAssistantAnchor( anchor );
		}, [] );

		/**
		 * Select the Jetpack Form block
		 *
		 * @returns {void}
		 */
		const selectFormBlock = useCallback( () => {
			dispatch( 'core/block-editor' ).selectBlock( clientId ).then( toggle );
		}, [ clientId, toggle ] );

		const { createNotice } = useDispatch( noticesStore );

		/**
		 * Show the error notice
		 *
		 * @param {RequestingErrorProps} suggestionError
		 * @returns {void}
		 */
		const showSuggestionError = useCallback(
			( { severity, message, code }: RequestingErrorProps ) => {
				if ( code !== ERROR_QUOTA_EXCEEDED ) {
					createNotice( severity, message, {
						isDismissible: true,
						id: AI_ASSISTANT_JETPACK_FORM_NOTICE_ID,
					} );
				}
			},
			[ createNotice ]
		);

		// Show/hide the assistant based on the block selection.
		useEffect( () => {
			if ( isSelected ) {
				return;
			}
			hide();
		}, [ isSelected, hide ] );

		// Build the context value to pass to the provider.
		const contextValue = useMemo(
			() => ( {
				// Value of the input element.
				inputValue,
				setInputValue,

				// Assistant bar visibility.
				isVisible,
				show,
				hide,
				toggle,

				// Assistant bar position and size.
				isFixed,
				setAssistantFixed,

				// Assistant bar anchor.
				assistantAnchor,
				setAnchor,
			} ),
			[ inputValue, isVisible, show, hide, toggle, isFixed, assistantAnchor, setAnchor ]
		);

		// Create a temporary block to use like a container
		const containerBlock = createBlock( 'core/group', { type: 'constrained', align: 'wide' }, [] );
		const { clientId: containerBlockId } = containerBlock;
		const containerBlockWasInserted = useRef( false );

		const setContent = useCallback(
			( newContent: string ) => {
				if ( ! containerBlockWasInserted?.current ) {
					// Insert the container block
					insertBlocks( containerBlock, clientId );
					containerBlockWasInserted.current = true;
				}

				let jsonContent = [];
				try {
					const repairedContent = jsonrepair( newContent );
					jsonContent = JSON.parse( repairedContent );
				} catch ( e ) {
					console.error( 'Error parsing JSON: ', e ); // eslint-disable-line no-console
				}

				let parsedBlocks = [];
				try {
					parsedBlocks = parseBlocksFromJson( jsonContent );
					// Filter out invalid blocks
					parsedBlocks = parsedBlocks?.length
						? parsedBlocks.filter( block => {
								return block.isValid && block.name !== 'core/freeform';
						  } )
						: [];
				} catch ( e ) {
					console.error( 'Error parsing blocks: ', e ); // eslint-disable-line no-console
				}

				// console.log( { parsedBlocks } );
				if ( parsedBlocks?.length ) {
					// Only update the valid blocks
					replaceInnerBlocks( containerBlockId, parsedBlocks );
					// insertBlocks( parsedBlocks, clientId );

					// Update the list of current valid blocks
					// currentListOfValidBlocks.current = parsedBlocks;
				}
			},
			[ clientId, containerBlock, containerBlockId, insertBlocks, replaceInnerBlocks ]
		);

		useAiContext( {
			askQuestionOptions: { postId },
			onDone: setContent,
			onSuggestion: setContent,
			onError: showSuggestionError,
		} );

		/*
		 * Ensure to provide data context,
		 * and the AI Assistant component (popover)
		 * only if is't possible to extend the block.
		 */
		if ( ! isPossibleToExtendJetpackFormBlock( props.name ) ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<AiAssistantUiContextProvider value={ contextValue }>
				<KeyboardShortcuts
					shortcuts={ {
						'mod+/': selectFormBlock,
					} }
				>
					<BlockListBlock { ...props } />
				</KeyboardShortcuts>
			</AiAssistantUiContextProvider>
		);
	};
}, 'withUiHandlerDataProvider' );

export default withUiHandlerDataProvider;
